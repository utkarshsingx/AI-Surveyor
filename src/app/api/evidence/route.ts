import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/evidence — list all evidence
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (type && type !== "all") where.type = type;
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { documentName: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const evidence = await prisma.evidence.findMany({
      where,
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { uploadDate: "desc" },
    });

    const formatted = evidence.map(ev => ({
      id: ev.id,
      document_name: ev.documentName,
      type: ev.type,
      department: ev.department,
      file_type: ev.fileType,
      file_size: ev.fileSize,
      uploaded_by: ev.uploadedBy.name,
      upload_date: ev.uploadDate.toISOString().split("T")[0],
      version: ev.version,
      owner: ev.owner,
      summary: ev.summary,
      status: ev.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Evidence GET error:", error);
    return NextResponse.json({ error: "Failed to load evidence" }, { status: 500 });
  }
}

// POST /api/evidence — create evidence record (for file upload metadata)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentName, type, department, fileType, fileSize, summary } = body;

    const resolvedName =
      typeof documentName === "string" && documentName.trim()
        ? documentName.trim()
        : "Untitled Evidence";

    if (!resolvedName) {
      return NextResponse.json({ error: "Document name required" }, { status: 400 });
    }

    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      const systemEmail = "system@ai-surveyor.local";
      defaultUser =
        (await prisma.user.findUnique({ where: { email: systemEmail } })) ||
        (await prisma.user.create({
          data: {
            name: "System User",
            email: systemEmail,
            role: "admin",
          },
        }));
    }

    const safePathToken = resolvedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const evidence = await prisma.evidence.create({
      data: {
        documentName: resolvedName,
        type: type || "policy",
        department: department || "General",
        fileType: fileType || "application/pdf",
        fileSize: fileSize || 0,
        filePath: `/uploads/${safePathToken || "evidence"}`,
        uploadedById: defaultUser.id,
        summary: summary || "",
        status: "pending",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "Evidence uploaded",
        userId: defaultUser.id,
        details: `Uploaded ${resolvedName}`,
        type: "upload",
      },
    });

    return NextResponse.json({
      id: evidence.id,
      document_name: evidence.documentName,
      status: evidence.status,
    }, { status: 201 });
  } catch (error) {
    console.error("Evidence POST error:", error);
    return NextResponse.json({ error: "Failed to create evidence" }, { status: 500 });
  }
}
