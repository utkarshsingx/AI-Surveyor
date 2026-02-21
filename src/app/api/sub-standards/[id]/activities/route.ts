import { NextRequest, NextResponse } from "next/server";
import { getActivitiesBySubStandardId } from "@/data/mock";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
  const result = getActivitiesBySubStandardId(params.id, projectId);
  if (!result) {
    return NextResponse.json({ error: "Sub-standard not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
