import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/assessments/[id]/results — get compliance scores from an assessment
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: params.id },
      include: {
        complianceScores: {
          include: { evidenceMatches: true },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const scores = assessment.complianceScores.map(cs => ({
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

    return NextResponse.json({
      assessmentId: assessment.id,
      status: assessment.status,
      progress: assessment.progress,
      scores,
    });
  } catch (error) {
    console.error("Assessment results error:", error);
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
  }
}
