import { NextResponse } from "next/server";
import { mockActivityLog } from "@/data/mock";

// GET /api/activity-log — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockActivityLog);
}
