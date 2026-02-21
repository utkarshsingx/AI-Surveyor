import { NextRequest, NextResponse } from "next/server";
import { mockCorrectiveActions } from "@/data/mock";

// GET /api/corrective-actions — uses mock data (no database)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  let actions = mockCorrectiveActions;
  if (projectId) {
    actions = mockCorrectiveActions.filter((a) => a.project_id === projectId);
  }
  return NextResponse.json(actions);
}

// PATCH /api/corrective-actions — no-op when using mock (state not persisted)
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  return NextResponse.json({ success: true });
}
