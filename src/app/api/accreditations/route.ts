import { NextResponse } from "next/server";
import { mockAccreditationsList } from "@/data/mock";

// GET /api/accreditations — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockAccreditationsList);
}
