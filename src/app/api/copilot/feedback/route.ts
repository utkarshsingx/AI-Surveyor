import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/copilot/feedback — save thumbs up/down feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, feedback } = body;

    if (!messageId || !feedback) {
      return NextResponse.json({ error: "messageId and feedback required" }, { status: 400 });
    }

    await prisma.copilotMessage.update({
      where: { id: messageId },
      data: { feedback },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Copilot feedback error:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
