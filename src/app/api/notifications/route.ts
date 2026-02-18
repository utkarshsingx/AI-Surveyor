import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/notifications
export async function GET() {
  try {
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      return NextResponse.json([]);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: defaultUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      link: n.link,
      created_at: n.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        await prisma.notification.updateMany({
          where: { userId: defaultUser.id, read: false },
          data: { read: true },
        });
      }
    } else if (id) {
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
