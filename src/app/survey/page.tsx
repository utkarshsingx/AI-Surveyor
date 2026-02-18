"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Target,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Settings,
  Play,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchProjects, createProject, deleteProject, fetchFacilities } from "@/lib/api-client";
import type { SurveyProject } from "@/types";
import Link from "next/link";

export default function SurveyPage() {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string; location: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formFacility, setFormFacility] = useState("");
  const [formStandard, setFormStandard] = useState("CBAHI-Sibahi 2026 v1.0");
  const [formScope, setFormScope] = useState("full");
  const [formDeadline, setFormDeadline] = useState("");

  useEffect(() => {
    Promise.all([fetchProjects(), fetchFacilities()])
      .then(([p, f]) => {
        setProjects(p);
        setFacilities(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formFacility || !formDeadline) return;
    setCreating(true);
    try {
      await createProject({
        name: formName,
        facilityId: formFacility,
        standardVersion: formStandard,
        scope: formScope,
        deadline: formDeadline,
      });
      setShowNewProject(false);
      setFormName("");
      setFormFacility("");
      setFormScope("full");
      setFormDeadline("");
      // Refresh
      const updated = await fetchProjects();
      setProjects(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      const updated = await fetchProjects();
      setProjects(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed": return { color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-4 w-4" /> };
      case "in-progress": return { color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Play className="h-4 w-4" /> };
      case "draft": return { color: "bg-gray-100 text-gray-700 border-gray-200", icon: <Settings className="h-4 w-4" /> };
      case "review": return { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Target className="h-4 w-4" /> };
      default: return { color: "", icon: null };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Survey Workspace</h1>
          <p className="text-sm text-muted-foreground">Manage accreditation survey projects</p>
        </div>
        <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Survey Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Survey Project</DialogTitle>
              <DialogDescription>Set up a new accreditation assessment project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Project Name</label>
                <Input placeholder="e.g., CBAHI Full Assessment 2026" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Facility</label>
                <Select value={formFacility} onValueChange={setFormFacility}>
                  <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                  <SelectContent>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Standard</label>
                <Select value={formStandard} onValueChange={setFormStandard}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBAHI-Sibahi 2026 v1.0">CBAHI-Sibahi 2026 v1.0</SelectItem>
                    <SelectItem value="CBAHI 2024">CBAHI 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Scope</label>
                <Select value={formScope} onValueChange={setFormScope}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Assessment (All Chapters)</SelectItem>
                    <SelectItem value="partial">Partial (Select Chapters)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Deadline</label>
                <Input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !formName.trim() || !formFacility || !formDeadline}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        {["all", "in-progress", "completed", "draft"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(p => tab === "all" || p.status === tab)
                .map(project => {
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <Card key={project.id} className="transition-shadow hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <CardDescription className="mt-1">{project.facility}</CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={statusConfig.color}>
                              <span className="mr-1">{statusConfig.icon}</span>
                              {project.status.replace("-", " ")}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(project.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {project.overall_score > 0 ? (
                            <div>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Readiness</span>
                                <span className={`text-lg font-bold ${project.overall_score >= 80 ? "text-green-600" : project.overall_score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                                  {project.overall_score}%
                                </span>
                              </div>
                              <Progress value={project.overall_score} className="h-2" indicatorClassName={project.overall_score >= 80 ? "bg-green-500" : project.overall_score >= 50 ? "bg-yellow-500" : "bg-red-500"} />
                            </div>
                          ) : (
                            <div className="rounded-md bg-muted/50 p-3 text-center">
                              <p className="text-sm text-muted-foreground">Not yet assessed</p>
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Deadline</span>
                              <span>{project.deadline}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Scope</span>
                              <span>{project.scope === "full" ? "Full Assessment" : "Partial"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Team</span>
                              <span>{project.team_members.length} members</span>
                            </div>
                          </div>

                          {project.chapter_scores.length > 0 && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                {project.chapter_scores.slice(0, 3).map(ch => (
                                  <div key={ch.chapter_id} className="flex items-center justify-between text-xs">
                                    <span className="truncate max-w-[160px]">{ch.chapter_name}</span>
                                    <span className={`font-bold ${ch.score >= 80 ? "text-green-600" : ch.score >= 50 ? "text-yellow-600" : "text-red-600"}`}>{ch.score}%</span>
                                  </div>
                                ))}
                                {project.chapter_scores.length > 3 && <p className="text-[10px] text-muted-foreground">+{project.chapter_scores.length - 3} more chapters</p>}
                              </div>
                            </>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Link href="/assessment" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full gap-1">
                                <Play className="h-3 w-3" /> {project.status === "draft" ? "Start" : "Continue"}
                              </Button>
                            </Link>
                            <Link href="/gap-analysis" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full gap-1">
                                <ArrowRight className="h-3 w-3" /> Results
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {projects.filter(p => tab === "all" || p.status === tab).length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No projects found. Create a new survey project to get started.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
