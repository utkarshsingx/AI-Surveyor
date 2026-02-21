"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { fetchPolicies } from "@/lib/api-client";
import type { Policy } from "@/types";
import type { PolicyComplianceReport, PerPolicyScore } from "@/lib/ai";

interface DocumentAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportCreated?: () => void;
}

export function DocumentAssessmentModal({ open, onOpenChange, onReportCreated }: DocumentAssessmentModalProps) {
  const [step, setStep] = useState<"upload" | "policies" | "analyzing" | "result">("upload");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<PolicyComplianceReport | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open) {
      setLoadingPolicies(true);
      fetchPolicies().then(setPolicies).catch(() => setPolicies([])).finally(() => setLoadingPolicies(false));
    }
  }, [open]);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setSelectedPolicyIds(new Set());
    setReport(null);
    setError("");
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const togglePolicy = (id: string) => {
    setSelectedPolicyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleUploadForLater = async () => {
    if (!file) return;
    setError("");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/document-assessment/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      reset();
      onReportCreated?.();
      onOpenChange(false);
      alert("Document uploaded. It will be automatically assessed within the next hour against all policies.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunAssessment = async () => {
    if (!file || selectedPolicyIds.size === 0) {
      setError("Please upload a document and select at least one policy.");
      return;
    }
    setError("");
    setStep("analyzing");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("policyIds", JSON.stringify(Array.from(selectedPolicyIds)));
      const res = await fetch("/api/document-assessment/analyze", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data as PolicyComplianceReport);
      setStep("result");
      onReportCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStep("policies");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1a5276]" />
            {step === "upload" && "Upload document for self-assessment"}
            {step === "policies" && "Select policies to map against"}
            {step === "analyzing" && "Analyzing document..."}
            {step === "result" && "Assessment report"}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload your document. Run an immediate assessment against selected policies or upload for automatic assessment within an hour.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Document</label>
              <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt,.md" className="cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file && <p className="mt-1 text-xs text-muted-foreground">Selected: {file.name}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              {file && (
                <Button variant="secondary" onClick={handleUploadForLater} disabled={analyzing}>
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  Upload for later (auto in 1 hr)
                </Button>
              )}
              <Button className="bg-[#1a5276] hover:bg-[#154360]" disabled={!file} onClick={() => setStep("policies")}>Next: Select policies</Button>
            </DialogFooter>
          </div>
        )}

        {step === "policies" && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <p className="text-sm text-muted-foreground">Select one or more policies. AI will score each and provide combined score, good points, gaps, and improvements.</p>
            <ScrollArea className="flex-1 border rounded-md p-3 max-h-[280px]">
              {loadingPolicies ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-2">
                  {policies.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                      <input type="checkbox" checked={selectedPolicyIds.has(p.id)} onChange={() => togglePolicy(p.id)} className="rounded border-gray-300" />
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.code && <span className="text-xs text-muted-foreground">({p.code})</span>}
                    </label>
                  ))}
                  {policies.length === 0 && !loadingPolicies && <p className="text-sm text-muted-foreground py-4">No policies. Create policies in Policies first.</p>}
                </div>
              )}
            </ScrollArea>
            {file && <p className="text-xs text-muted-foreground">Document: {file.name}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button className="bg-[#1a5276] hover:bg-[#154360]" disabled={selectedPolicyIds.size === 0 || analyzing} onClick={handleRunAssessment}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Run AI assessment
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "analyzing" && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#1a5276]" />
            <p className="text-sm text-muted-foreground">AI is analyzing your document against each policy...</p>
          </div>
        )}

        {step === "result" && report && (
          <div className="space-y-4 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 max-h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground">Document</p>
                    <p className="font-medium">{report.documentName}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-[#1a5276] text-white">
                    <p className="text-2xl font-bold">{report.combinedScore}%</p>
                    <p className="text-xs">Combined score</p>
                  </div>
                </div>
                {report.perPolicyScores.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Per-policy scores</h4>
                    <div className="space-y-3">
                      {report.perPolicyScores.map((p: PerPolicyScore) => (
                        <div key={p.policyId} className="rounded-lg border p-3">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{p.policyName}</span>
                            <span className="text-sm font-semibold text-[#1a5276]">{p.score}%</span>
                          </div>
                          {p.moduleBreakdown?.length > 0 && (
                            <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                              {p.moduleBreakdown.map((m, i) => (
                                <li key={i}>{m.module}{m.submodule ? ` > ${m.submodule}` : ""}: {m.score}% - {m.notes}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div><p className="font-medium text-green-700">Good</p><ul className="list-disc list-inside">{p.goodPoints?.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                            <div><p className="font-medium text-red-700">Gaps</p><ul className="list-disc list-inside">{p.badPoints?.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                            <div><p className="font-medium text-amber-700">Improve</p><ul className="list-disc list-inside">{p.improvements?.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3 bg-green-50">
                    <h4 className="text-xs font-semibold text-green-800 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Good</h4>
                    <ul className="mt-1 text-xs text-green-800 list-disc list-inside">{report.overallGoodPoints?.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                  <div className="rounded-lg border p-3 bg-red-50">
                    <h4 className="text-xs font-semibold text-red-800 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Gaps</h4>
                    <ul className="mt-1 text-xs text-red-800 list-disc list-inside">{report.overallBadPoints?.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                  <div className="rounded-lg border p-3 bg-amber-50">
                    <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Improve</h4>
                    <ul className="mt-1 text-xs text-amber-800 list-disc list-inside">{report.overallImprovements?.map((x, i) => <li key={i}>{x}</li>)}</ul>
                  </div>
                </div>
                {report.aiSummary && (
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">AI summary</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.aiSummary}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter><Button className="bg-[#1a5276] hover:bg-[#154360]" onClick={() => handleClose(false)}>Done</Button></DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
