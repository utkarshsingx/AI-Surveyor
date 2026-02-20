"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Trash2,
  Eye,
  Download,
  Edit,
  CheckCircle2,
  Search,
  Settings,
  Database,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  fetchMasterDocuments,
  createMasterDocument,
  deleteMasterDocument,
  fetchChecklistTemplate,
  saveChecklistTemplate,
} from "@/lib/api-client";
import type { MasterDocument, ChecklistTemplate } from "@/types";

export default function AdminPage() {
  const [docs, setDocs] = useState<MasterDocument[]>([]);
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateJson, setTemplateJson] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Upload form
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState("policy");
  const [uploadMeCodes, setUploadMeCodes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // Detail dialog
  const [detailDoc, setDetailDoc] = useState<MasterDocument | null>(null);

  useEffect(() => {
    Promise.all([fetchMasterDocuments(), fetchChecklistTemplate()])
      .then(([docsData, templateData]) => {
        setDocs(docsData);
        setTemplate(templateData);
        setTemplateJson(JSON.stringify(templateData.items, null, 2));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadDocs = async () => {
    try {
      const data = await fetchMasterDocuments(searchQuery || undefined);
      setDocs(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Re-fetch docs when search changes
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(loadDocs, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const documentName = uploadName.trim() || uploadFile.name || "Untitled Master Document";
      await createMasterDocument({
        name: documentName,
        category: uploadCategory,
        mappedMeCodes: uploadMeCodes.split(",").map(s => s.trim()).filter(Boolean),
        fileType: uploadFile.type || "application/octet-stream",
      });
      setShowUpload(false);
      setUploadName("");
      setUploadCategory("policy");
      setUploadMeCodes("");
      setUploadFile(null);
      await loadDocs();
    } catch (err) {
      console.error(err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload master document"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this master document?")) return;
    try {
      await deleteMasterDocument(id);
      await loadDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const items = JSON.parse(templateJson);
      await saveChecklistTemplate(items);
      const updated = await fetchChecklistTemplate();
      setTemplate(updated);
      setTemplateJson(JSON.stringify(updated.items, null, 2));
      setEditingTemplate(false);
    } catch (err) {
      console.error(err);
      alert("Invalid JSON or save failed");
    } finally {
      setSavingTemplate(false);
    }
  };

  const filteredDocs = docs;

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
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage master documents and checklist templates</p>
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2"><Database className="h-4 w-4" /> Master Documents</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Settings className="h-4 w-4" /> Checklist Templates</TabsTrigger>
        </TabsList>

        {/* Master Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents or ME IDs..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Master Document</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Master Document</DialogTitle>
                  <DialogDescription>Upload a gold-standard policy document to map against standards</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {uploadError && (
                      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {uploadError}
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-sm font-medium">File</label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setUploadFile(file);
                          if (file && !uploadName.trim()) {
                            setUploadName(file.name);
                          }
                        }}
                      />
                      {uploadFile && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Selected: {uploadFile.name}
                        </p>
                      )}
                    </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Document Name</label>
                    <Input placeholder="e.g., Hospital Infection Control Policy v4.0" value={uploadName} onChange={e => setUploadName(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="guideline">Guideline</SelectItem>
                        <SelectItem value="form">Form / Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Map to ME IDs (comma-separated)</label>
                    <Input placeholder="e.g., IPC.1.1, IPC.2.1, IPC.2.2" value={uploadMeCodes} onChange={e => setUploadMeCodes(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload & Map
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{docs.length}</p>
                  <p className="text-xs text-muted-foreground">Master Documents</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <LinkIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{docs.reduce((acc, d) => acc + d.mapped_mes.length, 0)}</p>
                  <p className="text-xs text-muted-foreground">ME Mappings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{docs.filter(d => d.status === "active").length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <FileText className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{template?.items.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Checklist Items</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Mapped MEs</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Updated</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr
                        key={doc.id}
                        className={`border-b transition-colors hover:bg-muted/30 ${selectedDoc === doc.id ? "bg-primary/5" : ""}`}
                        onClick={() => setSelectedDoc(doc.id === selectedDoc ? null : doc.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{doc.category || doc.file_type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {doc.mapped_mes.map(id => (
                              <Badge key={id} variant="secondary" className="text-[10px]">{id}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={doc.status === "active" ? "success" : "outline"}>{doc.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{doc.upload_date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setDetailDoc(doc); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No master documents found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">JSON-based checklist templates define what the AI looks for during assessments</p>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setEditingTemplate(!editingTemplate)}>
                <Edit className="h-4 w-4" /> {editingTemplate ? "Preview" : "Edit JSON"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => {
                const blob = new Blob([templateJson], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "checklist-template.json";
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {editingTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Checklist Template — JSON Editor</CardTitle>
                <CardDescription>Edit the template that defines assessment criteria for each ME</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[500px] font-mono text-xs"
                  value={templateJson}
                  onChange={e => setTemplateJson(e.target.value)}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setEditingTemplate(false); setTemplateJson(JSON.stringify(template?.items || [], null, 2)); }}>Cancel</Button>
                  <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                    {savingTemplate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {template?.items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">{index + 1}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="mr-2 font-mono text-sm font-bold text-primary">{item.me_code}</span>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Badge variant={item.required ? "destructive" : "outline"}>{item.required ? "required" : "optional"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                          <Badge variant="secondary" className="text-[10px]">type: {item.type}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!template || template.items.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">No checklist items. Click Edit JSON to add items.</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={open => !open && setDetailDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailDoc?.name}</DialogTitle>
            <DialogDescription>Master document details</DialogDescription>
          </DialogHeader>
          {detailDoc && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><Badge variant="outline">{detailDoc.category || detailDoc.file_type}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={detailDoc.status === "active" ? "success" : "outline"}>{detailDoc.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uploaded By</span><span>{detailDoc.uploaded_by}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span>{detailDoc.upload_date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>{detailDoc.version}</span></div>
              <div>
                <p className="text-muted-foreground mb-1">Mapped MEs</p>
                <div className="flex flex-wrap gap-1">
                  {detailDoc.mapped_mes.map(id => <Badge key={id} variant="secondary">{id}</Badge>)}
                </div>
              </div>
              {detailDoc.description && (
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="rounded-md bg-muted p-3 text-xs">{detailDoc.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
