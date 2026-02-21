import { NextRequest, NextResponse } from "next/server";
import { mockDashboard } from "@/data/mock";

// GET /api/dashboard — uses mock data (no database)
export async function GET(req: NextRequest) {
  const facilityId = req.nextUrl.searchParams.get("facilityId");
  let projects = mockDashboard.projects;
  if (facilityId) {
    projects = projects.filter((p) => p.facility_id === facilityId);
  }
  return NextResponse.json({
    projects,
    activityLog: mockDashboard.activityLog,
    complianceScores: mockDashboard.complianceScores,
    accreditations: mockDashboard.accreditations,
  });
}
