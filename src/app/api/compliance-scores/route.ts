import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/compliance-scores — get all compliance scores (latest assessment)
export async function GET() {
  try {
    const latestAssessment = await prisma.assessment.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      include: {
        complianceScores: {
          include: { evidenceMatches: true },
        },
      },
    });

    if (!latestAssessment) {
      return NextResponse.json([]);
    }

    const scores = latestAssessment.complianceScores.map(cs => ({
      id: cs.id,
      me_id: cs.meId,
      me_code: cs.meCode,
      me_text: cs.meText,
      ai_score: cs.aiScore,
      ai_confidence: cs.aiConfidence,
      match_score: cs.matchScore,
      reviewer_score: cs.reviewerScore,
      reviewer_comment: cs.reviewerComment,
      justification: cs.justification,
      evidence_found: cs.evidenceMatches.map(em => ({
        evidence_id: em.evidenceId,
        document_name: em.documentName,
        relevance_score: em.relevanceScore,
        matched_sections: JSON.parse(em.matchedSections),
      })),
      evidence_missing: JSON.parse(cs.evidenceMissing),
      gaps: JSON.parse(cs.gaps),
      recommendations: JSON.parse(cs.recommendations),
    }));

    return NextResponse.json(scores);
  } catch (error) {
    console.error("Compliance scores GET error:", error);
    return NextResponse.json({ error: "Failed to load scores" }, { status: 500 });
  }
}

// PATCH /api/compliance-scores — save reviewer override
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { scoreId, reviewerScore, reviewerComment } = body;

    if (!scoreId) {
      return NextResponse.json({ error: "scoreId required" }, { status: 400 });
    }

    const updated = await prisma.complianceScore.update({
      where: { id: scoreId },
      data: {
        reviewerScore: reviewerScore || undefined,
        reviewerComment: reviewerComment || undefined,
      },
    });

    // Log activity
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      await prisma.activityLog.create({
        data: {
          action: "Score override",
          userId: defaultUser.id,
          details: `Override ${updated.meCode} to '${reviewerScore}' with comment`,
          type: "override",
        },
      });
    }

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error("Compliance score PATCH error:", error);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }
}
