import { NextRequest, NextResponse } from "next/server";
import { readDocumentContent } from "@/lib/document-reader";
import { assessActivities, type SubStandardInput } from "@/lib/ai";
import { logTokenUsage } from "@/lib/token-usage-log";
import { getActivitiesBySubStandardId } from "@/data/mock";

export const maxDuration = 60;

/**
 * POST /api/ai-surveyor/assess
 * Accepts multipart: file + subStandardIds (JSON array)
 * Loads activities for each substandard, sends to AI, returns per-activity met/partially_met/not_met.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subStandardIdsRaw = formData.get("subStandardIds");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name || "document";
    const documentContent = readDocumentContent(buffer, fileName, `Uploaded: ${fileName}`);

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
