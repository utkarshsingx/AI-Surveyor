"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Download,
  Printer,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Building2,
  Users,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchProjects, fetchComplianceScores, fetchCorrectiveActions } from "@/lib/api-client";
import type { SurveyProject, ComplianceScore, CorrectiveAction } from "@/types";
import { mockComplianceScores, mockCorrectiveActions } from "@/data/mock-data";

const STANDARD_NEEDS_ATTENTION_THRESHOLD = 60; // Score below this: focus for manual surveyor

export default function ReportsPage() {
  const [project, setProject] = useState<SurveyProject | null>(null);
  const [scores, setScores] = useState<ComplianceScore[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetchProjects().catch(() => []),
      fetchComplianceScores().catch(() => mockComplianceScores),
      fetchCorrectiveActions().catch(() => mockCorrectiveActions),
    ])
      .then(([projects, scoresData, actionsData]) => {
        if (projects.length > 0) setProject(projects[0]);
        setScores(Array.isArray(scoresData) ? scoresData : mockComplianceScores);
        setActions(
          (Array.isArray(actionsData) ? actionsData : mockCorrectiveActions) as CorrectiveAction[]
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const compliant = scores.filter(s => s.ai_score === "compliant").length;
  const partial = scores.filter(s => s.ai_score === "partial").length;
  const nonCompliant = scores.filter(s => s.ai_score === "non-compliant").length;
  const total = scores.length;

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    // Trigger browser print dialog (save as PDF option)
    window.print();
  };

  const criticalGaps = scores.filter(s => s.ai_score === "non-compliant");
  const partialGaps = scores.filter(s => s.ai_score === "partial");
  const standardScores = project?.standard_scores ?? [];
  const standardsNeedingAttention = standardScores.filter(ss => ss.score < STANDARD_NEEDS_ATTENTION_THRESHOLD);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No project data available. Create a project and run an assessment first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export accreditation readiness reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Report Cover */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-between border-b pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Mock Survey Report</h1>
                  <p className="text-lg text-muted-foreground">AI Surveyor — AccrePro</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="mb-2" variant="default">CONFIDENTIAL</Badge>
                <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Facility:</strong> {project.facility}</span></div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Standard:</strong> {project.standard_version}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Assessment Date:</strong> {project.updated_on}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Scope:</strong> {project.scope === "full" ? "Full CBAHI" : "Partial"}</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Team:</strong> {project.team_members.join(", ")}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm"><strong>Deadline:</strong> {project.deadline}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Overall Accreditation Readiness</p>
              <p className={`text-6xl font-bold ${project.overall_score >= 80 ? "text-green-600" : project.overall_score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {project.overall_score}%
              </p>
              <Progress
                value={project.overall_score}
                className="mt-4 mx-auto h-4 max-w-md"
                indicatorClassName={project.overall_score >= 80 ? "bg-green-500" : project.overall_score >= 50 ? "bg-yellow-500" : "bg-red-500"}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{compliant}</p>
                <p className="text-sm text-green-700">Fully Compliant</p>
                <p className="text-xs text-muted-foreground">{total > 0 ? Math.round(compliant / total * 100) : 0}% of MEs</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
                <p className="text-3xl font-bold text-yellow-600">{partial}</p>
                <p className="text-sm text-yellow-700">Partially Compliant</p>
                <p className="text-xs text-muted-foreground">{total > 0 ? Math.round(partial / total * 100) : 0}% of MEs</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <XCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                <p className="text-3xl font-bold text-red-600">{nonCompliant}</p>
                <p className="text-sm text-red-700">Non-Compliant</p>
                <p className="text-xs text-muted-foreground">{total > 0 ? Math.round(nonCompliant / total * 100) : 0}% of MEs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Surveyor = Manual Surveyor flow: compare and focus */}
        <Card className="border-primary/20 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">How to use this report</CardTitle>
            <CardDescription>
              The AI Surveyor performs the same activities as a manual surveyor: it scans all standards and substandards,
              checks whether each measurable element is met, and produces a score per standard and overall. Compare this
              report with your manual assessment and focus on the standards marked below as needing attention.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Standards needing attention — reference for manual surveyor */}
        {standardsNeedingAttention.length > 0 && (
          <Card className="print-break border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-amber-800">Standards needing attention</CardTitle>
              <CardDescription>
                Focus manual survey and verification on these standards (AI score below {STANDARD_NEEDS_ATTENTION_THRESHOLD}%).
                Compare AI findings with manual assessment here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {standardsNeedingAttention.map(ss => (
                  <li key={ss.standard_id} className="flex items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2">
                    <span className="font-medium text-amber-900">{ss.standard_code} — {ss.standard_name}</span>
                    <Badge variant="secondary" className={ss.score < 40 ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                      {Math.round(ss.score)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Standard Scorecard — per-standard score like manual survey */}
        {standardScores.length > 0 && (
          <Card className="print-break">
            <CardHeader>
              <CardTitle>Standard Scorecard</CardTitle>
              <CardDescription>Score per standard (AI surveyor — compare with manual survey)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Standard</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Score</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Total MEs</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">✅ Compliant</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">⚠️ Partial</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">❌ Non-Compliant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardScores.map(ss => (
                      <tr key={ss.standard_id} className="border-b">
                        <td className="px-4 py-3 text-sm font-medium">{ss.standard_code} — {ss.standard_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-bold ${ss.score >= 80 ? "text-green-600" : ss.score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                            {Math.round(ss.score)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{ss.total_mes}</td>
                        <td className="px-4 py-3 text-center text-sm text-green-600">{ss.compliant}</td>
                        <td className="px-4 py-3 text-center text-sm text-yellow-600">{ss.partial}</td>
                        <td className="px-4 py-3 text-center text-sm text-red-600">{ss.non_compliant}</td>
                        <td className="px-4 py-3 w-[150px]">
                          <Progress
                            value={ss.score}
                            className="h-2"
                            indicatorClassName={ss.score >= 80 ? "bg-green-500" : ss.score >= 60 ? "bg-yellow-500" : "bg-red-500"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapter Scores */}
        <Card className="print-break">
          <CardHeader>
            <CardTitle>Chapter Scorecard</CardTitle>
            <CardDescription>Performance by accreditation chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Chapter</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Total MEs</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">✅ Compliant</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">⚠️ Partial</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">❌ Non-Compliant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {project.chapter_scores.map(ch => (
                    <tr key={ch.chapter_id} className="border-b">
                      <td className="px-4 py-3 text-sm font-medium">{ch.chapter_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg font-bold ${ch.score >= 80 ? "text-green-600" : ch.score >= 50 ? "text-yellow-600" : "text-red-600"}`}>{ch.score}%</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{ch.total_mes}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-600">{ch.compliant}</td>
                      <td className="px-4 py-3 text-center text-sm text-yellow-600">{ch.partial}</td>
                      <td className="px-4 py-3 text-center text-sm text-red-600">{ch.non_compliant}</td>
                      <td className="px-4 py-3 w-[150px]">
                        <Progress value={ch.score} className="h-2" indicatorClassName={ch.score >= 80 ? "bg-green-500" : ch.score >= 50 ? "bg-yellow-500" : "bg-red-500"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Critical Findings */}
        <Card className="print-break">
          <CardHeader>
            <CardTitle className="text-red-700">Critical Findings</CardTitle>
            <CardDescription>Non-compliant measurable elements requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalGaps.map(gap => (
                <div key={gap.me_id} className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-red-700">{gap.me_code}</span>
                        <Badge variant="destructive">{gap.match_score}% match</Badge>
                      </div>
                      <p className="mt-1 text-sm">{gap.me_text}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{gap.justification}</p>
                      {gap.evidence_missing.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-red-700">Missing Evidence:</p>
                          <ul className="ml-4 mt-1 list-disc text-xs text-red-600">
                            {gap.evidence_missing.map((m, i) => <li key={i}>{m}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {criticalGaps.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No critical findings.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Partial Findings */}
        <Card className="print-break">
          <CardHeader>
            <CardTitle className="text-yellow-700">Partial Compliance Findings</CardTitle>
            <CardDescription>Measurable elements with gaps requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partialGaps.map(gap => (
                <div key={gap.me_id} className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-yellow-700">{gap.me_code}</span>
                        <Badge variant="warning">{gap.match_score}% match</Badge>
                      </div>
                      <p className="mt-1 text-sm">{gap.me_text}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{gap.justification}</p>
                      {gap.gaps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-yellow-700">Gaps:</p>
                          <ul className="ml-4 mt-1 list-disc text-xs text-yellow-600">
                            {gap.gaps.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {partialGaps.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No partial compliance findings.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Corrective Action Plan */}
        <Card className="print-break">
          <CardHeader>
            <CardTitle>Corrective Action Plan</CardTitle>
            <CardDescription>AI-recommended actions to close compliance gaps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ME Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Gap</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Assigned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map(action => (
                    <tr key={action.id} className="border-b">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-primary">{action.me_code}</td>
                      <td className="px-4 py-3 text-sm">{action.gap_description}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{action.recommended_action}</td>
                      <td className="px-4 py-3">
                        <Badge variant={action.priority === "critical" ? "destructive" : action.priority === "high" ? "warning" : "secondary"}>
                          {action.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{action.assigned_to}</td>
                      <td className="px-4 py-3 text-sm">{action.due_date}</td>
                    </tr>
                  ))}
                  {actions.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No corrective actions.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
