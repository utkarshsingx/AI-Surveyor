import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const docs = await prisma.masterDocument.findMany({
      include: {
        uploadedBy: { select: { name: true } },
        chapter: { select: { id: true, code: true, name: true } },
        mappings: { include: { me: { select: { code: true } } } },
      },
      orderBy: { uploadDate: "desc" },
    });

    let filtered = docs;
    if (search) {
      const lower = search.toLowerCase();
      filtered = docs.filter(d =>
        d.name.toLowerCase().includes(lower) ||
        d.mappings.some(m => m.me.code.toLowerCase().includes(lower))
      );
    }

    const formatted = filtered.map(d => ({
      id: d.id,
      name: d.name,
      chapter_id: d.chapterId,
      chapter_name: d.chapter.name,
      description: d.description,
      file_type: d.fileType,
      uploaded_by: d.uploadedBy.name,
      upload_date: d.uploadDate.toISOString().split("T")[0],
      mapped_mes: d.mappings.map(m => m.me.code),
      version: d.version,
      category: d.category,
      status: d.status,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Master docs GET error:", error);
    return NextResponse.json({ error: "Failed to load master documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, mappedMeCodes, chapterId, fileType, description } = body;

    const resolvedName = typeof name === "string" && name.trim() ? name.trim() : "Untitled Master Document";

    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: { name: "System User", email: "system@ai-surveyor.local", role: "admin" },
      });
    }

    let resolvedChapterId = chapterId;
    if (!resolvedChapterId) {
      const firstChapter = await prisma.chapter.findFirst();
      resolvedChapterId = firstChapter?.id || "";
    }

    const safePathToken = resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const doc = await prisma.masterDocument.create({
      data: {
        name: resolvedName,
        chapterId: resolvedChapterId,
        description: description || "",
        fileType: fileType || "application/pdf",
        filePath: `/uploads/master/${safePathToken || "master-doc"}`,
        uploadedById: defaultUser.id,
        category: category || "policy",
        status: "active",
      },
    });

    if (mappedMeCodes && Array.isArray(mappedMeCodes)) {
      for (const code of mappedMeCodes) {
        const me = await prisma.measurableElement.findFirst({ where: { code: code.trim() } });
        if (me) {
          await prisma.masterDocMapping.create({
            data: { masterDocumentId: doc.id, meId: me.id },
          });
        }
      }
    }

    return NextResponse.json({ id: doc.id, name: doc.name }, { status: 201 });
  } catch (error) {
    console.error("Master doc POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
