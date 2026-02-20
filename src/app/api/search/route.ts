import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const lower = q.toLowerCase();

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

    const projects = await prisma.surveyProject.findMany({
      where: { name: { contains: lower } },
      take: 5,
    });

    const standards = await prisma.standard.findMany({
      where: {
        OR: [
          { code: { contains: lower } },
          { standardName: { contains: lower } },
        ],
      },
      include: { chapter: { select: { name: true } } },
      take: 5,
    });

    const mes = await prisma.measurableElement.findMany({
      where: {
        OR: [
          { code: { contains: lower } },
          { text: { contains: lower } },
        ],
      },
      take: 5,
    });

    const accreditations = await prisma.accreditation.findMany({
      where: {
        OR: [
          { name: { contains: lower } },
          { code: { contains: lower } },
        ],
      },
      take: 3,
    });

    return NextResponse.json({
      results: [
        ...accreditations.map(a => ({ type: "accreditation", id: a.id, title: a.name, subtitle: a.code })),
        ...evidence.map(e => ({ type: "evidence", id: e.id, title: e.documentName, subtitle: e.department })),
        ...projects.map(p => ({ type: "project", id: p.id, title: p.name, subtitle: p.status })),
        ...standards.map(s => ({ type: "standard", id: s.id, title: `${s.code} - ${s.standardName}`, subtitle: s.chapter.name })),
        ...mes.map(m => ({ type: "me", id: m.id, title: m.code, subtitle: m.text.substring(0, 80) })),
      ],
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
