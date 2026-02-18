"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  ScanSearch,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Eye,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import standardsData from "@/data/standards.json";
import { runAssessment, fetchAssessmentResults, fetchProjects, fetchEvidence, createEvidence } from "@/lib/api-client";
import type { ComplianceScore, SurveyProject } from "@/types";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: "policy" | "evidence" | "other";
}

export default function AssessmentPage() {
  const [projects, setProjects] = useState<SurveyProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<ComplianceScore[]>([]);
  const [selectedME, setSelectedME] = useState<ComplianceScore | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [assessmentSummary, setAssessmentSummary] = useState<{
    overallScore: number;
    totalMes: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
  } | null>(null);

  useEffect(() => {
    fetchProjects().then(p => {
      setProjects(p);
      if (p.length > 0) setSelectedProjectId(p[0].id);
    }).catch(console.error);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  }, []);

  const addFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.type,
      category: f.type.includes("pdf") ? "policy" : f.type.includes("image") ? "evidence" : "other",
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => setUploadedFiles(prev => prev.filter(f => f.id !== id));

  const addDemoFiles = async () => {
    try {
      const evidence = await fetchEvidence();
      const demoFiles: UploadedFile[] = evidence.map(ev => ({
        id: ev.id,
        name: ev.document_name,
        size: ev.file_size,
        type: ev.file_type,
        category: ev.type === "policy" || ev.type === "procedure" ? "policy" : "evidence",
      }));
      setUploadedFiles(demoFiles);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAssessment = async () => {
    if (!selectedProjectId) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setResults([]);
    setSelectedME(null);
    setAssessmentSummary(null);

    // Upload new files as evidence first
    for (const file of uploadedFiles) {
      try {
        await createEvidence({
          documentName: file.name,
          type: file.category === "policy" ? "policy" : "record",
          fileType: file.type,
          fileSize: file.size,
        });
      } catch {
        // Ignore duplicates
      }
    }

    // Simulate progress while API works
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 5, 90));
    }, 600);

    try {
      const result = await runAssessment({
        projectId: selectedProjectId,
        chapterFilter: selectedChapter && selectedChapter !== "all" ? selectedChapter : undefined,
      });

      clearInterval(progressInterval);
      setScanProgress(95);

      // Fetch full results
      const fullResults = await fetchAssessmentResults(result.assessmentId);
      setScanProgress(100);

      setResults(fullResults.scores);
      setAssessmentSummary({
        overallScore: result.overallScore,
        totalMes: result.totalMes,
        compliant: result.compliant,
        partial: result.partial,
        nonCompliant: result.nonCompliant,
      });

      await new Promise(r => setTimeout(r, 500));
      setScanComplete(true);
    } catch (err) {
      console.error("Assessment failed:", err);
      clearInterval(progressInterval);
    } finally {
      setIsScanning(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant": return <Badge variant="success">Compliant</Badge>;
      case "partial": return <Badge variant="warning">Partial</Badge>;
      case "non-compliant": return <Badge variant="destructive">Non-Compliant</Badge>;
      default: return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Upload documents and run AI-powered compliance analysis against CBAHI standards
        </p>
      </div>

      {!scanComplete ? (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Upload Documents</CardTitle>
                      <CardDescription>Drag & drop policies, evidence, and supporting documents</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addDemoFiles}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Load Demo Files
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                  >
                    <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium">
                      Drop files here or{" "}
                      <label className="cursor-pointer text-primary hover:underline">
                        browse
                        <input type="file" multiple className="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.jpg,.jpeg,.png" onChange={handleFileInput} />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOCX, XLSX, PPTX, JPG, PNG</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h3>
                        <Button variant="ghost" size="sm" onClick={() => setUploadedFiles([])} className="text-destructive">Clear All</Button>
                      </div>
                      <div className="space-y-2">
                        {uploadedFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between rounded-md border p-3">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB &middot;{" "}
                                  <Badge variant="secondary" className="text-[10px]">{file.category}</Badge>
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assessment Configuration</CardTitle>
                  <CardDescription>Select standards scope for analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Project</label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Standard Version</label>
                    <Select defaultValue="cbahi-2026">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbahi-2026">CBAHI-Sibahi 2026 v1.0</SelectItem>
                        <SelectItem value="cbahi-2024">CBAHI 2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Chapter Focus</label>
                    <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                      <SelectTrigger><SelectValue placeholder="All Chapters" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Chapters</SelectItem>
                        {standardsData.standards.map(std => (
                          <SelectItem key={std.chapter_id} value={std.chapter_id}>{std.chapter_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Standards in Scope</h3>
                    <ScrollArea className="h-[200px]">
                      <Accordion type="multiple" className="w-full">
                        {standardsData.standards
                          .filter(s => !selectedChapter || selectedChapter === "all" || s.chapter_id === selectedChapter)
                          .map(std => (
                            <AccordionItem key={std.id} value={std.id}>
                              <AccordionTrigger className="text-xs">{std.chapter_name}</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1">
                                  {std.sub_standards.flatMap(ss =>
                                    ss.measurable_elements.map(me => (
                                      <div key={me.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                                        <span className="font-mono text-muted-foreground">{me.code}</span>
                                        {me.criticality === "critical" && (
                                          <Badge variant="destructive" className="text-[9px] px-1">Critical</Badge>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    </ScrollArea>
                  </div>

                  <Separator />

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleRunAssessment}
                    disabled={uploadedFiles.length === 0 || isScanning || !selectedProjectId}
                  >
                    {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
                    {isScanning ? "Scanning..." : "Run AI Assessment"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {isScanning && (
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">AI Assessment in Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyzing {uploadedFiles.length} documents against{" "}
                      {selectedChapter && selectedChapter !== "all" ? "selected chapter standards" : "all CBAHI standards"}
                    </p>
                  </div>
                  <div className="w-full max-w-md">
                    <Progress value={scanProgress} className="h-3" />
                    <p className="mt-2 text-center text-sm text-muted-foreground">{scanProgress}% complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <ScanSearch className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Assessment Complete</h2>
                    <p className="text-sm text-muted-foreground">
                      {results.length} measurable elements analyzed &middot; {uploadedFiles.length} documents processed
                      {assessmentSummary && ` &middot; Overall Score: ${assessmentSummary.overallScore}%`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{results.filter(r => r.ai_score === "compliant").length}</p>
                    <p className="text-xs text-muted-foreground">Compliant</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{results.filter(r => r.ai_score === "partial").length}</p>
                    <p className="text-xs text-muted-foreground">Partial</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{results.filter(r => r.ai_score === "non-compliant").length}</p>
                    <p className="text-xs text-muted-foreground">Non-Compliant</p>
                  </div>
                  <Button variant="outline" onClick={() => { setScanComplete(false); setResults([]); setAssessmentSummary(null); }}>
                    New Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Standards Checklist</CardTitle>
                  <CardDescription>Click an item to view AI analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-4 w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="compliant" className="flex-1">✅</TabsTrigger>
                      <TabsTrigger value="partial" className="flex-1">⚠️</TabsTrigger>
                      <TabsTrigger value="non-compliant" className="flex-1">❌</TabsTrigger>
                    </TabsList>
                    {["all", "compliant", "partial", "non-compliant"].map(tab => (
                      <TabsContent key={tab} value={tab}>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-2 pr-4">
                            {results
                              .filter(r => tab === "all" || r.ai_score === tab)
                              .map(result => (
                                <button
                                  key={result.me_id}
                                  onClick={() => setSelectedME(result)}
                                  className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${selectedME?.me_id === result.me_id ? "border-primary bg-primary/5" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(result.ai_score)}
                                        <span className="font-mono text-xs font-semibold text-primary">{result.me_code}</span>
                                      </div>
                                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{result.me_text}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-sm font-bold">{result.match_score}%</span>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {selectedME ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-primary">{selectedME.me_code}</span>
                          {getStatusBadge(selectedME.ai_score)}
                        </div>
                        <p className="mt-2 text-sm text-foreground">{selectedME.me_text}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Match Score</span>
                          <span className={`text-2xl font-bold ${selectedME.match_score >= 80 ? "text-green-600" : selectedME.match_score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                            {selectedME.match_score}%
                          </span>
                        </div>
                        <Progress
                          value={selectedME.match_score}
                          className="h-3"
                          indicatorClassName={selectedME.match_score >= 80 ? "bg-green-500" : selectedME.match_score >= 50 ? "bg-yellow-500" : "bg-red-500"}
                        />
                        <p className="mt-2 text-xs text-muted-foreground">AI Confidence: {selectedME.ai_confidence}%</p>
                      </div>

                      <div>
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-primary" /> AI Analysis
                        </h3>
                        <div className="rounded-lg border bg-blue-50/50 p-4">
                          <p className="text-sm leading-relaxed text-foreground">{selectedME.justification}</p>
                        </div>
                      </div>

                      {selectedME.evidence_found.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-semibold text-green-700">✅ Evidence Found ({selectedME.evidence_found.length})</h3>
                          <div className="space-y-2">
                            {selectedME.evidence_found.map(ev => (
                              <div key={ev.evidence_id} className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">{ev.document_name}</span>
                                  </div>
                                  <Badge variant="success">{ev.relevance_score}% match</Badge>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {ev.matched_sections.map((section, i) => (
                                    <p key={i} className="text-xs text-green-700">→ {section}</p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedME.evidence_missing.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-semibold text-red-700">❌ Evidence Missing ({selectedME.evidence_missing.length})</h3>
                          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                            <ul className="space-y-1">
                              {selectedME.evidence_missing.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                                  <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {selectedME.gaps.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-semibold text-yellow-700">⚠️ Identified Gaps</h3>
                          <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-3">
                            <ul className="space-y-1">
                              {selectedME.gaps.map((gap, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {gap}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {selectedME.recommendations.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-semibold">💡 Recommendations</h3>
                          <div className="rounded-lg border p-3">
                            <ul className="space-y-2">
                              {selectedME.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex h-[600px] items-center justify-center p-6">
                    <div className="text-center">
                      <Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium text-muted-foreground">Select a Standard</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Click on a measurable element from the left panel to view the detailed AI analysis</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
