import { NextRequest, NextResponse } from "next/server";
import { mockProjects, mockFacilities } from "@/data/mock";

// GET /api/projects — uses mock data (no database)
export async function GET() {
  return NextResponse.json(mockProjects);
}

// POST /api/projects — mock only (no database); returns success with stub project
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { name, facilityId, accreditationId, standardVersion, scope, selectedChapters, departments, deadline, teamMembers } = body;
  if (!name || !facilityId || !deadline) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const facility = mockFacilities.find((f) => f.id === facilityId);
  return NextResponse.json(
    { id: "PRJ-mock-new", name: String(name), facility: facility?.name ?? "Unknown", status: "draft" },
    { status: 201 }
  );
}
