"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccreditation } from "@/contexts/accreditation-context";
import { AssessmentControls, type AssessmentValue } from "@/components/assessment-controls";
import { RiskMatrix } from "@/components/risk-matrix";
import { fetchAccreditation, fetchSubStandardActivities, fetchProjects } from "@/lib/api-client";
import { DocumentAssessmentModal } from "@/components/document-assessment-modal";

interface AccDetail {
  id: string;
  name: string;
  code: string;
  chapters: ChapterItem[];
}

interface ChapterItem {
  id: string;
  code: string;
  name: string;
  standards: StandardItem[];
}

interface StandardItem {
  id: string;
  code: string;
  standard_name: string;
  description: string;
  criticality: string;
  sub_standards: SubStdItem[];
}

interface SubStdItem {
  id: string;
  code: string;
  name: string;
  activities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  description: string;
  field_type: string;
  required: boolean;
  response?: {
    value: string;
    status: string;
  };
}

type MainTab = "self-assessment" | "gap-assessment";
type SubTab = "assessment" | "action-plan";

interface FlatStandard {
  id: string;
  code: string;
  standard_name: string;
  description: string;
  libraryCode: string;
  chapterCode: string;
  chapterId: string;
  esrCount: number;
  nonEsrCount: number;
  completion: number;
  score: number;
  subStandards: SubStdItem[];
  status: "pending" | "in_progress" | "completed";
}

