import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const standards = await prisma.standard.findMany({
      where: { chapterId: params.id },
      orderBy: { sortOrder: "asc" },
      include: {
        subStandards: {
          orderBy: { sortOrder: "asc" },
          include: {
            measurableElements: true,
            activities: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    const result = standards.map((std) => ({
      id: std.id,
      chapter_id: std.chapterId,
      code: std.code,
      standard_name: std.standardName,
      description: std.description,
      criticality: std.criticality,
      sort_order: std.sortOrder,
      sub_standards: std.subStandards.map((ss) => ({
        id: ss.id,
        standard_id: ss.standardId,
        code: ss.code,
        name: ss.name,
        sort_order: ss.sortOrder,
        total_activities: ss.activities.length,
        total_mes: ss.measurableElements.length,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/chapters/[id]/standards error:", error);
    return NextResponse.json({ error: "Failed to fetch standards" }, { status: 500 });
  }
}
