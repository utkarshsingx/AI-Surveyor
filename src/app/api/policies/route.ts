import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const policies = await prisma.policy.findMany({
      where,
      include: { mappings: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      policies.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        category: p.category,
        department: p.department,
        description: p.description,
        file_type: p.fileType,
        file_path: p.filePath,
        version: p.version,
        status: p.status,
        effective_date: p.effectiveDate,
        review_date: p.reviewDate,
        owner: p.owner,
        mapped_sub_standards: p.mappings.map((m) => m.subStandardId),
      }))
    );
  } catch (error) {
    console.error("GET /api/policies error:", error);
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const policy = await prisma.policy.create({
      data: {
        name: body.name,
        code: body.code || null,
        category: body.category || "policy",
        department: body.department || "",
        description: body.description || "",
        fileType: body.file_type || "",
        filePath: body.file_path || "",
        version: body.version || "1.0",
        status: body.status || "active",
        effectiveDate: body.effective_date || null,
        reviewDate: body.review_date || null,
        owner: body.owner || "",
      },
    });

    if (body.mapped_sub_standards?.length) {
      for (const ssId of body.mapped_sub_standards) {
        await prisma.policyMapping.create({
          data: { policyId: policy.id, subStandardId: ssId },
        });
      }
    }

    return NextResponse.json({ id: policy.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/policies error:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}
