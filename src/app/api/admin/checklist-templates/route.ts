import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/checklist-templates
export async function GET() {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (templates.length === 0) {
      return NextResponse.json({ id: "", standard_id: "", items: [] });
    }

    const t = templates[0];
    return NextResponse.json({
      id: t.id,
      standard_id: t.standardId,
      items: t.items.map(item => ({
        id: item.id,
        me_code: item.meCode,
        category: item.category,
        label: item.label,
        description: item.description,
        type: item.type,
        required: item.required,
        options: JSON.parse(item.options),
        value: item.value ? (item.type === "boolean" ? item.value === "true" : item.type === "number" ? Number(item.value) : item.value) : undefined,
        evidence_files: JSON.parse(item.evidenceFiles),
      })),
    });
  } catch (error) {
    console.error("Checklist GET error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// PUT /api/admin/checklist-templates — save template items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    // Get first template
    const template = await prisma.checklistTemplate.findFirst();
    if (!template) {
      return NextResponse.json({ error: "No template found" }, { status: 404 });
    }

    // Delete existing items and recreate
    await prisma.checklistItem.deleteMany({ where: { templateId: template.id } });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const me = await prisma.measurableElement.findFirst({ where: { code: item.me_code } });

      await prisma.checklistItem.create({
        data: {
          templateId: template.id,
          meCode: item.me_code,
          meId: me?.id || null,
          category: item.category,
          label: item.label,
          description: item.description || "",
          type: item.type || "boolean",
          required: item.required ?? true,
          options: JSON.stringify(item.options || []),
          value: item.value !== undefined ? String(item.value) : null,
          evidenceFiles: JSON.stringify(item.evidence_files || []),
          sortOrder: i,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checklist PUT error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
