import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatWithCopilot } from "@/lib/ai";

// POST /api/copilot/chat — send a message to the AI co-pilot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const defaultUser = await prisma.user.findFirst();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.copilotConversation.create({
        data: { title: message.substring(0, 50) },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.copilotMessage.create({
      data: {
        conversationId: convId,
        userId: defaultUser?.id,
        role: "user",
        content: message,
      },
    });

    // Get context for AI
    const latestProject = await prisma.surveyProject.findFirst({ orderBy: { updatedAt: "desc" }, include: { facility: true } });
    const latestAssessment = await prisma.assessment.findFirst({
      where: { status: "completed" },
      orderBy: { completedAt: "desc" },
      include: { complianceScores: true },
    });

    const evidence = await prisma.evidence.findMany({ take: 20 });

    const context = {
      projectName: latestProject?.name || "N/A",
      facilityName: latestProject?.facility?.name || "N/A",
      complianceData: latestAssessment?.complianceScores
        .map(cs => `${cs.meCode}: ${cs.aiScore} (${cs.matchScore}% match)`)
        .join("\n") || "No assessment data",
      evidenceList: evidence.map(e => `${e.documentName} (${e.type})`).join("\n"),
    };

    // Get AI response
    const aiResponse = await chatWithCopilot(message, context);

    // Save assistant message
    const assistantMsg = await prisma.copilotMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: aiResponse.content,
        sources: JSON.stringify(aiResponse.sources),
      },
    });

    return NextResponse.json({
      id: assistantMsg.id,
      conversationId: convId,
      role: "assistant",
      content: aiResponse.content,
      timestamp: assistantMsg.createdAt.toISOString(),
      sources: aiResponse.sources,
    });
  } catch (error) {
    console.error("Copilot chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
