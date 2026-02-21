import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/copilot/history — get chat history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const messages = await prisma.copilotMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json(messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
        sources: m.sources ? JSON.parse(m.sources) : undefined,
        feedback: m.feedback,
      })));
    }

    // Return all conversations
    const conversations = await prisma.copilotConversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // If no conversations, return the seeded messages  
    if (conversations.length === 0) {
      return NextResponse.json([]);
    }

    const latestConv = conversations[0];
    return NextResponse.json({
      conversationId: latestConv.id,
      messages: latestConv.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
        sources: m.sources ? JSON.parse(m.sources) : undefined,
        feedback: m.feedback,
      })),
    });
  } catch (error) {
    console.warn("Copilot history error (e.g. DB unavailable):", error);
    return NextResponse.json({ conversationId: null, messages: [] });
  }
}
