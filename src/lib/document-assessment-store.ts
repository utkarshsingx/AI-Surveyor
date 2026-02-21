import type { PolicyComplianceReport } from "@/lib/ai";

const reports: PolicyComplianceReport[] = [];
const pendingDocumentKeys: { key: string; documentName: string; uploadedAt: string }[] = [];

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
