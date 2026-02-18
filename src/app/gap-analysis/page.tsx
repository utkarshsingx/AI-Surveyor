"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchComplianceScores, fetchCorrectiveActions, saveReviewOverride, fetchProjects } from "@/lib/api-client";
import type { ComplianceScore, CorrectiveAction, SurveyProject } from "@/types";

export default function GapAnalysisPage() {
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [scores, setScores] = useState<ComplianceScore[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchComplianceScores(), fetchCorrectiveActions(), fetchProjects()])
      .then(([scoresData, actionsData, projectsData]) => {
        setScores(scoresData);
        setActions(actionsData);
        if (projectsData.length > 0) setProject(projectsData[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredScores = filterStatus === "all"
    ? scores
    : scores.filter(s => s.ai_score === filterStatus);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleSaveReview = async (score: ComplianceScore) => {
    const reviewerScore = overrides[score.me_id];
    if (!reviewerScore) return;
    setSaving(score.me_id);
    try {
      await saveReviewOverride({
        scoreId: score.me_id,
        reviewerScore,
        reviewerComment: comments[score.me_id] || undefined,
      });
      // Refresh scores
      const updated = await fetchComplianceScores();
      setScores(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const handleExport = () => {
    // Generate CSV export
    const header = "ME Code,ME Text,AI Score,Match Score,Confidence,Reviewer Score,Justification\n";
    const rows = scores
      .map(s => `"${s.me_code}","${s.me_text}","${s.ai_score}",${s.match_score},${s.ai_confidence},"${s.reviewer_score || ""}","${s.justification.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gap-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "border-green-200 bg-green-50/50";
      case "partial": return "border-yellow-200 bg-yellow-50/50";
      case "non-compliant": return "border-red-200 bg-red-50/50";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "partial": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "non-compliant": return <XCircle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gap Analysis</h1>
          <p className="text-sm text-muted-foreground">
            {project?.name || "Assessment"} — Detailed compliance gaps and reviewer panel
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export Gap Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fully Compliant</p>
                <p className="text-2xl font-bold text-green-600">
                  {scores.filter(s => s.ai_score === "compliant").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Partially Compliant</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {scores.filter(s => s.ai_score === "partial").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">
                  {scores.filter(s => s.ai_score === "non-compliant").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Corrective Actions</p>
                <p className="text-2xl font-bold text-primary">{actions.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary/20" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {actions.filter(a => a.status === "open").length} open
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gap Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Compliance Details — Reviewer Panel</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px] pr-4">
                <div className="space-y-3">
                  {filteredScores.map((score) => {
                    const isExpanded = expandedItems.has(score.me_id);
                    return (
                      <div
                        key={score.me_id}
                        className={`rounded-lg border p-4 transition-colors ${getStatusColor(score.ai_score)}`}
                      >
                        <button
                          className="flex w-full items-start justify-between text-left"
                          onClick={() => toggleExpand(score.me_id)}
                        >
                          <div className="flex items-start gap-3">
                            {getStatusIcon(score.ai_score)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-primary">{score.me_code}</span>
                                <Badge variant={score.ai_score === "compliant" ? "success" : score.ai_score === "partial" ? "warning" : "destructive"}>
                                  {score.match_score}% match
                                </Badge>
                                {score.reviewer_score && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Reviewer: {score.reviewer_score}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm">{score.me_text}</p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="mb-1 text-xs font-semibold text-muted-foreground">AI SCORE</h4>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(score.ai_score)}
                                  <span className="text-sm font-medium capitalize">{score.ai_score.replace("-", " ")}</span>
                                  <span className="text-xs text-muted-foreground">({score.ai_confidence}% confidence)</span>
                                </div>
                              </div>
                              <div>
                                <h4 className="mb-1 text-xs font-semibold text-muted-foreground">REVIEWER OVERRIDE</h4>
                                <Select
                                  value={overrides[score.me_id] || ""}
                                  onValueChange={(v) => setOverrides(prev => ({ ...prev, [score.me_id]: v }))}
                                >
                                  <SelectTrigger className="h-8 bg-white">
                                    <SelectValue placeholder="Accept AI score" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="compliant">Compliant</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> AI JUSTIFICATION
                              </h4>
                              <p className="rounded-md bg-white/70 p-3 text-sm">{score.justification}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="mb-1 text-xs font-semibold text-green-700">EVIDENCE FOUND</h4>
                                {score.evidence_found.length > 0 ? (
                                  <div className="space-y-1">
                                    {score.evidence_found.map(ev => (
                                      <div key={ev.evidence_id} className="flex items-center gap-2 text-xs">
                                        <FileText className="h-3 w-3 text-green-600" />
                                        <span>{ev.document_name}</span>
                                        <Badge variant="success" className="text-[9px]">{ev.relevance_score}%</Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">None found</p>
                                )}
                              </div>
                              <div>
                                <h4 className="mb-1 text-xs font-semibold text-red-700">EVIDENCE MISSING</h4>
                                {score.evidence_missing.length > 0 ? (
                                  <ul className="space-y-1">
                                    {score.evidence_missing.map((m, i) => (
                                      <li key={i} className="flex items-start gap-1 text-xs text-red-600">
                                        <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {m}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-green-600">All evidence provided</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-1 text-xs font-semibold text-muted-foreground">REVIEWER COMMENTS</h4>
                              <Textarea
                                placeholder="Add reviewer comments..."
                                className="h-16 bg-white text-sm"
                                value={comments[score.me_id] || ""}
                                onChange={e => setComments(prev => ({ ...prev, [score.me_id]: e.target.value }))}
                              />
                            </div>

                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleSaveReview(score)}
                                disabled={!overrides[score.me_id] || saving === score.me_id}
                              >
                                {saving === score.me_id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                Save Review
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredScores.length === 0 && (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No compliance scores yet. Run an AI assessment first.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Corrective Actions Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Corrective Action Plan</CardTitle>
              <CardDescription>AI-generated actions for gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px] pr-4">
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{action.me_code}</span>
                          <Badge variant={action.priority === "critical" ? "destructive" : action.priority === "high" ? "warning" : "secondary"} className="text-[10px]">
                            {action.priority}
                          </Badge>
                        </div>
                        <Badge variant={action.status === "completed" ? "success" : action.status === "in-progress" ? "default" : "outline"} className="text-[10px]">
                          {action.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs font-medium">{action.gap_description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{action.recommended_action}</p>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{action.assigned_department}</span>
                        <span>Due: {action.due_date}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">Assigned to: {action.assigned_to}</p>
                    </div>
                  ))}
                  {actions.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">No corrective actions yet.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
