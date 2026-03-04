"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Loader2,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  FolderOpen,
} from "lucide-react";

interface LibraryDocument {
  id: string;
  key: string;
  documentName: string;
  uploadedAt: string;
}

interface AdminConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getFileTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOCX",
    xls: "XLS",
    xlsx: "XLSX",
    txt: "TXT",
    md: "MD",
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPEG",
  };
  return (map[ext] ?? ext.toUpperCase()) || "File";
}

export function AdminConfigModal({ open, onOpenChange }: AdminConfigModalProps) {
  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLibrary = () => {
    setLoading(true);
    fetch("/api/document-assessment/library")
      .then((res) => res.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      fetchLibrary();
      setFile(null);
      setBulkFiles([]);
      setSearch("");
      setError("");
    }
  }, [open]);

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.trim().toLowerCase();
    return docs.filter(
      (d) =>
        d.documentName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/document-assessment/upload-library", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocs((prev) => [data, ...prev]);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      setError("Choose one or more files to upload.");
      return;
    }
    setError("");
    setBulkUploading(true);
    const added: LibraryDocument[] = [];
    for (const f of bulkFiles) {
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/document-assessment/upload-library", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) added.push(data);
      } catch {
        // skip failed file
      }
    }
    if (added.length > 0) setDocs((prev) => [...added, ...prev]);
    if (added.length < bulkFiles.length) {
      setError(
        `Uploaded ${added.length} of ${bulkFiles.length} file(s). Some may have failed.`
      );
    } else if (added.length > 0) {
      setError("");
    }
    setBulkFiles([]);
    setBulkUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this document from the library? It will no longer appear in the assessment modal.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/document-assessment/library/${id}`, {
        method: "DELETE",
      });
      if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
      else setError("Failed to remove document.");
    } catch {
      setError("Failed to remove document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#1a5276]" />
            Admin configuration
          </DialogTitle>
          <DialogDescription>
            Upload and manage documents used for AI assessment. They appear in the
            &quot;Upload document for AI assessment&quot; modal on the Self Assessment page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Upload section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload single document</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt,.md"
                  className="cursor-pointer flex-1"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  className="bg-[#1a5276] hover:bg-[#154360] shrink-0"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-1">{uploading ? "Uploading…" : "Upload"}</span>
                </Button>
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bulk upload</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*,.txt,.md"
                  className="cursor-pointer flex-1"
                  multiple
                  onChange={(e) =>
                    setBulkFiles(Array.from(e.target.files ?? []))
                  }
                />
                <Button
                  variant="secondary"
                  className="shrink-0"
                  disabled={bulkFiles.length === 0 || bulkUploading}
                  onClick={handleBulkUpload}
                >
                  {bulkUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="ml-1">
                    {bulkUploading
                      ? "Uploading…"
                      : `Upload ${bulkFiles.length} file(s)`}
                  </span>
                </Button>
              </div>
              {bulkFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {bulkFiles.length} file(s) selected
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Document list */}
          <div className="flex-1 min-h-0 flex flex-col border rounded-lg">
            <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">
                Uploaded documents ({docs.length})
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 w-[180px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={fetchLibrary}
                  disabled={loading}
                  title="Refresh list"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 min-h-[200px] max-h-[320px] p-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {docs.length === 0
                      ? "No documents yet"
                      : "No documents match your search"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                    {docs.length === 0
                      ? "Upload a file above to add documents. They can then be selected when running AI assessment."
                      : "Try a different search term or clear the search."}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filteredDocs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-[#1a5276]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{d.documentName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {getFileTypeLabel(d.documentName)}
                          </Badge>
                          <span>{formatRelativeTime(d.uploadedAt)}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        title="Remove from library"
                      >
                        {deletingId === d.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
