"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAccreditation } from "@/contexts/accreditation-context";
import { fetchAccreditation } from "@/lib/api-client";
import type { Accreditation, Standard, SubStandard } from "@/types";
import type { AssessActivitiesResult, SubStandardAssessmentResult, ActivityAssessmentResult } from "@/lib/ai";

interface DocumentAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportCreated?: () => void;
}

type Step = "upload" | "scope" | "analyzing" | "result";

const STATUS_ICON: Record<string, React.ReactNode> = {
  met: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  partially_met: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  not_met: <XCircle className="h-4 w-4 text-red-600" />,
};

const STATUS_LABEL: Record<string, string> = {
  met: "Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
};

const STATUS_COLOR: Record<string, string> = {
  met: "bg-green-100 text-green-800",
  partially_met: "bg-yellow-100 text-yellow-800",
  not_met: "bg-red-100 text-red-800",
};

export function DocumentAssessmentModal({
  open,
  onOpenChange,
  onReportCreated,
}: DocumentAssessmentModalProps) {
  const { selectedAccreditation } = useAccreditation();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Accreditation tree
  const [accDetail, setAccDetail] = useState<Accreditation | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);

  // Scope selection
  const [selectedSubStdIds, setSelectedSubStdIds] = useState<Set<string>>(new Set());
  const [expandedStdIds, setExpandedStdIds] = useState<Set<string>>(new Set());

  // Result
  const [result, setResult] = useState<AssessActivitiesResult | null>(null);
  const [expandedResultStd, setExpandedResultStd] = useState<Set<string>>(new Set());
  const [expandedResultSs, setExpandedResultSs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && selectedAccreditation) {
      setLoadingTree(true);
      fetchAccreditation(selectedAccreditation.id)
        .then((data) => setAccDetail(data))
        .catch(() => setAccDetail(null))
        .finally(() => setLoadingTree(false));
    }
  }, [open, selectedAccreditation]);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setError("");
    setResult(null);
    setSelectedSubStdIds(new Set());
    setExpandedStdIds(new Set());
    setExpandedResultStd(new Set());
    setExpandedResultSs(new Set());
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  // Standards/substandards from accreditation
  const allStandards: Standard[] = useMemo(() => {
    if (!accDetail) return [];
    return accDetail.chapters.flatMap((ch) => ch.standards);
  }, [accDetail]);

  const toggleStandard = (std: Standard) => {
    const allSsIds = std.sub_standards.map((ss) => ss.id);
    const allSelected = allSsIds.every((id) => selectedSubStdIds.has(id));
    setSelectedSubStdIds((prev) => {
      const next = new Set(prev);
      allSsIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleSubStandard = (ssId: string) => {
    setSelectedSubStdIds((prev) => {
      const next = new Set(prev);
      next.has(ssId) ? next.delete(ssId) : next.add(ssId);
      return next;
    });
  };

  const toggleExpand = (stdId: string) => {
    setExpandedStdIds((prev) => {
      const next = new Set(prev);
      next.has(stdId) ? next.delete(stdId) : next.add(stdId);
      return next;
    });
  };

  const handleRunAssessment = async () => {
    if (!file || selectedSubStdIds.size === 0) {
      setError("Upload a document and select at least one standard.");
      return;
    }
    setError("");
    setStep("analyzing");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "subStandardIds",
        JSON.stringify(Array.from(selectedSubStdIds))
      );
      const res = await fetch("/api/ai-surveyor/assess", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Assessment failed");
      setResult(data as AssessActivitiesResult);
      setStep("result");
      onReportCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assessment failed");
      setStep("scope");
    } finally {
      setAnalyzing(false);
    }
  };

  // Group results by standard for the result view
  const resultByStandard = useMemo(() => {
    if (!result || !accDetail) return [];
    const ssResultMap = new Map<string, SubStandardAssessmentResult>();
    for (const ss of result.subStandards) {
      ssResultMap.set(ss.subStandardId, ss);
    }

    return allStandards
      .map((std) => {
        const ssResults = std.sub_standards
          .map((ss) => ssResultMap.get(ss.id))
          .filter(Boolean) as SubStandardAssessmentResult[];
        if (ssResults.length === 0) return null;
        const totalActs = ssResults.reduce(
          (s, ss) => s + ss.activities.length,
          0
        );
        const metActs = ssResults.reduce(
          (s, ss) => s + ss.activities.filter((a) => a.status === "met").length,
          0
        );
        const partialActs = ssResults.reduce(
          (s, ss) =>
            s +
            ss.activities.filter((a) => a.status === "partially_met").length,
          0
        );
        const score =
          totalActs > 0
            ? Math.round(((metActs + partialActs * 0.5) / totalActs) * 100)
            : 0;
        return { std, score, subStandards: ssResults };
      })
      .filter(Boolean) as {
      std: Standard;
      score: number;
      subStandards: SubStandardAssessmentResult[];
    }[];
  }, [result, accDetail, allStandards]);

  const overallScore = useMemo(() => {
    if (!result) return 0;
    const total = result.subStandards.reduce(
      (s, ss) => s + ss.activities.length,
      0
    );
    const met = result.subStandards.reduce(
      (s, ss) => s + ss.activities.filter((a) => a.status === "met").length,
      0
    );
    const partial = result.subStandards.reduce(
      (s, ss) =>
        s + ss.activities.filter((a) => a.status === "partially_met").length,
      0
    );
    return total > 0
      ? Math.round(((met + partial * 0.5) / total) * 100)
      : 0;
  }, [result]);

  const totalActivities = result
    ? result.subStandards.reduce((s, ss) => s + ss.activities.length, 0)
    : 0;
  const metCount = result
    ? result.subStandards.reduce(
        (s, ss) => s + ss.activities.filter((a) => a.status === "met").length,
        0
      )
    : 0;
  const partialCount = result
    ? result.subStandards.reduce(
        (s, ss) =>
          s +
          ss.activities.filter((a) => a.status === "partially_met").length,
        0
      )
    : 0;
  const notMetCount = result
    ? result.subStandards.reduce(
        (s, ss) =>
          s + ss.activities.filter((a) => a.status === "not_met").length,
        0
      )
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1a5276]" />
            {step === "upload" && "Upload document for AI assessment"}
            {step === "scope" && "Select standards to assess"}
            {step === "analyzing" && "AI is assessing activities..."}
            {step === "result" && "AI Surveyor Report"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a document. The AI surveyor will check each activity in the
              selected standards against this document and determine met / partially
              met / not met.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Document</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt,.md"
                className="cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#1a5276] hover:bg-[#154360]"
                disabled={!file}
                onClick={() => setStep("scope")}
              >
                Next: Select standards
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: Scope selection */}
        {step === "scope" && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <p className="text-sm text-muted-foreground">
              Select standards and substandards. AI will evaluate every activity
              within the selected scope.
            </p>
            <ScrollArea className="flex-1 border rounded-md p-3 max-h-[400px]">
              {loadingTree ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : allStandards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No standards found. Select an accreditation first.
                </p>
              ) : (
                <div className="space-y-1">
                  {allStandards.map((std) => {
                    const allSsIds = std.sub_standards.map((ss) => ss.id);
                    const selectedCount = allSsIds.filter((id) =>
                      selectedSubStdIds.has(id)
                    ).length;
                    const allSelected =
                      allSsIds.length > 0 &&
                      selectedCount === allSsIds.length;
                    const someSelected =
                      selectedCount > 0 && !allSelected;
                    const expanded = expandedStdIds.has(std.id);

                    return (
                      <div key={std.id}>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                          <button
                            type="button"
                            className="shrink-0"
                            onClick={() => toggleExpand(std.id)}
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected;
                            }}
                            onChange={() => toggleStandard(std)}
                            className="rounded border-gray-300"
                          />
                          <span className="font-medium text-sm">
                            {std.code} — {std.standard_name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {std.sub_standards.length} substandards
                          </span>
                        </div>
                        {expanded && (
                          <div className="ml-10 space-y-1 mb-1">
                            {std.sub_standards.map((ss: SubStandard) => (
                              <label
                                key={ss.id}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSubStdIds.has(ss.id)}
                                  onChange={() => toggleSubStandard(ss.id)}
                                  className="rounded border-gray-300"
                                />
                                <span>
                                  {ss.code} — {ss.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            {file && (
              <p className="text-xs text-muted-foreground">
                Document: {file.name} | {selectedSubStdIds.size} substandard(s)
                selected
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                className="bg-[#1a5276] hover:bg-[#154360]"
                disabled={selectedSubStdIds.size === 0 || analyzing}
                onClick={handleRunAssessment}
              >
                Run AI Survey
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: Analyzing */}
        {step === "analyzing" && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#1a5276]" />
            <p className="text-sm text-muted-foreground">
              AI is evaluating each activity against the document...
            </p>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === "result" && result && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 max-h-[60vh] pr-4">
              <div className="space-y-5">
                {/* Summary header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground">Document</p>
                    <p className="font-medium">{file?.name}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-[#1a5276] text-white">
                    <p className="text-2xl font-bold">{overallScore}%</p>
                    <p className="text-xs">Overall Score</p>
                  </div>
                </div>

                {/* Summary counts */}
                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="rounded-lg border p-2">
                    <p className="text-lg font-bold">{totalActivities}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                  <div className="rounded-lg border p-2 bg-green-50">
                    <p className="text-lg font-bold text-green-700">{metCount}</p>
                    <p className="text-green-700">Met</p>
                  </div>
                  <div className="rounded-lg border p-2 bg-yellow-50">
                    <p className="text-lg font-bold text-yellow-700">
                      {partialCount}
                    </p>
                    <p className="text-yellow-700">Partial</p>
                  </div>
                  <div className="rounded-lg border p-2 bg-red-50">
                    <p className="text-lg font-bold text-red-700">{notMetCount}</p>
                    <p className="text-red-700">Not Met</p>
                  </div>
                </div>

                {/* Per-standard collapsible tree */}
                <div className="space-y-2">
                  {resultByStandard.map(({ std, score, subStandards: ssResults }) => {
                    const stdExpanded = expandedResultStd.has(std.id);
                    return (
                      <div
                        key={std.id}
                        className="rounded-lg border overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 text-left"
                          onClick={() =>
                            setExpandedResultStd((prev) => {
                              const next = new Set(prev);
                              next.has(std.id)
                                ? next.delete(std.id)
                                : next.add(std.id);
                              return next;
                            })
                          }
                        >
                          {stdExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <span className="font-medium text-sm flex-1">
                            {std.code} — {std.standard_name}
                          </span>
                          <Badge
                            className={
                              score >= 80
                                ? "bg-green-100 text-green-800"
                                : score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {score}%
                          </Badge>
                        </button>

                        {stdExpanded && (
                          <div className="border-t">
                            {ssResults.map((ss) => {
                              const ssExpanded = expandedResultSs.has(
                                ss.subStandardId
                              );
                              return (
                                <div
                                  key={ss.subStandardId}
                                  className="border-b last:border-b-0"
                                >
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 p-2.5 pl-8 hover:bg-muted/20 text-left"
                                    onClick={() =>
                                      setExpandedResultSs((prev) => {
                                        const next = new Set(prev);
                                        next.has(ss.subStandardId)
                                          ? next.delete(ss.subStandardId)
                                          : next.add(ss.subStandardId);
                                        return next;
                                      })
                                    }
                                  >
                                    {ssExpanded ? (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="text-sm flex-1">
                                      {ss.code} — {ss.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {ss.score}%
                                    </Badge>
                                  </button>

                                  {ssExpanded && (
                                    <div className="pl-14 pr-3 pb-2 space-y-2">
                                      {ss.activities.map(
                                        (act: ActivityAssessmentResult) => (
                                          <div
                                            key={act.activityId}
                                            className="flex items-start gap-2 text-xs"
                                          >
                                            {STATUS_ICON[act.status]}
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                  {act.label}
                                                </span>
                                                <span
                                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLOR[act.status]}`}
                                                >
                                                  {STATUS_LABEL[act.status]}
                                                </span>
                                              </div>
                                              <p className="text-muted-foreground mt-0.5">
                                                {act.justification}
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                className="bg-[#1a5276] hover:bg-[#154360]"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
