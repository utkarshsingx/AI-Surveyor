import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseJsonFields<T extends Record<string, unknown>>(obj: T, fields: string[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string") {
      try {
        (result as Record<string, unknown>)[field] = JSON.parse(result[field] as string);
      } catch {
        (result as Record<string, unknown>)[field] = [];
      }
    }
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const facilityId = req.nextUrl.searchParams.get("facilityId");

    const projectWhere = facilityId ? { facilityId } : {};

    const projects = await prisma.surveyProject.findMany({
      where: projectWhere,
      include: {
        facility: true,
        accreditation: true,
        chapterScores: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const activityLogs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const latestAssessment = await prisma.assessment.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      include: {
        complianceScores: { include: { evidenceMatches: true } },
      },
    });

    const complianceScores = (latestAssessment?.complianceScores || []).map(cs =>
      parseJsonFields(cs, ["evidenceMissing", "gaps", "recommendations"])
    );

    const accreditations = await prisma.accreditation.findMany({
      include: {
        chapters: { orderBy: { sortOrder: "asc" }, select: { id: true, code: true, name: true } },
        projects: { select: { id: true, overallScore: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      facility: p.facility.name,
      facility_id: p.facilityId,
      accreditation_id: p.accreditationId,
      accreditation_name: p.accreditation?.name || "",
      standard_version: p.standardVersion,
      scope: p.scope,
      selected_chapters: JSON.parse(p.selectedChapters),
      departments: JSON.parse(p.departments),
      status: p.status,
      created_by: p.createdBy.name,
      created_on: p.createdAt.toISOString().split("T")[0],
      updated_on: p.updatedAt.toISOString().split("T")[0],
      deadline: p.deadline,
      team_members: JSON.parse(p.teamMembers),
      overall_score: p.overallScore,
      chapter_scores: p.chapterScores.map(cs => ({
        chapter_id: cs.chapterId,
        chapter_name: cs.chapterName,
        score: cs.score,
        total_mes: cs.totalMes,
        compliant: cs.compliant,
        partial: cs.partial,
        non_compliant: cs.nonCompliant,
        not_applicable: cs.notApplicable,
      })),
    }));

    const formattedLogs = activityLogs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user?.name || "System",
      timestamp: log.createdAt.toISOString(),
      details: log.details,
      type: log.type,
    }));

    const formattedScores = complianceScores.map(cs => ({
      me_id: cs.meId,
      me_code: cs.meCode,
      me_text: cs.meText,
      ai_score: cs.aiScore,
      ai_confidence: cs.aiConfidence,
      match_score: cs.matchScore,
      reviewer_score: cs.reviewerScore,
      justification: cs.justification,
      evidence_found: cs.evidenceMatches.map((em: { evidenceId: string; documentName: string; relevanceScore: number; matchedSections: string }) => ({
        evidence_id: em.evidenceId,
        document_name: em.documentName,
        relevance_score: em.relevanceScore,
        matched_sections: typeof em.matchedSections === "string" ? JSON.parse(em.matchedSections) : em.matchedSections,
      })),
      evidence_missing: cs.evidenceMissing,
      gaps: cs.gaps,
      recommendations: cs.recommendations,
    }));

    const formattedAccreditations = accreditations.map(a => ({
      id: a.id,
      name: a.name,
      code: a.code,
      description: a.description,
      version: a.version,
      status: a.status,
      created_at: a.createdAt.toISOString(),
      chapters: a.chapters,
      project_count: a.projects.length,
      overall_progress: a.projects.length > 0
        ? Math.round(a.projects.reduce((s, p) => s + p.overallScore, 0) / a.projects.length)
        : 0,
    }));

    return NextResponse.json({
      projects: formattedProjects,
      activityLog: formattedLogs,
      complianceScores: formattedScores,
      accreditations: formattedAccreditations,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
