import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/standards — list all standards with sub-standards and MEs
export async function GET() {
  try {
    const standards = await prisma.standard.findMany({
      include: {
        subStandards: {
          include: {
            measurableElements: true,
          },
        },
      },
    });

    const formatted = standards.map(std => ({
      id: std.id,
      chapter_id: std.chapterId,
      chapter_name: std.chapterName,
      standard_name: std.standardName,
      description: std.description,
      version: std.version,
      criticality: std.criticality,
      sub_standards: std.subStandards.map(ss => ({
        id: ss.id,
        name: ss.name,
        measurable_elements: ss.measurableElements.map(me => ({
          id: me.id,
          code: me.code,
          text: me.text,
          criticality: me.criticality,
          required_evidence_type: JSON.parse(me.requiredEvidenceType),
          keywords: JSON.parse(me.keywords),
          departments: JSON.parse(me.departments),
          scoring_rule: me.scoringRule,
        })),
      })),
    }));

    return NextResponse.json({ standards: formatted });
  } catch (error) {
    console.error("Standards GET error:", error);
    return NextResponse.json({ error: "Failed to load standards" }, { status: 500 });
  }
}
