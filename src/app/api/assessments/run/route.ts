import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeCompliance } from "@/lib/ai";

// POST /api/assessments/run — start an AI assessment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, chapterFilter } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const project = await prisma.surveyProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all evidence documents
    const evidence = await prisma.evidence.findMany();
    const documents = evidence.map(ev => ({
      id: ev.id,
      name: ev.documentName,
      summary: ev.summary,
      type: ev.type,
    }));

    // Get measurable elements (filtered by chapter if specified)
    let meWhere = {};
    if (chapterFilter && chapterFilter !== "all") {
      const standard = await prisma.standard.findFirst({
        where: { chapterId: chapterFilter },
      });
      if (standard) {
        const subStandards = await prisma.subStandard.findMany({
          where: { standardId: standard.id },
        });
        meWhere = { subStandardId: { in: subStandards.map(ss => ss.id) } };
      }
    }

    const measurableElements = await prisma.measurableElement.findMany({
      where: meWhere,
    });

    // Create assessment record
    const assessment = await prisma.assessment.create({
      data: {
        projectId,
        standardVersion: project.standardVersion,
        chapterFilter: chapterFilter || null,
        status: "processing",
        totalMes: measurableElements.length,
        processedMes: 0,
      },
    });

    // Run AI analysis (this happens synchronously for simplicity, 
    // in production you'd use a job queue)
    const meData = measurableElements.map(me => ({
      id: me.id,
      code: me.code,
      text: me.text,
      keywords: JSON.parse(me.keywords),
      requiredEvidenceType: JSON.parse(me.requiredEvidenceType),
    }));

    const results = await analyzeCompliance(documents, meData, async (processed, total) => {
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { processedMes: processed, progress: Math.round((processed / total) * 100) },
      });
    });

    // Save compliance scores and evidence matches
    for (const result of results) {
      const complianceScore = await prisma.complianceScore.create({
        data: {
          assessmentId: assessment.id,
          meId: result.meId,
          meCode: result.meCode,
          meText: result.meText,
          aiScore: result.aiScore,
          aiConfidence: result.aiConfidence,
          matchScore: result.matchScore,
          justification: result.justification,
          evidenceMissing: JSON.stringify(result.evidenceMissing),
          gaps: JSON.stringify(result.gaps),
          recommendations: JSON.stringify(result.recommendations),
        },
      });

      // Save evidence matches
      for (const match of result.evidenceMatches) {
        if (match.evidenceId) {
          await prisma.evidenceMatch.create({
            data: {
              complianceScoreId: complianceScore.id,
              evidenceId: match.evidenceId,
              documentName: match.documentName,
              relevanceScore: match.relevanceScore,
              matchedSections: JSON.stringify(match.matchedSections),
            },
          });
        }
      }

      // Generate corrective actions for non-compliant / partial
      if (result.aiScore === "non-compliant" || result.aiScore === "partial") {
        await prisma.correctiveAction.upsert({
          where: { id: `CA-${result.meId}` },
          create: {
            id: `CA-${result.meId}`,
            projectId,
            meId: result.meId,
            meCode: result.meCode,
            gapDescription: result.gaps.join("; ") || `Gap in ${result.meCode}`,
            actionType: "evidence_creation",
            recommendedAction: result.recommendations.join("; ") || `Address gaps for ${result.meCode}`,
            assignedDepartment: "Quality",
            assignedTo: "Unassigned",
            dueDate: project.deadline,
            priority: result.aiScore === "non-compliant" ? "high" : "medium",
            status: "open",
          },
          update: {
            gapDescription: result.gaps.join("; ") || `Gap in ${result.meCode}`,
            recommendedAction: result.recommendations.join("; ") || `Address gaps for ${result.meCode}`,
          },
        });
      }
    }

    // Calculate chapter scores
    const standards = await prisma.standard.findMany({
      include: {
        subStandards: {
          include: { measurableElements: true },
        },
      },
    });

    for (const std of standards) {
      const chapterMeIds = std.subStandards.flatMap(ss => ss.measurableElements.map(me => me.id));
      const chapterResults = results.filter(r => chapterMeIds.includes(r.meId));

      if (chapterResults.length === 0) continue;

      const compliant = chapterResults.filter(r => r.aiScore === "compliant").length;
      const partial = chapterResults.filter(r => r.aiScore === "partial").length;
      const nonCompliant = chapterResults.filter(r => r.aiScore === "non-compliant").length;
      const notApplicable = chapterResults.filter(r => r.aiScore === "not-applicable").length;
      const scored = chapterResults.length - notApplicable;
      const score = scored > 0 ? Math.round(((compliant + partial * 0.5) / scored) * 100) : 0;

      await prisma.chapterScore.upsert({
        where: {
          projectId_chapterId: { projectId, chapterId: std.chapterId },
        },
        create: {
          projectId,
          chapterId: std.chapterId,
          chapterName: std.chapterName,
          score,
          totalMes: chapterResults.length,
          compliant,
          partial,
          nonCompliant,
          notApplicable,
        },
        update: { score, totalMes: chapterResults.length, compliant, partial, nonCompliant, notApplicable },
      });
    }

    // Calculate overall score
    const allChapterScores = await prisma.chapterScore.findMany({
      where: { projectId },
    });
    const overallScore = allChapterScores.length > 0
      ? Math.round(allChapterScores.reduce((sum, cs) => sum + cs.score, 0) / allChapterScores.length)
      : 0;

    // Update project and assessment
    await prisma.surveyProject.update({
      where: { id: projectId },
      data: { overallScore, status: "in-progress" },
    });

    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        progress: 100,
        processedMes: measurableElements.length,
      },
    });

    // Log activity
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      await prisma.activityLog.create({
        data: {
          action: "AI Assessment run",
          userId: defaultUser.id,
          details: `Assessment completed — ${overallScore}% overall readiness`,
          type: "scan",
        },
      });
    }

    return NextResponse.json({
      assessmentId: assessment.id,
      status: "completed",
      overallScore,
      totalMes: results.length,
      compliant: results.filter(r => r.aiScore === "compliant").length,
      partial: results.filter(r => r.aiScore === "partial").length,
      nonCompliant: results.filter(r => r.aiScore === "non-compliant").length,
    });
  } catch (error) {
    console.error("Assessment run error:", error);
    return NextResponse.json({ error: "Assessment failed" }, { status: 500 });
  }
}
