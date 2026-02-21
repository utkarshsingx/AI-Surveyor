import { NextRequest, NextResponse } from "next/server";
import { mockMasterDocuments } from "@/data/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  let filtered = mockMasterDocuments;
  if (search) {
    const lower = search.toLowerCase();
    filtered = mockMasterDocuments.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.mapped_mes.some((code) => code.toLowerCase().includes(lower))
    );
  }
  return NextResponse.json(filtered);
}

// POST — mock only (no database); returns success with stub id/name
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { name } = body;
  const resolvedName = typeof name === "string" && name.trim() ? name.trim() : "Untitled Master Document";
  return NextResponse.json({ id: "MD-mock-new", name: resolvedName }, { status: 201 });
}
