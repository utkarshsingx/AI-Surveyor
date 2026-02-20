import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const accreditation = await prisma.accreditation.findUnique({
      where: { id: params.id },
      include: {
        chapters: {
          orderBy: { sortOrder: "asc" },
          include: {
            standards: {
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
            },
            chapterScores: true,
          },
        },
        projects: {
          select: { id: true, overallScore: true, status: true },
        },
      },
    });

    if (!accreditation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = {
      id: accreditation.id,
      name: accreditation.name,
      code: accreditation.code,
      description: accreditation.description,
      version: accreditation.version,
      status: accreditation.status,
      created_at: accreditation.createdAt.toISOString(),
      project_count: accreditation.projects.length,
      overall_progress:
        accreditation.projects.length > 0
          ? Math.round(
              accreditation.projects.reduce((s, p) => s + p.overallScore, 0) /
                accreditation.projects.length
            )
          : 0,
      chapters: accreditation.chapters.map((ch) => ({
        id: ch.id,
        accreditation_id: ch.accreditationId,
        code: ch.code,
        name: ch.name,
        description: ch.description,
        sort_order: ch.sortOrder,
        total_standards: ch.standards.length,
        score: ch.chapterScores.length > 0 ? ch.chapterScores[0].score : undefined,
        standards: ch.standards.map((std) => ({
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
            measurable_elements: ss.measurableElements.map((me) => ({
              id: me.id,
              code: me.code,
              text: me.text,
              criticality: me.criticality,
              required_evidence_type: JSON.parse(me.requiredEvidenceType),
              keywords: JSON.parse(me.keywords),
              departments: JSON.parse(me.departments),
              scoring_rule: me.scoringRule,
            })),
            activities: ss.activities.map((act) => ({
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
            })),
          })),
        })),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/accreditations/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch accreditation" }, { status: 500 });
  }
}
