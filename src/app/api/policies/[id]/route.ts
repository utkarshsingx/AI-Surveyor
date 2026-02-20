import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.policy.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/policies/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
