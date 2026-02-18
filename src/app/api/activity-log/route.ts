import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/activity-log
export async function GET() {
  try {
    const logs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = logs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user?.name || "System",
      timestamp: log.createdAt.toISOString(),
      details: log.details,
      type: log.type,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Activity log GET error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
