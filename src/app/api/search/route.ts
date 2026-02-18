import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/search?q=query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const lower = q.toLowerCase();

    // Search evidence
    const evidence = await prisma.evidence.findMany({
      where: {
        OR: [
          { documentName: { contains: lower } },
          { department: { contains: lower } },
          { summary: { contains: lower } },
        ],
      },
      take: 5,
    });

    // Search projects
    const projects = await prisma.surveyProject.findMany({
      where: { name: { contains: lower } },
      take: 5,
    });

    // Search standards
    const standards = await prisma.standard.findMany({
      where: {
        OR: [
          { chapterName: { contains: lower } },
          { standardName: { contains: lower } },
        ],
      },
      take: 5,
    });

    // Search MEs
    const mes = await prisma.measurableElement.findMany({
      where: {
        OR: [
          { code: { contains: lower } },
          { text: { contains: lower } },
        ],
      },
      take: 5,
    });

    return NextResponse.json({
      results: [
        ...evidence.map(e => ({ type: "evidence", id: e.id, title: e.documentName, subtitle: e.department })),
        ...projects.map(p => ({ type: "project", id: p.id, title: p.name, subtitle: p.status })),
        ...standards.map(s => ({ type: "standard", id: s.id, title: s.chapterName, subtitle: s.standardName })),
        ...mes.map(m => ({ type: "me", id: m.id, title: m.code, subtitle: m.text.substring(0, 80) })),
      ],
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
