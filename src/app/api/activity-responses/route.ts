import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    const subStandardId = req.nextUrl.searchParams.get("subStandardId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { projectId };
    if (subStandardId) {
      const activities = await prisma.activity.findMany({
        where: { subStandardId },
        select: { id: true },
      });
      where.activityId = { in: activities.map((a) => a.id) };
    }

    const responses = await prisma.activityResponse.findMany({ where });

    return NextResponse.json(
      responses.map((r) => ({
        id: r.id,
        activity_id: r.activityId,
        project_id: r.projectId,
        value: r.value,
        status: r.status,
        notes: r.notes,
        files: JSON.parse(r.files),
        updated_at: r.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/activity-responses error:", error);
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { activityId, projectId, value, status, notes, files } = body;

    if (!activityId || !projectId) {
      return NextResponse.json({ error: "activityId and projectId required" }, { status: 400 });
    }

    const response = await prisma.activityResponse.upsert({
      where: {
        activityId_projectId: { activityId, projectId },
      },
      update: {
        value: value ?? "",
        status: status ?? "completed",
        notes: notes ?? "",
        files: JSON.stringify(files ?? []),
      },
      create: {
        activityId,
        projectId,
        value: value ?? "",
        status: status ?? "completed",
        notes: notes ?? "",
        files: JSON.stringify(files ?? []),
      },
    });

    return NextResponse.json({
      id: response.id,
      activity_id: response.activityId,
      project_id: response.projectId,
      value: response.value,
      status: response.status,
      notes: response.notes,
      files: JSON.parse(response.files),
      updated_at: response.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/activity-responses error:", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
