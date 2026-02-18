import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/projects — list all projects
export async function GET() {
  try {
    const projects = await prisma.surveyProject.findMany({
      include: {
        facility: true,
        chapterScores: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = projects.map(p => ({
      id: p.id,
      name: p.name,
      facility: p.facility.name,
      facility_id: p.facilityId,
      standard_version: p.standardVersion,
      scope: p.scope,
      selected_chapters: JSON.parse(p.selectedChapters),
      departments: JSON.parse(p.departments),
      status: p.status,
      created_by: p.createdBy.name,
      created_on: p.createdAt.toISOString().split("T")[0],
      updated_on: p.updatedAt.toISOString().split("T")[0],
      deadline: p.deadline,
      team_members: JSON.parse(p.teamMembers),
      overall_score: p.overallScore,
      chapter_scores: p.chapterScores.map(cs => ({
        chapter_id: cs.chapterId,
        chapter_name: cs.chapterName,
        score: cs.score,
        total_mes: cs.totalMes,
        compliant: cs.compliant,
        partial: cs.partial,
        non_compliant: cs.nonCompliant,
        not_applicable: cs.notApplicable,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, facilityId, standardVersion, scope, selectedChapters, departments, deadline, teamMembers } = body;

    if (!name || !facilityId || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use first user as default creator
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json({ error: "No users found" }, { status: 500 });
    }

    const project = await prisma.surveyProject.create({
      data: {
        name,
        facilityId,
        standardVersion: standardVersion || "CBAHI-Sibahi 2026 v1.0",
        scope: scope || "full",
        selectedChapters: JSON.stringify(selectedChapters || []),
        departments: JSON.stringify(departments || ["All"]),
        deadline,
        teamMembers: JSON.stringify(teamMembers || [defaultUser.name]),
        createdById: defaultUser.id,
        status: "draft",
      },
      include: { facility: true, createdBy: { select: { name: true } } },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Survey project created",
        userId: defaultUser.id,
        details: `Created '${name}' project`,
        type: "system",
      },
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      facility: project.facility.name,
      status: project.status,
    }, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
