import { NextRequest, NextResponse } from "next/server";
import { mockPolicies } from "@/data/mock";
import type { MockPolicy } from "@/data/mock/policies";
import { getCreatedPolicies, addCreatedPolicy } from "@/lib/policy-store";

function getAllPolicies(): MockPolicy[] {
  return [...mockPolicies, ...getCreatedPolicies()];
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  let list = getAllPolicies();
  if (category) list = list.filter((p) => p.category === category);
  if (status) list = list.filter((p) => p.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.department && p.department.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }

  return NextResponse.json(
    list.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      category: p.category,
      department: p.department,
      description: p.description,
      file_type: p.file_type,
      file_path: p.file_path,
      version: p.version,
      status: p.status,
      effective_date: p.effective_date,
      review_date: p.review_date,
      owner: p.owner,
      mapped_sub_standards: p.mapped_sub_standards,
    }))
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = {
      name: formData.get("name") ?? "",
      code: formData.get("code") ?? null,
      category: formData.get("category") ?? "policy",
      department: formData.get("department") ?? "",
      description: formData.get("description") ?? "",
      file_path: formData.get("file_path") ?? "",
      file_type: formData.get("file_type") ?? "application/pdf",
      version: formData.get("version") ?? "1.0",
      status: formData.get("status") ?? "active",
      effective_date: formData.get("effective_date") ?? null,
      review_date: formData.get("review_date") ?? null,
      owner: formData.get("owner") ?? "",
      mapped_sub_standards: formData.get("mapped_sub_standards") ? JSON.parse(String(formData.get("mapped_sub_standards"))) : [],
    };
  } else {
    body = await req.json().catch(() => ({}));
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled Policy";
  const id = `POL-${Date.now()}`;
  const newPolicy: MockPolicy = {
    id,
    name,
    code: (body.code as string) || null,
    category: (body.category as string) || "policy",
    department: (body.department as string) || "",
    description: (body.description as string) || "",
    file_type: (body.file_type as string) || "application/pdf",
    file_path: (body.file_path as string) || "",
    version: (body.version as string) || "1.0",
    status: (body.status as string) || "active",
    effective_date: (body.effective_date as string) || null,
    review_date: (body.review_date as string) || null,
    owner: (body.owner as string) || "",
    mapped_sub_standards: Array.isArray(body.mapped_sub_standards) ? body.mapped_sub_standards : [],
  };
  addCreatedPolicy(newPolicy);

  return NextResponse.json({ id }, { status: 201 });
}
