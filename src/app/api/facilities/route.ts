import { NextResponse } from "next/server";
import { mockFacilities } from "@/data/mock";

export const dynamic = "force-dynamic";

// GET /api/facilities — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockFacilities);
}
