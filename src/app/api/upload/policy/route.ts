import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload/policy — upload a document file for a policy.
 * Saves to public/uploads/policies (works in dev; on Vercel returns path without persisting file).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const name = (file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(name) || ".pdf";
    const baseName = path.basename(name, ext) || "policy";
    const safeName = `${baseName}-${Date.now()}${ext}`;
    const relativePath = `/uploads/policies/${safeName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const dir = path.join(process.cwd(), "public", "uploads", "policies");
      await mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, safeName);
      await writeFile(fullPath, buffer);
    } catch (err) {
      console.warn("Upload policy: could not write file (e.g. serverless):", err);
      // Still return path so policy record can store it; file may not persist on Vercel
    }

    return NextResponse.json({
      file_path: relativePath,
      file_type: file.type || "application/octet-stream",
      file_name: file.name,
    });
  } catch (error) {
    console.error("Upload policy error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
