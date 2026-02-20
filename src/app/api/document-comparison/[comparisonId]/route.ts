import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/document-comparison/[comparisonId]
 * 
 * Retrieves the results of a document comparison by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { comparisonId: string } }
) {
  try {
    const { comparisonId } = params;

    const comparison = await prisma.documentComparison.findUnique({
      where: { id: comparisonId },
      include: {
        userEvidence: {
          select: {
            id: true,
            documentName: true,
            type: true,
            department: true,
          },
        },
        masterDocument: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
          },
        },
      },
    });

    if (!comparison) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: comparison.id,
      userEvidenceId: comparison.userEvidenceId,
      masterDocumentId: comparison.masterDocumentId,
      matchingPercentage: comparison.matchingPercentage,
      status: comparison.status,
      overallSummary: comparison.overallSummary,
      keyMatches: JSON.parse(comparison.keyMatches),
      gaps: JSON.parse(comparison.gaps),
      recommendations: JSON.parse(comparison.recommendations),
      detailedAnalysis: comparison.detailedAnalysis,
      createdAt: comparison.createdAt,
      completedAt: comparison.completedAt,
      userEvidence: comparison.userEvidence,
      masterDocument: comparison.masterDocument,
    });
  } catch (error) {
    console.error("Fetch comparison error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/document-comparison/[comparisonId]
 * 
 * Deletes a document comparison record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { comparisonId: string } }
) {
  try {
    const { comparisonId } = params;

    const comparison = await prisma.documentComparison.delete({
      where: { id: comparisonId },
    });

    return NextResponse.json({
      success: true,
      message: "Comparison deleted successfully",
      id: comparison.id,
    });
  } catch (error) {
    console.error("Delete comparison error:", error);
    return NextResponse.json(
      { error: "Failed to delete comparison" },
      { status: 500 }
    );
  }
}
