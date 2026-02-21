import { NextRequest, NextResponse } from "next/server";
import { readDocumentContent } from "@/lib/document-reader";
import { analyzePolicyCompliance } from "@/lib/ai";
import { addReport } from "@/lib/document-assessment-store";
import { mockPolicies } from "@/data/mock";
import { getCreatedPolicies } from "@/lib/policy-store";
import type { MockPolicy } from "@/data/mock/policies";
import { randomUUID } from "crypto";

function getAllPolicies(): MockPolicy[] {
  return [...mockPolicies, ...getCreatedPolicies()];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const policyIdsRaw = formData.get("policyIds");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    let policyIds: string[] = [];
    if (typeof policyIdsRaw === "string" && policyIdsRaw.trim()) {
      try {
        policyIds = JSON.parse(policyIdsRaw) as string[];
      } catch {
        policyIds = policyIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    if (policyIds.length === 0) {
      return NextResponse.json({ error: "Select at least one policy to map against" }, { status: 400 });
    }

    const allPolicies = getAllPolicies();
    const selected = allPolicies.filter((p) => policyIds.includes(p.id));
    if (selected.length === 0) {
      return NextResponse.json({ error: "Selected policies not found" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name || "document";
    const userContent = readDocumentContent(buffer, fileName, `Uploaded document: ${fileName}`);

    const policiesWithContent: { id: string; name: string; description: string; category: string; content: string }[] = [];
    for (const p of selected) {
      let content = p.description || "";
      if (p.file_path) {
        try {
          content = readDocumentContent(p.file_path, p.name, p.description || "");
        } catch {
          content = p.description || `Policy: ${p.name}`;
        }
      }
      policiesWithContent.push({
        id: p.id,
        name: p.name,
        description: p.description || "",
        category: p.category,
        content,
      });
    }

    const result = await analyzePolicyCompliance(
      { name: fileName, content: userContent },
      policiesWithContent
    );

    const reportId = randomUUID();
    const report = {
      reportId,
      documentName: fileName,
      analyzedAt: new Date().toISOString(),
      ...result,
    };
    addReport(report);

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    console.error("Document assessment analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
