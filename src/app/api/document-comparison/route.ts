import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/document-comparison
 * 
 * Retrieves all document comparisons, optionally filtered by:
 * - userEvidenceId: Filter by specific user evidence document
 * - masterDocumentId: Filter by specific master document
 * - status: Filter by comparison status (pending, processing, completed, failed)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userEvidenceId = searchParams.get("userEvidenceId");
    const masterDocumentId = searchParams.get("masterDocumentId");
    const status = searchParams.get("status");

    const whereClause: Record<string, string> = {};

    if (userEvidenceId) {
      whereClause.userEvidenceId = userEvidenceId;
    }
    if (masterDocumentId) {
      whereClause.masterDocumentId = masterDocumentId;
    }
    if (status) {
      whereClause.status = status;
    }

    const comparisons = await prisma.documentComparison.findMany({
      where: whereClause,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse JSON fields
    const formattedComparisons = comparisons.map(comp => ({
      id: comp.id,
      userEvidenceId: comp.userEvidenceId,
      masterDocumentId: comp.masterDocumentId,
      matchingPercentage: comp.matchingPercentage,
      status: comp.status,
      overallSummary: comp.overallSummary,
      createdAt: comp.createdAt,
      completedAt: comp.completedAt,
      userEvidence: comp.userEvidence,
      masterDocument: comp.masterDocument,
    }));

    return NextResponse.json({
      count: formattedComparisons.length,
      comparisons: formattedComparisons,
    });
  } catch (error) {
    console.error("Fetch comparisons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparisons" },
      { status: 500 }
    );
  }
}
