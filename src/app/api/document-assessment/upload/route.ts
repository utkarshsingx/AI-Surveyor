import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { addPendingDocument } from "@/lib/document-assessment-store";

/**
 * POST /api/document-assessment/upload
 * Upload a document for later assessment. File is saved and added to pending queue.
 * Hourly cron should call POST /api/document-assessment/process-pending to analyze against all policies.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const ext = path.extname(file.name) || ".pdf";
    const id = randomUUID();
    const safeName = `${id}${ext}`;
    const relativePath = `/uploads/self-assessment/${safeName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const dir = path.join(process.cwd(), "public", "uploads", "self-assessment");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, safeName), buffer);
    } catch (err) {
      console.warn("Upload document-assessment: could not write file", err);
    }

    addPendingDocument(relativePath, file.name);

    return NextResponse.json({
      key: relativePath,
      documentName: file.name,
      message: "Document uploaded. It will be automatically assessed within the next hour against all policies.",
    }, { status: 201 });
  } catch (err) {
    console.error("Upload document-assessment error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
