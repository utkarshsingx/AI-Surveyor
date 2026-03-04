import { NextResponse } from "next/server";
import { listLibraryDocuments } from "@/lib/document-assessment-store";

/**
 * GET /api/document-assessment/library
 * List documents uploaded via Admin configuration for AI assessment.
 */
export async function GET() {
  try {
    const docs = listLibraryDocuments();
    return NextResponse.json(docs, { status: 200 });
  } catch (err) {
    console.error("List library error:", err);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}
