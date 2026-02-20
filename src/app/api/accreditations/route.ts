import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const accreditations = await prisma.accreditation.findMany({
      include: {
        chapters: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, code: true, name: true },
        },
        projects: {
          select: { id: true, overallScore: true, status: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = accreditations.map((a) => {
      const activeProjects = a.projects.filter((p) => p.status !== "completed");
      const avgScore =
        a.projects.length > 0
          ? Math.round(a.projects.reduce((sum, p) => sum + p.overallScore, 0) / a.projects.length)
          : 0;

      return {
        id: a.id,
        name: a.name,
        code: a.code,
        description: a.description,
        version: a.version,
        status: a.status,
        created_at: a.createdAt.toISOString(),
        chapters: a.chapters.map((ch) => ({
          id: ch.id,
          code: ch.code,
          name: ch.name,
        })),
        project_count: a.projects.length,
        active_projects: activeProjects.length,
        overall_progress: avgScore,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/accreditations error:", error);
    return NextResponse.json({ error: "Failed to fetch accreditations" }, { status: 500 });
  }
}
