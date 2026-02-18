import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.surveyProject.findUnique({
      where: { id: params.id },
      include: {
        facility: true,
        chapterScores: true,
        createdBy: { select: { name: true } },
        correctiveActions: true,
        assessments: { orderBy: { startedAt: "desc" }, take: 1 },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      facility: project.facility.name,
      facility_id: project.facilityId,
      standard_version: project.standardVersion,
      scope: project.scope,
      selected_chapters: JSON.parse(project.selectedChapters),
      departments: JSON.parse(project.departments),
      status: project.status,
      created_by: project.createdBy.name,
      created_on: project.createdAt.toISOString().split("T")[0],
      updated_on: project.updatedAt.toISOString().split("T")[0],
      deadline: project.deadline,
      team_members: JSON.parse(project.teamMembers),
      overall_score: project.overallScore,
      chapter_scores: project.chapterScores.map(cs => ({
        chapter_id: cs.chapterId,
        chapter_name: cs.chapterName,
        score: cs.score,
        total_mes: cs.totalMes,
        compliant: cs.compliant,
        partial: cs.partial,
        non_compliant: cs.nonCompliant,
        not_applicable: cs.notApplicable,
      })),
    });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name) updateData.name = body.name;
    if (body.status) updateData.status = body.status;
    if (body.deadline) updateData.deadline = body.deadline;
    if (body.scope) updateData.scope = body.scope;
    if (body.overallScore !== undefined) updateData.overallScore = body.overallScore;
    if (body.selectedChapters) updateData.selectedChapters = JSON.stringify(body.selectedChapters);
    if (body.departments) updateData.departments = JSON.stringify(body.departments);
    if (body.teamMembers) updateData.teamMembers = JSON.stringify(body.teamMembers);

    const project = await prisma.surveyProject.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ id: project.id, status: project.status });
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.surveyProject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
