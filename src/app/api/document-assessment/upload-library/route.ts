import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { addLibraryDocument } from "@/lib/document-assessment-store";

/**
 * POST /api/document-assessment/upload-library
 * Upload a document to the library for use in AI assessment (Admin configuration).
 * File is saved under public/uploads/self-assessment and added to the library list.
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
    const relativeKey = "uploads/self-assessment/" + safeName;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const dir = path.join(process.cwd(), "public", "uploads", "self-assessment");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, safeName), buffer);
    } catch (err) {
      console.warn("Upload library: could not write file", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    addLibraryDocument(id, relativeKey, file.name);

    return NextResponse.json(
      { id, key: relativeKey, documentName: file.name, uploadedAt: new Date().toISOString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload library error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
