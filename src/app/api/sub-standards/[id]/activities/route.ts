import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");

    const subStandard = await prisma.subStandard.findUnique({
      where: { id: params.id },
      include: {
        measurableElements: true,
        activities: {
          orderBy: { sortOrder: "asc" },
          include: {
            responses: projectId
              ? { where: { projectId } }
              : false,
          },
        },
      },
    });

    if (!subStandard) {
      return NextResponse.json({ error: "Sub-standard not found" }, { status: 404 });
    }

    const activities = subStandard.activities.map((act) => {
      const response = projectId && act.responses && (act.responses as Array<{ id: string; activityId: string; projectId: string; value: string; status: string; notes: string; files: string; updatedAt: Date }>).length > 0
        ? (act.responses as Array<{ id: string; activityId: string; projectId: string; value: string; status: string; notes: string; files: string; updatedAt: Date }>)[0]
        : null;

      return {
        id: act.id,
        sub_standard_id: act.subStandardId,
        me_id: act.meId,
        type: act.type,
        label: act.label,
        description: act.description,
        field_type: act.fieldType,
        options: JSON.parse(act.options),
        required: act.required,
        sort_order: act.sortOrder,
        response: response
          ? {
              id: response.id,
              activity_id: response.activityId,
              project_id: response.projectId,
              value: response.value,
              status: response.status,
              notes: response.notes,
              files: JSON.parse(response.files),
              updated_at: response.updatedAt.toISOString(),
            }
          : undefined,
      };
    });

    const totalActivities = activities.length;
    const completedActivities = activities.filter((a) => a.response?.status === "completed").length;

    return NextResponse.json({
      sub_standard: {
        id: subStandard.id,
        code: subStandard.code,
        name: subStandard.name,
        sort_order: subStandard.sortOrder,
        measurable_elements: subStandard.measurableElements.map((me) => ({
          id: me.id,
          code: me.code,
          text: me.text,
          criticality: me.criticality,
        })),
      },
      activities,
      completion: {
        total: totalActivities,
        completed: completedActivities,
        percentage: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/sub-standards/[id]/activities error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
