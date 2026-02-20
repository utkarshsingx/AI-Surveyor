"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ScanSearch,
  ClipboardCheck,
  Database,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAccreditation, fetchSubStandardActivities, saveActivityResponse, fetchProjects, runSelfAssessment } from "@/lib/api-client";
import type { Activity, ComplianceScore } from "@/types";

interface AccreditationDetail {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: string;
  chapters: ChapterDetail[];
}

interface ChapterDetail {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  score?: number;
  total_standards: number;
  standards: StandardDetail[];
}

interface StandardDetail {
  id: string;
  code: string;
  standard_name: string;
  description: string;
  criticality: string;
  sub_standards: SubStandardDetail[];
}

interface SubStandardDetail {
  id: string;
  code: string;
  name: string;
  activities: Activity[];
}

type DrillLevel = "chapters" | "standards" | "substandards" | "activities";

export default function AccreditationDetailPage() {
  const params = useParams();
  const accreditationId = params.id as string;

  const [accreditation, setAccreditation] = useState<AccreditationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<ChapterDetail | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<StandardDetail | null>(null);
  const [selectedSubStandard, setSelectedSubStandard] = useState<SubStandardDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [assessing, setAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<ComplianceScore[]>([]);

  const drillLevel: DrillLevel = selectedSubStandard
    ? "activities"
    : selectedStandard
    ? "substandards"
    : selectedChapter
    ? "standards"
    : "chapters";

  useEffect(() => {
    Promise.all([
      fetchAccreditation(accreditationId),
      fetchProjects(),
    ])
      .then(([acc, prj]) => {
        setAccreditation(acc as unknown as AccreditationDetail);
        const accProject = prj.find(p => p.accreditation_id === accreditationId);
        if (accProject) setActiveProjectId(accProject.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accreditationId]);

  const loadActivities = useCallback(async (subStandard: SubStandardDetail) => {
    setActivitiesLoading(true);
    try {
      const data = await fetchSubStandardActivities(subStandard.id, activeProjectId || undefined);
      setActivities(data.activities);
    } catch {
      setActivities(subStandard.activities || []);
    } finally {
      setActivitiesLoading(false);
    }
  }, [activeProjectId]);

  const handleSelectChapter = (ch: ChapterDetail) => {
    setSelectedChapter(ch);
    setSelectedStandard(null);
    setSelectedSubStandard(null);
    setActivities([]);
    setAssessmentResults([]);
  };

  const handleSelectStandard = (std: StandardDetail) => {
    setSelectedStandard(std);
    setSelectedSubStandard(null);
    setActivities([]);
    setAssessmentResults([]);
  };

  const handleSelectSubStandard = (ss: SubStandardDetail) => {
    setSelectedSubStandard(ss);
    setAssessmentResults([]);
    loadActivities(ss);
  };

  const handleBack = () => {
    if (selectedSubStandard) {
      setSelectedSubStandard(null);
      setActivities([]);
    } else if (selectedStandard) {
      setSelectedStandard(null);
    } else if (selectedChapter) {
      setSelectedChapter(null);
    }
    setAssessmentResults([]);
  };

  const handleSaveResponse = async (activityId: string, value: string) => {
    if (!activeProjectId) return;
    try {
      await saveActivityResponse({
        activityId,
        projectId: activeProjectId,
        value,
        status: "completed",
      });
      if (selectedSubStandard) {
        await loadActivities(selectedSubStandard);
      }
    } catch (err) {
      console.error("Failed to save response:", err);
    }
  };

  const handleRunSelfAssessment = async () => {
    if (!activeProjectId) return;
    setAssessing(true);
    try {
      const result = await runSelfAssessment({
        projectId: activeProjectId,
        chapterId: selectedChapter?.id,
        standardId: selectedStandard?.id,
        subStandardId: selectedSubStandard?.id,
      });
      setAssessmentResults(result.results);
    } catch (err) {
      console.error("Self-assessment failed:", err);
    } finally {
      setAssessing(false);
    }
  };

  if (loading || !accreditation) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const breadcrumbs = [
    { label: accreditation.name, action: () => { setSelectedChapter(null); setSelectedStandard(null); setSelectedSubStandard(null); setAssessmentResults([]); } },
    ...(selectedChapter ? [{ label: selectedChapter.code, action: () => handleSelectChapter(selectedChapter) }] : []),
    ...(selectedStandard ? [{ label: selectedStandard.code, action: () => handleSelectStandard(selectedStandard) }] : []),
    ...(selectedSubStandard ? [{ label: selectedSubStandard.code, action: () => {} }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accreditations">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((bc, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <button
                    onClick={bc.action}
                    className={`hover:text-primary ${i === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""}`}
                  >
                    {bc.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {drillLevel === "chapters" && accreditation.name}
              {drillLevel === "standards" && `${selectedChapter?.code} - ${selectedChapter?.name}`}
              {drillLevel === "substandards" && `${selectedStandard?.code} - ${selectedStandard?.standard_name}`}
              {drillLevel === "activities" && `${selectedSubStandard?.code} - ${selectedSubStandard?.name}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeProjectId && drillLevel !== "chapters" && (
            <Button
              onClick={handleRunSelfAssessment}
              disabled={assessing}
              className="gap-2"
              size="sm"
            >
              {assessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              Run Self-Assessment
            </Button>
          )}
          {drillLevel !== "chapters" && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Assessment Results Banner */}
      {assessmentResults.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium">Self-Assessment Results:</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {assessmentResults.filter(r => r.ai_score === "compliant").length} Compliant
                </span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  {assessmentResults.filter(r => r.ai_score === "partial").length} Partial
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {assessmentResults.filter(r => r.ai_score === "non-compliant").length} Non-Compliant
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Master/Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel - Navigation List */}
        <div className="lg:col-span-4">
          <Card className="h-[calc(100vh-220px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {drillLevel === "chapters" && "Chapters"}
                {drillLevel === "standards" && `Standards in ${selectedChapter?.code}`}
                {drillLevel === "substandards" && `Sub-Standards in ${selectedStandard?.code}`}
                {drillLevel === "activities" && `Activities in ${selectedSubStandard?.code}`}
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-1 px-4 pb-4">
                {/* Chapters level */}
                {drillLevel === "chapters" &&
                  accreditation.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleSelectChapter(ch)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                          {ch.code}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ch.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ch.total_standards} standard{ch.total_standards !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ch.score !== undefined && (
                          <span className={`text-sm font-semibold ${ch.score >= 80 ? "text-green-600" : ch.score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                            {ch.score}%
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                {/* Standards level */}
                {drillLevel === "standards" &&
                  selectedChapter?.standards.map((std) => (
                    <button
                      key={std.id}
                      onClick={() => handleSelectStandard(std)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-blue-600">
                          {std.code}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{std.standard_name}</p>
                          <p className="text-xs text-muted-foreground">{std.sub_standards.length} sub-standard{std.sub_standards.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {std.criticality === "critical" && (
                          <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}

                {/* Sub-standards level */}
                {drillLevel === "substandards" &&
                  selectedStandard?.sub_standards.map((ss) => (
                    <button
                      key={ss.id}
                      onClick={() => handleSelectSubStandard(ss)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${selectedSubStandard?.id === ss.id ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-50 text-xs font-bold text-purple-600">
                          {ss.code.split(" ").pop()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ss.code}</p>
                          <p className="text-xs text-muted-foreground">{ss.name}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}

                {/* Activities level - left panel shows sub-standard list with selected highlight */}
                {drillLevel === "activities" &&
                  selectedStandard?.sub_standards.map((ss) => (
                    <button
                      key={ss.id}
                      onClick={() => handleSelectSubStandard(ss)}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${selectedSubStandard?.id === ss.id ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold ${selectedSubStandard?.id === ss.id ? "bg-primary text-white" : "bg-purple-50 text-purple-600"}`}>
                          {ss.code.split(" ").pop()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ss.code}</p>
                          <p className="text-xs text-muted-foreground">{ss.name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Panel - Details / Activities */}
        <div className="lg:col-span-8">
          {drillLevel === "chapters" && (
            <Card className="h-[calc(100vh-220px)]">
              <CardContent className="flex h-full flex-col items-center justify-center text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">Select a Chapter</p>
                <p className="text-sm text-muted-foreground/70">
                  Click on a chapter from the left panel to view its standards, sub-standards, and activities.
                </p>
              </CardContent>
            </Card>
          )}

          {drillLevel === "standards" && selectedChapter && (
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader>
                <CardTitle className="text-lg">{selectedChapter.code} - {selectedChapter.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedChapter.description}</p>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">Select a standard from the left to drill deeper, or review the overview below.</p>
                <div className="space-y-3">
                  {selectedChapter.standards.map(std => (
                    <div key={std.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30 cursor-pointer" onClick={() => handleSelectStandard(std)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{std.code}</span>
                          <span className="text-sm">{std.standard_name}</span>
                          {std.criticality === "critical" && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{std.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(drillLevel === "substandards" || drillLevel === "activities") && selectedSubStandard && (
            <ActivitiesPanel
              subStandard={selectedSubStandard}
              activities={activities}
              loading={activitiesLoading}
              projectId={activeProjectId}
              onSaveResponse={handleSaveResponse}
              assessmentResults={assessmentResults}
            />
          )}

          {drillLevel === "substandards" && !selectedSubStandard && selectedStandard && (
            <Card className="h-[calc(100vh-220px)]">
              <CardHeader>
                <CardTitle className="text-lg">{selectedStandard.code} - {selectedStandard.standard_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedStandard.description}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select a sub-standard from the left panel to view and complete its activities (checklist, data collection, document evidence).
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTIVITIES PANEL COMPONENT
// ============================================
function ActivitiesPanel({
  subStandard,
  activities,
  loading,
  projectId,
  onSaveResponse,
  assessmentResults,
}: {
  subStandard: SubStandardDetail;
  activities: Activity[];
  loading: boolean;
  projectId: string;
  onSaveResponse: (activityId: string, value: string) => Promise<void>;
  assessmentResults: ComplianceScore[];
}) {
  const checklist = activities.filter((a) => a.type === "checklist");
  const dataCollection = activities.filter((a) => a.type === "data_collection");
  const documentEvidence = activities.filter((a) => a.type === "document_evidence");

  const totalActs = activities.length;
  const completedActs = activities.filter((a) => a.response?.status === "completed").length;
  const completionPct = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;

  if (loading) {
    return (
      <Card className="h-[calc(100vh-220px)]">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-220px)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{subStandard.code} — {subStandard.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete the activities below across checklist, data collection, and document evidence.
            </p>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${completionPct >= 80 ? "text-green-600" : completionPct >= 40 ? "text-yellow-600" : "text-muted-foreground"}`}>
              {completionPct}%
            </span>
            <p className="text-xs text-muted-foreground">{completedActs}/{totalActs} completed</p>
          </div>
        </div>
        <Progress value={completionPct} className="mt-2 h-1.5" indicatorClassName={completionPct >= 80 ? "bg-green-500" : completionPct >= 40 ? "bg-yellow-500" : "bg-gray-300"} />
      </CardHeader>

      <Tabs defaultValue="checklist" className="flex-1">
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="checklist" className="flex-1 gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              Checklist ({checklist.length})
            </TabsTrigger>
            <TabsTrigger value="data_collection" className="flex-1 gap-1.5">
              <Database className="h-4 w-4" />
              Data Collection ({dataCollection.length})
            </TabsTrigger>
            <TabsTrigger value="document_evidence" className="flex-1 gap-1.5">
              <Upload className="h-4 w-4" />
              Document Evidence ({documentEvidence.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="h-[calc(100%-160px)]">
          <TabsContent value="checklist" className="px-6 pb-4">
            {checklist.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No checklist items for this sub-standard.</p>
            ) : (
              <div className="space-y-3">
                {checklist.map((act) => (
                  <ChecklistActivityItem key={act.id} activity={act} projectId={projectId} onSave={onSaveResponse} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="data_collection" className="px-6 pb-4">
            {dataCollection.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data collection items for this sub-standard.</p>
            ) : (
              <div className="space-y-3">
                {dataCollection.map((act) => (
                  <DataCollectionItem key={act.id} activity={act} projectId={projectId} onSave={onSaveResponse} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="document_evidence" className="px-6 pb-4">
            {documentEvidence.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No document evidence items for this sub-standard.</p>
            ) : (
              <div className="space-y-3">
                {documentEvidence.map((act) => (
                  <DocumentEvidenceItem key={act.id} activity={act} projectId={projectId} onSave={onSaveResponse} />
                ))}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Assessment Results for this sub-standard */}
      {assessmentResults.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <h4 className="mb-2 text-sm font-semibold">AI Assessment Results</h4>
            <div className="space-y-2">
              {assessmentResults.map((r) => (
                <div key={r.me_code} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                  <div className="mt-0.5">
                    {r.ai_score === "compliant" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {r.ai_score === "partial" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {r.ai_score === "non-compliant" && <XCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.me_code}</p>
                    <p className="text-xs text-muted-foreground">{r.justification}</p>
                  </div>
                  <Badge variant={r.ai_score === "compliant" ? "success" : r.ai_score === "partial" ? "default" : "destructive"} className="shrink-0 text-xs">
                    {r.ai_score}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ============================================
// INDIVIDUAL ACTIVITY ITEM COMPONENTS
// ============================================
function ChecklistActivityItem({ activity, projectId, onSave }: { activity: Activity; projectId: string; onSave: (id: string, val: string) => Promise<void> }) {
  const [checked, setChecked] = useState(activity.response?.value === "true");
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    const newVal = !checked;
    setChecked(newVal);
    if (!projectId) return;
    setSaving(true);
    await onSave(activity.id, String(newVal));
    setSaving(false);
  };

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <button
        onClick={handleToggle}
        disabled={saving || !projectId}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked ? "border-green-500 bg-green-500 text-white" : "border-gray-300"
        }`}
      >
        {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${checked ? "text-green-700 line-through" : ""}`}>{activity.label}</p>
        {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
      </div>
      {activity.required && <Badge variant="outline" className="shrink-0 text-[10px]">Required</Badge>}
    </div>
  );
}

function DataCollectionItem({ activity, projectId, onSave }: { activity: Activity; projectId: string; onSave: (id: string, val: string) => Promise<void> }) {
  const [value, setValue] = useState(activity.response?.value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectId || !value.trim()) return;
    setSaving(true);
    await onSave(activity.id, value);
    setSaving(false);
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{activity.label}</p>
          {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
        </div>
        {activity.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type={activity.field_type === "number" ? "number" : activity.field_type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          placeholder={`Enter ${activity.field_type}...`}
          disabled={!projectId}
        />
        <Button size="sm" onClick={handleSave} disabled={saving || !projectId || !value.trim()}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </Button>
      </div>
      {activity.response?.status === "completed" && (
        <p className="mt-1 text-xs text-green-600">Saved</p>
      )}
    </div>
  );
}

function DocumentEvidenceItem({ activity, projectId, onSave }: { activity: Activity; projectId: string; onSave: (id: string, val: string) => Promise<void> }) {
  const [fileName, setFileName] = useState(activity.response?.value || "");
  const [saving, setSaving] = useState(false);
  const hasFile = !!activity.response?.value;

  const handleUpload = async () => {
    const mockFileName = `${activity.label.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    setFileName(mockFileName);
    setSaving(true);
    await onSave(activity.id, mockFileName);
    setSaving(false);
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{activity.label}</p>
          {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
        </div>
        {activity.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
      </div>
      {hasFile ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="flex-1 text-green-700">{fileName || activity.response?.value}</span>
          <Badge variant="success" className="text-[10px]">Uploaded</Badge>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleUpload} disabled={saving || !projectId}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Upload Document
        </Button>
      )}
    </div>
  );
}
