import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compareDocuments, estimateDocumentComparisonUsage } from "@/lib/ai";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

/**
 * POST /api/document-comparison/compare
 * 
 * Compares a user-uploaded document with an admin master document
 * and generates a matching report.
 * 
 * Request body:
 * {
 *   "userEvidenceId": "evidence_id",
 *   "masterDocumentId": "master_doc_id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userEvidenceId, masterDocumentId } = await request.json();

    // Validate inputs
    if (!userEvidenceId || !masterDocumentId) {
      return NextResponse.json(
        { error: "Missing required fields: userEvidenceId, masterDocumentId" },
        { status: 400 }
      );
    }

    // Fetch user evidence document
    const userEvidence = await prisma.evidence.findUnique({
      where: { id: userEvidenceId },
    });

    if (!userEvidence) {
      return NextResponse.json(
        { error: "User evidence document not found" },
        { status: 404 }
      );
    }

    // Fetch master document
    const masterDocument = await prisma.masterDocument.findUnique({
      where: { id: masterDocumentId },
      include: { chapter: true },
    });

    if (!masterDocument) {
      return NextResponse.json(
        { error: "Master document not found" },
        { status: 404 }
      );
    }

    const readDocumentContent = (filePath: string, fallback: string) => {
      if (!filePath) return fallback;
      try {
        const fullPath = join(process.cwd(), "public", filePath);
        return readFileSync(fullPath, "utf-8");
      } catch {
        return fallback;
      }
    };

    // Check for existing comparison
    let comparison = await prisma.documentComparison.findFirst({
      where: {
        userEvidenceId,
        masterDocumentId,
      },
    });

    // If already exists and completed, return it
    if (comparison && comparison.status === "completed") {
      const userContent = readDocumentContent(
        userEvidence.filePath,
        userEvidence.summary || `Document: ${userEvidence.documentName}`
      );
      const masterContent = readDocumentContent(
        masterDocument.filePath,
        masterDocument.description || `Document: ${masterDocument.name}`
      );
      const usage = estimateDocumentComparisonUsage(
        {
          id: userEvidence.id,
          name: userEvidence.documentName,
          content: userContent,
          summary: userEvidence.summary,
        },
        {
          id: masterDocument.id,
          name: masterDocument.name,
          content: masterContent,
          description: masterDocument.description,
        },
        masterDocument.chapter
          ? {
              name: masterDocument.chapter.name,
              description: masterDocument.chapter.description,
            }
          : undefined
      );

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
        usage,
        createdAt: comparison.createdAt,
        completedAt: comparison.completedAt,
      });
    }

    // Create a pending comparison record if it doesn't exist
    if (!comparison) {
      comparison = await prisma.documentComparison.create({
        data: {
          userEvidenceId,
          masterDocumentId,
          status: "processing",
        },
      });
    } else {
      // Update status to processing
      comparison = await prisma.documentComparison.update({
        where: { id: comparison.id },
        data: {
          status: "processing",
          processedAt: new Date(),
        },
      });
    }

    // Read file contents
    let userContent = "";
    let masterContent = "";

    userContent = readDocumentContent(
      userEvidence.filePath,
      userEvidence.summary || `Document: ${userEvidence.documentName}`
    );

    masterContent = readDocumentContent(
      masterDocument.filePath,
      masterDocument.description || `Document: ${masterDocument.name}`
    );

    // Call AI comparison function
    const comparisonResult = await compareDocuments(
      {
        id: userEvidence.id,
        name: userEvidence.documentName,
        content: userContent,
        summary: userEvidence.summary,
      },
      {
        id: masterDocument.id,
        name: masterDocument.name,
        content: masterContent,
        description: masterDocument.description,
      },
      masterDocument.chapter
        ? {
            name: masterDocument.chapter.name,
            description: masterDocument.chapter.description,
          }
        : undefined
    );

    // Update comparison with results
    const updatedComparison = await prisma.documentComparison.update({
      where: { id: comparison.id },
      data: {
        status: "completed",
        matchingPercentage: comparisonResult.matchingPercentage,
        overallSummary: comparisonResult.overallSummary,
        keyMatches: JSON.stringify(comparisonResult.keyMatches),
        gaps: JSON.stringify(comparisonResult.gaps),
        recommendations: JSON.stringify(comparisonResult.recommendations),
        detailedAnalysis: comparisonResult.detailedAnalysis,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedComparison.id,
      userEvidenceId: updatedComparison.userEvidenceId,
      masterDocumentId: updatedComparison.masterDocumentId,
      matchingPercentage: updatedComparison.matchingPercentage,
      status: updatedComparison.status,
      overallSummary: updatedComparison.overallSummary,
      keyMatches: JSON.parse(updatedComparison.keyMatches),
      gaps: JSON.parse(updatedComparison.gaps),
      recommendations: JSON.parse(updatedComparison.recommendations),
      detailedAnalysis: updatedComparison.detailedAnalysis,
      usage: comparisonResult.usage,
      createdAt: updatedComparison.createdAt,
      completedAt: updatedComparison.completedAt,
    });
  } catch (error) {
    console.error("Document comparison error:", error);
    return NextResponse.json(
      {
        error: "Failed to process document comparison",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
