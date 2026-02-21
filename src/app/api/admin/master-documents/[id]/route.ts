import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/admin/master-documents/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.masterDocument.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Master doc DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PUT /api/admin/master-documents/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.category) updateData.category = body.category;
    if (body.status) updateData.status = body.status;

    await prisma.masterDocument.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Master doc PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
