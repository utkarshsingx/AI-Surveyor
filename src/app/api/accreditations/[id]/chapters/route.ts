import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chapters = await prisma.chapter.findMany({
      where: { accreditationId: params.id },
      orderBy: { sortOrder: "asc" },
      include: {
        standards: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, code: true, standardName: true },
        },
        chapterScores: {
          select: { score: true, totalMes: true, compliant: true, partial: true, nonCompliant: true },
        },
      },
    });

    const result = chapters.map((ch) => ({
      id: ch.id,
      accreditation_id: ch.accreditationId,
      code: ch.code,
      name: ch.name,
      description: ch.description,
      sort_order: ch.sortOrder,
      total_standards: ch.standards.length,
      standards: ch.standards.map((s) => ({
        id: s.id,
        code: s.code,
        standard_name: s.standardName,
      })),
      score: ch.chapterScores.length > 0 ? ch.chapterScores[0].score : undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/accreditations/[id]/chapters error:", error);
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}
