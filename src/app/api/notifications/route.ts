import { NextRequest, NextResponse } from "next/server";
import { mockNotifications } from "@/data/mock";

// GET /api/notifications — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockNotifications);
}

// PATCH /api/notifications — no-op when using mock (state not persisted)
export async function PATCH(_request: NextRequest) {
  return NextResponse.json({ success: true });
}
