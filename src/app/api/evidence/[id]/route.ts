import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/evidence/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evidence = await prisma.evidence.findUnique({
      where: { id: params.id },
      include: { uploadedBy: { select: { name: true } } },
    });

    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: evidence.id,
      document_name: evidence.documentName,
      type: evidence.type,
      department: evidence.department,
      file_type: evidence.fileType,
      file_size: evidence.fileSize,
      uploaded_by: evidence.uploadedBy.name,
      upload_date: evidence.uploadDate.toISOString().split("T")[0],
      version: evidence.version,
      owner: evidence.owner,
      summary: evidence.summary,
      status: evidence.status,
    });
  } catch (error) {
    console.error("Evidence GET error:", error);
    return NextResponse.json({ error: "Failed to load evidence" }, { status: 500 });
  }
}

// DELETE /api/evidence/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.evidence.delete({ where: { id: params.id } });

    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      await prisma.activityLog.create({
        data: {
          action: "Evidence deleted",
          userId: defaultUser.id,
          details: `Deleted evidence ${params.id}`,
          type: "system",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evidence DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete evidence" }, { status: 500 });
  }
}
