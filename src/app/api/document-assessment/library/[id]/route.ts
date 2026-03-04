import { NextRequest, NextResponse } from "next/server";
import { removeLibraryDocument } from "@/lib/document-assessment-store";

/**
 * DELETE /api/document-assessment/library/[id]
 * Remove a document from the library (in-memory list only; file on disk is not deleted).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Document id required" }, { status: 400 });
    }
    removeLibraryDocument(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Delete library document error:", err);
    return NextResponse.json({ error: "Failed to remove document" }, { status: 500 });
  }
}
