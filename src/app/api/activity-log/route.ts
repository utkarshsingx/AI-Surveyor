import { NextResponse } from "next/server";
import { mockActivityLog } from "@/data/mock";

export const dynamic = "force-dynamic";

// GET /api/activity-log — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockActivityLog);
}
