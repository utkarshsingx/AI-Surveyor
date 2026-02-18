"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ScanSearch,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FolderOpen,
  Activity,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchDashboard } from "@/lib/api-client";
import type { SurveyProject, ActivityLog, ComplianceScore } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(data => {
        setProjects(data.projects);
        setActivityLog(data.activityLog);
        setComplianceScores(data.complianceScores);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeProject = projects[0];
  const compliantCount = complianceScores.filter(s => s.ai_score === "compliant").length;
  const partialCount = complianceScores.filter(s => s.ai_score === "partial").length;
  const nonCompliantCount = complianceScores.filter(s => s.ai_score === "non-compliant").length;
  const totalMEs = complianceScores.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">AI-powered accreditation readiness overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/assessment">
            <Button className="gap-2">
              <ScanSearch className="h-4 w-4" />
              Run AI Assessment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Readiness</p>
                <p className="mt-1 text-3xl font-bold text-primary">{activeProject?.overall_score || 0}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={activeProject?.overall_score || 0} className="mt-3" indicatorClassName={(activeProject?.overall_score || 0) >= 80 ? "bg-green-500" : (activeProject?.overall_score || 0) >= 50 ? "bg-yellow-500" : "bg-red-500"} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{compliantCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">of {totalMEs} measurable elements assessed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partial Compliance</p>
                <p className="mt-1 text-3xl font-bold text-yellow-600">{partialCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">requiring additional evidence or updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{nonCompliantCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">critical gaps requiring immediate action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <CardDescription>Accreditation assessment projects</CardDescription>
                </div>
                <Link href="/survey"><Button variant="outline" size="sm" className="gap-1">View All <ArrowRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge variant={project.status === "completed" ? "success" : project.status === "in-progress" ? "default" : "secondary"}>{project.status.replace("-", " ")}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{project.facility} &middot; {project.standard_version}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {project.deadline}</span>
                        <span>{project.team_members.length} members</span>
                        <span>{project.scope === "full" ? "Full Assessment" : "Partial"}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-2">
                      {project.overall_score > 0 ? (
                        <>
                          <span className="text-2xl font-bold text-primary">{project.overall_score}%</span>
                          <Progress value={project.overall_score} className="w-[120px]" indicatorClassName={project.overall_score >= 80 ? "bg-green-500" : project.overall_score >= 50 ? "bg-yellow-500" : "bg-red-500"} />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not started</span>
                      )}
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No projects yet.</p>}
              </div>
            </CardContent>
          </Card>

          {activeProject && activeProject.chapter_scores.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Chapter Readiness Breakdown</CardTitle>
                <CardDescription>{activeProject.name} — score by chapter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProject.chapter_scores.map((chapter) => (
                    <div key={chapter.chapter_id}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{chapter.chapter_name}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5 text-xs">
                            <span className="text-green-600">✅ {chapter.compliant}</span>
                            <span className="text-yellow-600">⚠️ {chapter.partial}</span>
                            <span className="text-red-600">❌ {chapter.non_compliant}</span>
                          </div>
                          <span className={`text-sm font-bold ${chapter.score >= 80 ? "text-green-600" : chapter.score >= 50 ? "text-yellow-600" : "text-red-600"}`}>{chapter.score}%</span>
                        </div>
                      </div>
                      <Progress value={chapter.score} className="h-2" indicatorClassName={chapter.score >= 80 ? "bg-green-500" : chapter.score >= 50 ? "bg-yellow-500" : "bg-red-500"} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${log.type === "upload" ? "bg-blue-100 text-blue-600" : log.type === "scan" ? "bg-purple-100 text-purple-600" : log.type === "report" ? "bg-green-100 text-green-600" : log.type === "override" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 text-gray-600"}`}>
                        {log.type === "upload" && <FolderOpen className="h-4 w-4" />}
                        {log.type === "scan" && <ScanSearch className="h-4 w-4" />}
                        {log.type === "report" && <FileCheck2 className="h-4 w-4" />}
                        {log.type === "override" && <AlertTriangle className="h-4 w-4" />}
                        {log.type === "system" && <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{log.details}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {log.user} &middot; {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/assessment" className="block"><Button variant="outline" className="w-full justify-start gap-2"><ScanSearch className="h-4 w-4" />Run AI Assessment</Button></Link>
                <Link href="/evidence" className="block"><Button variant="outline" className="w-full justify-start gap-2"><FolderOpen className="h-4 w-4" />Upload Evidence</Button></Link>
                <Link href="/reports" className="block"><Button variant="outline" className="w-full justify-start gap-2"><FileCheck2 className="h-4 w-4" />Generate Report</Button></Link>
                <Link href="/gap-analysis" className="block"><Button variant="outline" className="w-full justify-start gap-2"><AlertTriangle className="h-4 w-4" />View Gap Analysis</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
