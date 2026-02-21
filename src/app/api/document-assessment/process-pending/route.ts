import { NextRequest, NextResponse } from "next/server";
import { getNextPendingDocument, addReport, removePendingByKey } from "@/lib/document-assessment-store";
import { readDocumentContent } from "@/lib/document-reader";
import { analyzePolicyCompliance } from "@/lib/ai";
import { mockPolicies, getCreatedPolicies } from "@/data/mock";
import type { MockPolicy } from "@/data/mock/policies";
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

function getAllPolicies(): MockPolicy[] {
  return [...mockPolicies, ...getCreatedPolicies()];
}

/**
 * POST or GET /api/document-assessment/process-pending
 * Call hourly (e.g. Vercel Cron) to process one uploaded document that has not been assessed.
 * Runs AI analysis against ALL available policies and generates a full report.
 * For cron: use GET with Authorization: Bearer <CRON_SECRET> if set.
 */
export async function POST() {
  return processOne();
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return processOne();
}

async function processOne() {
  try {
    const pending = getNextPendingDocument();
    if (!pending) {
      return NextResponse.json({ processed: false, message: "No pending documents" }, { status: 200 });
    }

    let userContent: string;
    try {
      const fullPath = join(process.cwd(), "public", pending.key);
      const buf = readFileSync(fullPath);
      userContent = readDocumentContent(buf, pending.documentName, `Document: ${pending.documentName}`);
    } catch (err) {
      console.error("Failed to read pending file:", pending.key, err);
      removePendingByKey(pending.key);
      return NextResponse.json({ processed: false, error: "Could not read pending file" }, { status: 500 });
    }

    const allPolicies = getAllPolicies();
    const policiesWithContent = allPolicies.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      category: p.category,
      content: p.file_path
        ? readDocumentContent(p.file_path, p.name, p.description || "").slice(0, 15000)
        : (p.description || `Policy: ${p.name}`),
    }));

    const result = await analyzePolicyCompliance(
      { name: pending.documentName, content: userContent },
      policiesWithContent
    );

    const reportId = randomUUID();
    addReport({
      reportId,
      documentName: pending.documentName,
      analyzedAt: new Date().toISOString(),
      ...result,
    });
    removePendingByKey(pending.key);

    return NextResponse.json({
      processed: true,
      reportId,
      documentName: pending.documentName,
      combinedScore: result.combinedScore,
    }, { status: 200 });
  } catch (err) {
    console.error("Process pending error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
