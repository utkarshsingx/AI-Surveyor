import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/corrective-actions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const actions = await prisma.correctiveAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formatted = actions.map(a => ({
      id: a.id,
      me_id: a.meId,
      me_code: a.meCode,
      gap_description: a.gapDescription,
      action_type: a.actionType,
      recommended_action: a.recommendedAction,
      assigned_department: a.assignedDepartment,
      assigned_to: a.assignedTo,
      due_date: a.dueDate,
      priority: a.priority,
      status: a.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Corrective actions GET error:", error);
    return NextResponse.json({ error: "Failed to load corrective actions" }, { status: 500 });
  }
}

// PATCH /api/corrective-actions — update status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assignedTo } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;

    await prisma.correctiveAction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Corrective action PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
