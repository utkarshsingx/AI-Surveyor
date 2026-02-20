import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeCompliance } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, chapterId, standardId, subStandardId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const project = await prisma.surveyProject.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Determine scope of MEs based on hierarchy level
    let meWhere: Record<string, unknown> = {};

    if (subStandardId) {
      meWhere = { subStandardId };
    } else if (standardId) {
      const subs = await prisma.subStandard.findMany({ where: { standardId }, select: { id: true } });
      meWhere = { subStandardId: { in: subs.map((s) => s.id) } };
    } else if (chapterId) {
      const standards = await prisma.standard.findMany({ where: { chapterId }, select: { id: true } });
      const subs = await prisma.subStandard.findMany({
        where: { standardId: { in: standards.map((s) => s.id) } },
        select: { id: true },
      });
      meWhere = { subStandardId: { in: subs.map((s) => s.id) } };
    }

    const measurableElements = await prisma.measurableElement.findMany({
      where: meWhere,
      select: { id: true, code: true, text: true, keywords: true, requiredEvidenceType: true },
    });

    if (measurableElements.length === 0) {
      return NextResponse.json({ error: "No measurable elements found in scope" }, { status: 400 });
    }

    // Gather evidence from project + activity responses
    const projectEvidence = await prisma.projectEvidence.findMany({
      where: { projectId },
      include: { evidence: true },
    });

    const documents = projectEvidence.map((pe) => ({
      id: pe.evidence.id,
      name: pe.evidence.documentName,
      summary: pe.evidence.summary,
      type: pe.evidence.type,
    }));

    // Also gather activity response data as additional evidence context
    const activityResponses = await prisma.activityResponse.findMany({
      where: { projectId },
      include: { activity: true },
    });

    for (const ar of activityResponses) {
      if (ar.value && ar.activity) {
        documents.push({
          id: `activity-${ar.id}`,
          name: `Activity: ${ar.activity.label}`,
          summary: `Type: ${ar.activity.type}, Value: ${ar.value}, Status: ${ar.status}`,
          type: ar.activity.type,
        });
      }
    }

    const meData = measurableElements.map((me) => ({
      id: me.id,
      code: me.code,
      text: me.text,
      keywords: JSON.parse(me.keywords) as string[],
      requiredEvidenceType: JSON.parse(me.requiredEvidenceType) as string[],
    }));

    // Create assessment record
    const assessment = await prisma.assessment.create({
      data: {
        projectId,
        standardVersion: project.standardVersion,
        chapterFilter: chapterId ? JSON.stringify([chapterId]) : null,
        status: "processing",
        totalMes: meData.length,
      },
    });

    // Run AI analysis
    const results = await analyzeCompliance(documents, meData);

    // Save results
    for (const result of results) {
      await prisma.complianceScore.create({
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
    }

    // Update assessment status
    const compliant = results.filter((r) => r.aiScore === "compliant").length;
    const partial = results.filter((r) => r.aiScore === "partial").length;
    const nonCompliant = results.filter((r) => r.aiScore === "non-compliant").length;
    const scored = compliant + partial + nonCompliant;
    const overallScore = scored > 0 ? Math.round(((compliant + partial * 0.5) / scored) * 100) : 0;

    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: "completed", completedAt: new Date(), processedMes: meData.length, progress: 100 },
    });

    return NextResponse.json({
      assessmentId: assessment.id,
      status: "completed",
      overallScore,
      results: results.map((r) => ({
        me_id: r.meId,
        me_code: r.meCode,
        me_text: r.meText,
        ai_score: r.aiScore,
        ai_confidence: r.aiConfidence,
        match_score: r.matchScore,
        justification: r.justification,
        evidence_missing: r.evidenceMissing,
        gaps: r.gaps,
        recommendations: r.recommendations,
      })),
    });
  } catch (error) {
    console.error("POST /api/assessments/self-assess error:", error);
    return NextResponse.json({ error: "Self-assessment failed" }, { status: 500 });
  }
}
