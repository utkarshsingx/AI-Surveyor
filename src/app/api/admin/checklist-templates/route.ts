import { NextRequest, NextResponse } from "next/server";
import { mockChecklistTemplate } from "@/data/mock";

export const dynamic = "force-dynamic";

// GET /api/admin/checklist-templates — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockChecklistTemplate);
}

// PUT /api/admin/checklist-templates — no-op when using mock (state not persisted)
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { items } = body;
  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
