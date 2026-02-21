import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chatWithCopilot } from "@/lib/ai";

export const dynamic = "force-dynamic";

// POST /api/copilot/chat — send a message to the AI co-pilot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const context = {
      projectName: "N/A",
      facilityName: "N/A",
      complianceData: "No assessment data",
      evidenceList: "Not available",
    };

    let convId = conversationId;

    try {
      const defaultUser = await prisma.user.findFirst();

      if (!convId) {
        const conv = await prisma.copilotConversation.create({
          data: { title: message.substring(0, 50) },
        });
        convId = conv.id;
      }

      await prisma.copilotMessage.create({
        data: {
          conversationId: convId,
          userId: defaultUser?.id,
          role: "user",
          content: message,
        },
      });

      const latestProject = await prisma.surveyProject.findFirst({ orderBy: { updatedAt: "desc" }, include: { facility: true } });
      const latestAssessment = await prisma.assessment.findFirst({
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        include: { complianceScores: true },
      });
      const evidence = await prisma.evidence.findMany({ take: 20 });

      context.projectName = latestProject?.name || "N/A";
      context.facilityName = latestProject?.facility?.name || "N/A";
      context.complianceData = latestAssessment?.complianceScores
        ?.map(cs => `${cs.meCode}: ${cs.aiScore} (${cs.matchScore}% match)`)
        .join("\n") || "No assessment data";
      context.evidenceList = evidence.map(e => `${e.documentName} (${e.type})`).join("\n") || "Not available";
    } catch (dbError) {
      console.warn("Copilot: DB unavailable, responding without persistence.", dbError);
      if (!convId) convId = `temp-${Date.now()}`;
    }

    const aiResponse = await chatWithCopilot(message, context);

    try {
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
    } catch {
      return NextResponse.json({
        id: `msg-${Date.now()}`,
        conversationId: convId,
        role: "assistant",
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        sources: aiResponse.sources,
      });
    }
  } catch (error) {
    console.error("Copilot chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
