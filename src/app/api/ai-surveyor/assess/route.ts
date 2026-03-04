import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readDocumentContent } from "@/lib/document-reader";
import { assessActivities, type SubStandardInput } from "@/lib/ai";
import { logTokenUsage } from "@/lib/token-usage-log";
import { getActivitiesBySubStandardId } from "@/data/mock";
import { getLibraryDocument, getLibraryDocumentByKey } from "@/lib/document-assessment-store";

export const maxDuration = 60;

/**
 * POST /api/ai-surveyor/assess
 * Accepts multipart: file (or libraryKey) + subStandardIds (JSON array)
 * If libraryKey is provided, document is read from the library; otherwise file is used.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const libraryKey = formData.get("libraryKey") as string | null;
    const libraryId = formData.get("libraryId") as string | null;
    const subStandardIdsRaw = formData.get("subStandardIds");

    let documentContent: string;
    let fileName: string;

    if (libraryId || (libraryKey && libraryKey.trim())) {
      const libDoc = libraryId
        ? getLibraryDocument(libraryId)
        : getLibraryDocumentByKey(libraryKey!.trim());
      if (!libDoc) {
        return NextResponse.json(
          { error: "Library document not found" },
          { status: 400 }
        );
      }
      const fullPath = path.join(process.cwd(), "public", libDoc.key);
      let buffer: Buffer;
      try {
        buffer = readFileSync(fullPath);
      } catch (err) {
        console.error("Read library file error:", err);
        return NextResponse.json(
          { error: "Document file could not be read" },
          { status: 400 }
        );
      }
      documentContent = readDocumentContent(buffer, libDoc.documentName, `Uploaded: ${libDoc.documentName}`);
      fileName = libDoc.documentName;
    } else if (file && file instanceof File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileName = file.name || "document";
      documentContent = readDocumentContent(buffer, fileName, `Uploaded: ${fileName}`);
    } else {
      return NextResponse.json({ error: "No file or library document provided" }, { status: 400 });
    }

    let subStandardIds: string[] = [];
    if (typeof subStandardIdsRaw === "string" && subStandardIdsRaw.trim()) {
      try {
        subStandardIds = JSON.parse(subStandardIdsRaw) as string[];
      } catch {
        subStandardIds = subStandardIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (subStandardIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one standard/substandard to assess" },
        { status: 400 }
      );
    }

    const subStandards: SubStandardInput[] = [];
    for (const ssId of subStandardIds) {
      const result = getActivitiesBySubStandardId(ssId);
      if (!result) continue;
      const ss = result.sub_standard;
      subStandards.push({
        subStandardId: ss.id,
        code: ss.code ?? ssId,
        name: ss.name,
        activities: result.activities.map((a) => ({
          id: a.id,
          label: a.label,
          description: a.description ?? "",
          type: a.type,
        })),
      });
    }

    if (subStandards.length === 0) {
      return NextResponse.json(
        { error: "No activities found for the selected substandards" },
        { status: 400 }
      );
    }

    const result = await assessActivities(documentContent, fileName, subStandards);

    if (result.usage) {
      logTokenUsage("ai-surveyor/assess", fileName, result.usage);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("AI Surveyor assess error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Assessment failed" },
      { status: 500 }
    );
  }
}
