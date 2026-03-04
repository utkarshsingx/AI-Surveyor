import type { PolicyComplianceReport } from "@/lib/ai";

const reports: PolicyComplianceReport[] = [];
const pendingDocumentKeys: { key: string; documentName: string; uploadedAt: string }[] = [];

// Library of documents uploaded via Admin config for use in AI assessment
export interface LibraryDocument {
  id: string;
  key: string; // relative path under public, e.g. "uploads/self-assessment/uuid.pdf"
  documentName: string;
  uploadedAt: string;
}
const libraryDocuments: LibraryDocument[] = [];

export function addLibraryDocument(id: string, key: string, documentName: string): void {
  libraryDocuments.push({
    id,
    key: key.startsWith("/") ? key.slice(1) : key,
    documentName,
    uploadedAt: new Date().toISOString(),
  });
}

export function listLibraryDocuments(): LibraryDocument[] {
  return [...libraryDocuments];
}

export function getLibraryDocument(id: string): LibraryDocument | undefined {
  return libraryDocuments.find((d) => d.id === id);
}

export function getLibraryDocumentByKey(key: string): LibraryDocument | undefined {
  const normalized = key.startsWith("/") ? key.slice(1) : key;
  return libraryDocuments.find((d) => d.key === normalized || d.key === key);
}

export function removeLibraryDocument(id: string): void {
  const i = libraryDocuments.findIndex((d) => d.id === id);
  if (i >= 0) libraryDocuments.splice(i, 1);
}

export function addReport(report: PolicyComplianceReport): void {
  reports.unshift(report);
}

export function getReports(): PolicyComplianceReport[] {
  return [...reports];
}

export function getReportById(reportId: string): PolicyComplianceReport | undefined {
  return reports.find((r) => r.reportId === reportId);
}

export function addPendingDocument(key: string, documentName: string): void {
  if (pendingDocumentKeys.some((p) => p.key === key)) return;
  pendingDocumentKeys.push({ key, documentName, uploadedAt: new Date().toISOString() });
}

export function getNextPendingDocument(): { key: string; documentName: string } | null {
  const next = pendingDocumentKeys.shift();
  return next ?? null;
}

export function listPendingDocuments(): { key: string; documentName: string; uploadedAt: string }[] {
  return [...pendingDocumentKeys];
}

export function removePendingByKey(key: string): void {
  const i = pendingDocumentKeys.findIndex((p) => p.key === key);
  if (i >= 0) pendingDocumentKeys.splice(i, 1);
}