export default function SelfAssessmentPage() {
  const { selectedAccreditation } = useAccreditation();
  const [accDetail, setAccDetail] = useState<AccDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("self-assessment");
  const [subTab, setSubTab] = useState<SubTab>("assessment");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [expandedSubStd, setExpandedSubStd] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [assessments, setAssessments] = useState<Record<string, AssessmentValue>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [riskSelections, setRiskSelections] = useState<Record<string, { likelihood: number; impact: number } | null>>({});
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistModalData, setChecklistModalData] = useState<ActivityItem[]>([]);
  const [documentAssessmentOpen, setDocumentAssessmentOpen] = useState(false);

  useEffect(() => {
    if (!selectedAccreditation) return;
    setLoading(true);
    Promise.all([
      fetchAccreditation(selectedAccreditation.id),
      fetchProjects(),
    ])
      .then(([acc, prjs]) => {
        setAccDetail(acc as unknown as AccDetail);
        const prj = prjs.find((p) => p.accreditation_id === selectedAccreditation.id);
        if (prj) setActiveProjectId(prj.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccreditation]);

  const loadActivities = useCallback(
    async (subStdId: string) => {
      setActivitiesLoading(true);
      try {
        const data = await fetchSubStandardActivities(subStdId, activeProjectId || undefined);
        setActivities(data.activities as unknown as ActivityItem[]);
      } catch {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    },
    [activeProjectId]
  );

  const flatStandards: FlatStandard[] = React.useMemo(() => {
    if (!accDetail) return [];
    return accDetail.chapters.flatMap((ch) =>
      ch.standards.map((std) => {
        const totalActs = std.sub_standards.reduce((s, ss) => s + (ss.activities?.length || 0), 0);
        const completedActs = std.sub_standards.reduce(
          (s, ss) =>
            s + (ss.activities?.filter((a) => a.response?.status === "completed").length || 0),
          0
        );
        const nonEsrCount = std.sub_standards.reduce((s, ss) => s + (ss.activities?.length || 0), 0);
        return {
          id: std.id,
          code: std.code,
          standard_name: std.standard_name,
          description: std.description,
          libraryCode: accDetail.code,
          chapterCode: ch.code,
          chapterId: ch.id,
          esrCount: 0,
          nonEsrCount: nonEsrCount,
          completion: totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 100,
          score: totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 100,
          subStandards: std.sub_standards,
          status: completedActs === totalActs && totalActs > 0 ? "completed" : completedActs > 0 ? "in_progress" : "pending",
        };
      })
    );
  }, [accDetail]);

  const filteredStandards = flatStandards.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.standard_name.toLowerCase().includes(q) ||
      s.chapterCode.toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    total: flatStandards.length,
    pending: flatStandards.filter((s) => s.status === "pending").length,
    in_progress: flatStandards.filter((s) => s.status === "in_progress").length,
    completed: flatStandards.filter((s) => s.status === "completed").length,
  };

  const handleToggleStandard = (stdId: string) => {
    setExpandedStandard(expandedStandard === stdId ? null : stdId);
    setExpandedSubStd(null);
    setActivities([]);
  };

  const handleToggleSubStd = (ssId: string) => {
    if (expandedSubStd === ssId) {
      setExpandedSubStd(null);
      setActivities([]);
    } else {
      setExpandedSubStd(ssId);
      loadActivities(ssId);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main tabs */}
      <div className="flex items-center border-b border-gray-200">
        <button
          onClick={() => setMainTab("self-assessment")}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "self-assessment"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Self Assessment
        </button>
        <button
          onClick={() => setMainTab("gap-assessment")}
          className={`px-6 py-2.5 text-sm font-medium transition-colors ${
            mainTab === "gap-assessment"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Gap Assessment
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center border-b border-gray-100">
        <button
          onClick={() => setSubTab("assessment")}
          className={`px-5 py-2 text-sm font-medium transition-colors ${
            subTab === "assessment"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Assessment
        </button>
        <button
          onClick={() => setSubTab("action-plan")}
          className={`px-5 py-2 text-sm font-medium transition-colors ${
            subTab === "action-plan"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Action Plan
        </button>
      </div>

      {/* Header area */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-gray-900">Self Assessment</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#1a5276] text-white text-xs px-2.5 py-1">
            Self Assessment <span className="ml-1 font-bold">{statusCounts.total}</span>
          </Badge>
          <Badge className="bg-orange-400 text-white text-xs px-2.5 py-1">
            Pending ({statusCounts.pending})
          </Badge>
          <Badge className="bg-blue-400 text-white text-xs px-2.5 py-1">
            In Progress ({statusCounts.in_progress})
          </Badge>
          <Badge className="bg-green-500 text-white text-xs px-2.5 py-1">
            Completed ({statusCounts.completed})
          </Badge>

          <div className="ml-auto flex items-center gap-2">
            <select className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-600">
              <option value="">All Chapters</option>
              {accDetail?.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.code} - {ch.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search"
                className="h-8 w-[180px] pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button size="sm" className="bg-[#1a5276] hover:bg-[#154360] text-xs" onClick={() => setDocumentAssessmentOpen(true)}>
            Assess document
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            View Reports
          </Button>
        </div>
      </div>

      {/* Main table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3">Standard <span className="inline-block ml-0.5 text-[10px]">&#9650;</span></th>
              <th className="px-4 py-3">Standard Description</th>
              <th className="px-4 py-3">Library</th>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">ESR Count</th>
              <th className="px-4 py-3">Non-ESR Count</th>
              <th className="px-4 py-3">Completion %</th>
              <th className="px-4 py-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredStandards.map((std) => (
              <React.Fragment key={std.id}>
                {/* Standard row */}
                <tr
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  onClick={() => handleToggleStandard(std.id)}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {expandedStandard === std.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{std.code}.</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[280px] truncate">{std.standard_name}</td>
                  <td className="px-4 py-3 text-gray-500">{std.libraryCode}</td>
                  <td className="px-4 py-3 text-gray-500">{std.chapterCode}</td>
                  <td className="px-4 py-3 text-gray-500">{std.esrCount}</td>
                  <td className="px-4 py-3 text-gray-500">{std.nonEsrCount}</td>
                  <td className="px-4 py-3 text-gray-500">{std.completion.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{std.score.toFixed(2)}</td>
                </tr>

                {/* Expanded sub-standards */}
                {expandedStandard === std.id &&
                  std.subStandards.map((ss) => (
                    <React.Fragment key={ss.id}>
                      {/* Sub-standard row */}
                      <tr className="bg-gray-50/80">
                        <td colSpan={9} className="px-8 py-2">
                          <div
                            className="flex items-center gap-3 cursor-pointer py-1"
                            onClick={() => handleToggleSubStd(ss.id)}
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-400">
                              {expandedSubStd === ss.id ? (
                                <Minus className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-[#1a5276]">{ss.code}.</span>
                            <span className="text-sm text-gray-500">-</span>
                            <Badge
                              className={`text-[10px] ${
                                (ss.activities?.filter((a) => a.response?.status === "completed").length || 0) ===
                                  (ss.activities?.length || 0) && (ss.activities?.length || 0) > 0
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-orange-100 text-orange-700 border-orange-200"
                              }`}
                              variant="outline"
                            >
                              {(ss.activities?.filter((a) => a.response?.status === "completed").length || 0) ===
                                (ss.activities?.length || 0) && (ss.activities?.length || 0) > 0
                                ? "Completed"
                                : "Not Started"}
                            </Badge>
                            <div className="ml-auto">
                              <Button variant="outline" size="sm" className="h-7 text-xs bg-[#1a5276] text-white hover:bg-[#154360] border-[#1a5276]">
                                Add Action Plan
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded sub-standard detail */}
                      {expandedSubStd === ss.id && (
                        <tr className="bg-white">
                          <td colSpan={9} className="px-8 py-4">
                            <SubStandardDetail
                              subStandard={ss}
                              activities={activities}
                              activitiesLoading={activitiesLoading}
                              assessment={assessments[ss.id] || null}
                              comment={comments[ss.id] || ""}
                              riskSelection={riskSelections[ss.id] || null}
                              onAssessmentChange={(v) =>
                                setAssessments((prev) => ({ ...prev, [ss.id]: v }))
                              }
                              onCommentChange={(v) =>
                                setComments((prev) => ({ ...prev, [ss.id]: v }))
                              }
                              onRiskSelect={(v) =>
                                setRiskSelections((prev) => ({ ...prev, [ss.id]: v }))
                              }
                              onViewChecklist={(acts) => {
                                setChecklistModalData(acts);
                                setChecklistModalOpen(true);
                              }}
                              subTab={subTab}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </React.Fragment>
            ))}

            {filteredStandards.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                  No standards found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DocumentAssessmentModal open={documentAssessmentOpen} onOpenChange={setDocumentAssessmentOpen} />

      {/* Checklist Response Modal */}
      <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Checklist Response</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                  <th className="px-3 py-2">Element</th>
                  <th className="px-3 py-2">Response</th>
                  <th className="px-3 py-2">Comment</th>
                  <th className="px-3 py-2">AttachedProof</th>
                  <th className="px-3 py-2">Download</th>
                </tr>
              </thead>
              <tbody>
                {checklistModalData.map((act) => (
                  <tr key={act.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{act.label}</td>
                    <td className="px-3 py-2">
                      <Badge className={act.response?.value === "true" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"} variant="outline">
                        {act.response?.value === "true" ? "Yes" : "Partially"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{act.response?.status || "-"}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">-</td>
                    <td className="px-3 py-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setChecklistModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubStandardDetail({
  subStandard,
  activities,
  activitiesLoading,
  assessment,
  comment,
  riskSelection,
  onAssessmentChange,
  onCommentChange,
  onRiskSelect,
  onViewChecklist,
  subTab,
}: {
  subStandard: SubStdItem;
  activities: ActivityItem[];
  activitiesLoading: boolean;
  assessment: AssessmentValue;
  comment: string;
  riskSelection: { likelihood: number; impact: number } | null;
  onAssessmentChange: (v: AssessmentValue) => void;
  onCommentChange: (v: string) => void;
  onRiskSelect: (v: { likelihood: number; impact: number } | null) => void;
  onViewChecklist: (acts: ActivityItem[]) => void;
  subTab: SubTab;
}) {
  return (
    <div className="space-y-5">
      {/* Sub-standard header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{subStandard.code}.</h3>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{subStandard.name}</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div className="text-center">
            <p className="text-[10px] text-gray-400">Unit Focus</p>
            <p className="font-medium">-</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400">ESR</p>
            <p className="font-medium">No</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400">Documents</p>
            <p className="font-medium text-[#1a5276]">0 Files</p>
          </div>
        </div>
      </div>

      {/* Activity table */}
      <div className="rounded-lg border border-gray-200">
        <div className="border-b border-gray-100 px-4 py-2">
          <h4 className="text-sm font-semibold text-gray-700">Activity</h4>
        </div>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Type of Activity</th>
                <th className="px-4 py-2">Frequency of response</th>
                <th className="px-4 py-2">Score</th>
                <th className="w-16 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-900">{act.label}</td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-[180px] truncate">{act.description || act.label}</td>
                  <td className="px-4 py-2.5 text-gray-600 capitalize">{act.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2.5 text-gray-500">Monthly</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {act.response?.value === "true" ? "100" : act.response?.value && act.response.value !== "false" ? act.response.value : ""}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        if (act.type === "checklist") {
                          onViewChecklist([act]);
                        }
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {activities.length === 0 && !activitiesLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-400">
                    No activities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {subTab === "assessment" && (
        <>
          {/* Assessment controls */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Assessment</h4>
            <AssessmentControls value={assessment} onChange={onAssessmentChange} />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Comment</label>
              <div className="relative">
                <textarea
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5276] focus:outline-none focus:ring-1 focus:ring-[#1a5276]"
                  rows={2}
                  placeholder="Speak or type here..."
                  value={comment}
                  onChange={(e) => onCommentChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {subTab === "action-plan" && (
        <>
          {/* Assessment controls for action plan too */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Assessment</h4>
            <AssessmentControls value={assessment} onChange={onAssessmentChange} />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-600">Comment</label>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5276] focus:outline-none focus:ring-1 focus:ring-[#1a5276]"
                rows={2}
                placeholder="Speak or type here..."
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
              />
            </div>
          </div>

          {/* Risk Matrix */}
          <RiskMatrix
            selectedCell={riskSelection}
            onSelect={(cell) => onRiskSelect(cell)}
          />

          {/* ESR Reasons */}
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-gray-700">ESR Reasons</h4>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5276] focus:outline-none focus:ring-1 focus:ring-[#1a5276]"
              rows={2}
              placeholder="Enter ESR reasons..."
            />
          </div>
        </>
      )}
    </div>
  );
}
