"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Search,
  Eye,
  Trash2,
  Tag,
  Clock,
  HardDrive,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { fetchEvidence, createEvidence, deleteEvidence } from "@/lib/api-client";
import type { Evidence } from "@/types";

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Upload dialog state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("policy");
  const [uploadDept, setUploadDept] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // Detail dialog
  const [detailDoc, setDetailDoc] = useState<Evidence | null>(null);

  const loadEvidence = useCallback(() => {
    setLoading(true);
    fetchEvidence({
      type: filterType !== "all" ? filterType : undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      search: searchQuery || undefined,
    })
      .then(setEvidence)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType, filterStatus, searchQuery]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const documentName = uploadName.trim() || uploadFile.name || "Untitled Evidence";
      await createEvidence({
        documentName,
        type: uploadType,
        department: uploadDept || "General",
        summary: uploadSummary,
        fileType: uploadFile.type || "application/octet-stream",
        fileSize: uploadFile.size || 0,
      });
      setShowUpload(false);
      setUploadName("");
      setUploadType("policy");
      setUploadDept("");
      setUploadSummary("");
      setUploadFile(null);
      loadEvidence();
    } catch (err) {
      console.error(err);
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload evidence"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteEvidence(id);
      loadEvidence();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mapped": return "success";
      case "classified": return "warning";
      case "pending": return "secondary";
      case "reviewed": return "default";
      default: return "secondary" as const;
    }
  };

  if (loading && evidence.length === 0) {
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
          <h1 className="text-2xl font-bold">Evidence Library</h1>
          <p className="text-sm text-muted-foreground">
            Manage uploaded documents and evidence files
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Evidence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Evidence Document</DialogTitle>
              <DialogDescription>
                Add a new document to your evidence library
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {uploadError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {uploadError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Document Name</label>
                <Input
                  placeholder="e.g., Infection Control Policy v3"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                />
              </div>
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
                <label className="mb-1 block text-sm font-medium">Type</label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="record">Record</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Department</label>
                <Input
                  placeholder="e.g., Infection Prevention"
                  value={uploadDept}
                  onChange={e => setUploadDept(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Summary</label>
                <Input
                  placeholder="Brief description of the document"
                  value={uploadSummary}
                  onChange={e => setUploadSummary(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadFile}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{evidence.length}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Tag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.status === "mapped").length}</p>
                <p className="text-xs text-muted-foreground">Mapped to MEs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{evidence.filter(e => e.status === "classified").length}</p>
                <p className="text-xs text-muted-foreground">Pending Mapping</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(evidence.reduce((sum, e) => sum + e.file_size, 0) / 1024 / 1024).toFixed(1)} MB
                </p>
                <p className="text-xs text-muted-foreground">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="record">Record</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="classified">Classified</SelectItem>
                <SelectItem value="mapped">Mapped</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Uploaded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Size</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map(ev => (
                  <tr key={ev.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{ev.document_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ev.summary.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{ev.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{ev.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusColor(ev.status) as "success" | "warning" | "secondary" | "default"} className="capitalize">
                        {ev.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm">{ev.upload_date}</p>
                        <p className="text-xs text-muted-foreground">{ev.uploaded_by}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(ev.file_size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailDoc(ev)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(ev.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {evidence.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No documents found. Upload evidence to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailDoc} onOpenChange={open => !open && setDetailDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailDoc?.document_name}</DialogTitle>
            <DialogDescription>Document details</DialogDescription>
          </DialogHeader>
          {detailDoc && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline" className="capitalize">{detailDoc.type}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{detailDoc.department}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={getStatusColor(detailDoc.status) as "success" | "warning" | "secondary" | "default"} className="capitalize">{detailDoc.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Uploaded By</span><span>{detailDoc.uploaded_by}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span>{detailDoc.upload_date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">File Size</span><span>{(detailDoc.file_size / 1024 / 1024).toFixed(2)} MB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>{detailDoc.version}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span>{detailDoc.owner}</span></div>
              <div><p className="text-muted-foreground mb-1">Summary</p><p className="rounded-md bg-muted p-3 text-xs">{detailDoc.summary}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
