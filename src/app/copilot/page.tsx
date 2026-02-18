"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  FileText,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sendCopilotMessage, fetchCopilotHistory, sendCopilotFeedback } from "@/lib/api-client";
import type { CopilotMessage } from "@/types";

const suggestedQuestions = [
  "Why did we fail IPC.2.2?",
  "What evidence do we need for Patient Safety?",
  "Show corrective actions due this month",
  "Compare our Chapter 3 score to last year",
  "Which departments have the most gaps?",
  "Summarize medication management compliance",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing conversation
  useEffect(() => {
    fetchCopilotHistory()
      .then(data => {
        if (data.messages.length > 0) {
          setMessages(data.messages);
          setConversationId(data.conversationId);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isTyping) return;

    const userMsg: CopilotMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await sendCopilotMessage({
        message,
        conversationId: conversationId || undefined,
      });

      setConversationId(response.conversationId);

      const aiMsg: CopilotMessage = {
        id: response.id,
        role: "assistant",
        content: response.content,
        timestamp: response.timestamp,
        sources: response.sources,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Copilot error:", err);
      const errorMsg: CopilotMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: "positive" | "negative") => {
    try {
      await sendCopilotFeedback(messageId, feedback);
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleRegenerate = async () => {
    // Find the last user message and resend it
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMsg) {
      // Remove the last assistant message
      setMessages(prev => {
        const lastAssistantIdx = prev.map(m => m.role).lastIndexOf("assistant");
        if (lastAssistantIdx >= 0) {
          return prev.filter((_, i) => i !== lastAssistantIdx);
        }
        return prev;
      });
      setIsTyping(true);
      try {
        const response = await sendCopilotMessage({
          message: lastUserMsg.content,
          conversationId: conversationId || undefined,
        });
        const aiMsg: CopilotMessage = {
          id: response.id,
          role: "assistant",
          content: response.content,
          timestamp: response.timestamp,
          sources: response.sources,
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsTyping(false);
      }
    }
  };

  if (loadingHistory) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Co-Pilot</h1>
            <p className="text-xs text-muted-foreground">Ask anything about your accreditation survey</p>
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center py-20">
                  <div className="text-center">
                    <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-muted-foreground">Start a conversation</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Ask about your accreditation survey, gaps, or evidence</p>
                  </div>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content.split("\n").map((line, i) => {
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <React.Fragment key={i}>
                            {parts.map((part, j) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={j}>{part.slice(2, -2)}</strong>
                              ) : (
                                <span key={j}>{part}</span>
                              )
                            )}
                            {i < msg.content.split("\n").length - 1 && <br />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-border/50 pt-2">
                        <p className="text-[10px] font-medium uppercase text-muted-foreground">Sources</p>
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            {src.document_name}
                            {src.section && <span>({src.section})</span>}
                            <Badge variant="outline" className="ml-1 px-1 py-0 text-[9px]">
                              {Math.round(src.relevance * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.role === "assistant" && !msg.id.startsWith("error") && (
                      <div className="mt-2 flex items-center gap-1 border-t border-border/50 pt-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(msg.id, "positive")}>
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback(msg.id, "negative")}>
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRegenerate}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your accreditation survey..."
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="gap-2">
                <Send className="h-4 w-4" /> Send
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="hidden w-72 space-y-4 lg:block">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-yellow-500" /> Suggested Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="w-full rounded-md border border-border/50 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Active Project</span>
              <Badge variant="outline" className="text-[10px]">CBAHI 2026</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Facility</span><span>KFMC</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Standards</span><span>5 chapters</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Documents</span><span>847 indexed</span>
            </div>
            <Separator />
            <p className="text-[10px]">
              Co-Pilot uses RAG to answer questions based on your uploaded evidence and CBAHI standards.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
