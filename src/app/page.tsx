"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ScanSearch,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FolderOpen,
  Activity,
  Loader2,
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  FileText,
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
import type { SurveyProject, ActivityLog, ComplianceScore, Accreditation } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(data => {
        setProjects(data.projects);
        setActivityLog(data.activityLog);
        setComplianceScores(data.complianceScores);
        setAccreditations((data.accreditations || []) as unknown as Accreditation[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">AI-powered accreditation readiness overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/accreditations">
            <Button variant="outline" className="gap-2 border-[#1a5276] text-[#1a5276] hover:bg-[#1a5276]/5">
              <ShieldCheck className="h-4 w-4" />
              Manage Accreditation
            </Button>
          </Link>
          <Link href="/self-assessment">
            <Button className="gap-2 bg-[#1a5276] hover:bg-[#154360]">
              <ScanSearch className="h-4 w-4" />
              Self Assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#1a5276]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overall Readiness</p>
                <p className="mt-1 text-3xl font-bold text-[#1a5276]">{activeProject?.overall_score || 0}%</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a5276]/10">
                <TrendingUp className="h-5 w-5 text-[#1a5276]" />
              </div>
            </div>
            <Progress value={activeProject?.overall_score || 0} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Compliant</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{compliantCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">of {totalMEs} measurable elements</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Partial Compliance</p>
                <p className="mt-1 text-3xl font-bold text-yellow-600">{partialCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">requiring additional evidence</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Non-Compliant</p>
                <p className="mt-1 text-3xl font-bold text-red-600">{nonCompliantCount}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">critical gaps requiring action</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { title: "Self Assessment", href: "/self-assessment", icon: ClipboardCheck, desc: "Run assessments" },
          { title: "Manage Activity", href: "/manage-activity", icon: Activity, desc: "View all activities" },
          { title: "Action Plan", href: "/action-plan", icon: AlertTriangle, desc: "Corrective actions" },
          { title: "Policies", href: "/policies", icon: FileText, desc: "Documents & policies" },
        ].map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-[#1a5276]/30">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a5276]/10">
                  <item.icon className="h-5 w-5 text-[#1a5276]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Accreditations Overview */}
      {accreditations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Active Accreditations</CardTitle>
                <CardDescription className="text-xs">Click to drill into any accreditation</CardDescription>
              </div>
              <Link href="/accreditations"><Button variant="outline" size="sm" className="gap-1 text-xs">View All <ArrowRight className="h-3 w-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accreditations.map((acc) => (
                <Link key={acc.id} href={`/accreditations/${acc.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-[#1a5276]/30 hover:shadow-sm cursor-pointer">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a5276]/10">
                      <ShieldCheck className="h-5 w-5 text-[#1a5276]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">{acc.code}</p>
                        <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200" variant="outline">{acc.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{acc.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5"><BookOpen className="h-3 w-3" /> {acc.chapters?.length || 0} chapters</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Active Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Projects</CardTitle>
                <Link href="/survey"><Button variant="outline" size="sm" className="gap-1 text-xs">View All <ArrowRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{project.name}</h3>
                        <Badge variant={project.status === "completed" ? "success" : project.status === "in-progress" ? "default" : "secondary"} className="text-[10px]">{project.status.replace("-", " ")}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {project.facility}
                        {project.accreditation_name && ` | ${project.accreditation_name}`}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due: {project.deadline}</span>
                        <span>{project.team_members.length} members</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1">
                      {project.overall_score > 0 ? (
                        <>
                          <span className="text-xl font-bold text-[#1a5276]">{project.overall_score}%</span>
                          <Progress value={project.overall_score} className="w-[100px] h-1.5" />
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Not started</span>
                      )}
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="py-6 text-center text-xs text-gray-400">No projects yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        log.type === "upload" ? "bg-blue-100 text-blue-600" :
                        log.type === "scan" ? "bg-purple-100 text-purple-600" :
                        log.type === "report" ? "bg-green-100 text-green-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {log.type === "upload" && <FolderOpen className="h-3.5 w-3.5" />}
                        {log.type === "scan" && <ScanSearch className="h-3.5 w-3.5" />}
                        {log.type === "report" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {(log.type === "override" || log.type === "system" || log.type === "review") && <Activity className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700">{log.action}</p>
                        <p className="text-[10px] text-gray-400">{log.details}</p>
                        <p className="mt-0.5 text-[10px] text-gray-300">
                          {log.user} — {new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
