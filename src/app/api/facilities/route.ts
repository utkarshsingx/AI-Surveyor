import { NextResponse } from "next/server";
import { mockFacilities } from "@/data/mock";

// GET /api/facilities — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockFacilities);
}
