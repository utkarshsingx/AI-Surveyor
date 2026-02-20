/**
 * Frontend API Client
 * Typed fetch wrapper for all backend endpoints
 */

import type {
  SurveyProject,
  Evidence,
  ComplianceScore,
  CorrectiveAction,
  MasterDocument,
  ActivityLog,
  ChecklistTemplate,
  CopilotMessage,
} from "@/types";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

// ============================================
// DASHBOARD
// ============================================
export async function fetchDashboard(): Promise<{
  projects: SurveyProject[];
  activityLog: ActivityLog[];
  complianceScores: ComplianceScore[];
}> {
  return fetcher("/api/dashboard");
}

// ============================================
// PROJECTS
// ============================================
export async function fetchProjects(): Promise<SurveyProject[]> {
  return fetcher("/api/projects");
}

export async function fetchProject(id: string): Promise<SurveyProject> {
  return fetcher(`/api/projects/${id}`);
}

export async function createProject(data: {
  name: string;
  facilityId: string;
  standardVersion?: string;
  scope?: string;
  selectedChapters?: string[];
  departments?: string[];
  deadline: string;
  teamMembers?: string[];
}): Promise<{ id: string; name: string; status: string }> {
  return fetcher("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await fetcher(`/api/projects/${id}`, { method: "DELETE" });
}

// ============================================
// EVIDENCE
// ============================================
export async function fetchEvidence(params?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<Evidence[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return fetcher(`/api/evidence${qs ? `?${qs}` : ""}`);
}

export async function createEvidence(data: {
  documentName: string;
  type?: string;
  department?: string;
  fileType?: string;
  fileSize?: number;
  summary?: string;
}): Promise<{ id: string; document_name: string; status: string }> {
  return fetcher("/api/evidence", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteEvidence(id: string): Promise<void> {
  await fetcher(`/api/evidence/${id}`, { method: "DELETE" });
}

// ============================================
// COMPLIANCE SCORES
// ============================================
export async function fetchComplianceScores(): Promise<ComplianceScore[]> {
  return fetcher("/api/compliance-scores");
}

export async function saveReviewOverride(data: {
  scoreId: string;
  reviewerScore: string;
  reviewerComment?: string;
}): Promise<void> {
  await fetcher("/api/compliance-scores", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ============================================
// CORRECTIVE ACTIONS
// ============================================
export async function fetchCorrectiveActions(projectId?: string): Promise<CorrectiveAction[]> {
  const qs = projectId ? `?projectId=${projectId}` : "";
  return fetcher(`/api/corrective-actions${qs}`);
}

// ============================================
// ASSESSMENTS
// ============================================
export async function runAssessment(data: {
  projectId: string;
  chapterFilter?: string;
}): Promise<{
  assessmentId: string;
  status: string;
  overallScore: number;
  totalMes: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
}> {
  return fetcher("/api/assessments/run", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAssessmentResults(assessmentId: string): Promise<{
  assessmentId: string;
  status: string;
  scores: ComplianceScore[];
}> {
  return fetcher(`/api/assessments/${assessmentId}/results`);
}

// ============================================
// STANDARDS
// ============================================
export async function fetchStandards(): Promise<{
  standards: {
    id: string;
    chapter_id: string;
    chapter_name: string;
    sub_standards: {
      id: string;
      name: string;
      measurable_elements: { id: string; code: string; text: string; criticality: string }[];
    }[];
  }[];
}> {
  return fetcher("/api/standards");
}

// ============================================
// COPILOT
// ============================================
export async function sendCopilotMessage(data: {
  message: string;
  conversationId?: string;
}): Promise<{
  id: string;
  conversationId: string;
  role: string;
  content: string;
  timestamp: string;
  sources?: { document_name: string; section: string; relevance: number }[];
}> {
  return fetcher("/api/copilot/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchCopilotHistory(conversationId?: string): Promise<{
  conversationId: string;
  messages: CopilotMessage[];
}> {
  const qs = conversationId ? `?conversationId=${conversationId}` : "";
  return fetcher(`/api/copilot/history${qs}`);
}

export async function sendCopilotFeedback(messageId: string, feedback: "positive" | "negative"): Promise<void> {
  await fetcher("/api/copilot/feedback", {
    method: "POST",
    body: JSON.stringify({ messageId, feedback }),
  });
}

// ============================================
// ADMIN
// ============================================
export async function fetchMasterDocuments(search?: string): Promise<MasterDocument[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return fetcher(`/api/admin/master-documents${qs}`);
}

export async function createMasterDocument(data: {
  name: string;
  category?: string;
  mappedMeCodes?: string[];
  chapterId?: string;
  description?: string;
  fileType?: string;
}): Promise<{ id: string; name: string }> {
  return fetcher("/api/admin/master-documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteMasterDocument(id: string): Promise<void> {
  await fetcher(`/api/admin/master-documents/${id}`, { method: "DELETE" });
}

export async function fetchChecklistTemplate(): Promise<ChecklistTemplate> {
  return fetcher("/api/admin/checklist-templates");
}

export async function saveChecklistTemplate(items: ChecklistTemplate["items"]): Promise<void> {
  await fetcher("/api/admin/checklist-templates", {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

// ============================================
// MISC
// ============================================
export async function fetchActivityLog(): Promise<ActivityLog[]> {
  return fetcher("/api/activity-log");
}

export async function fetchNotifications(): Promise<{
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}[]> {
  return fetcher("/api/notifications");
}

export async function markNotificationsRead(id?: string): Promise<void> {
  await fetcher("/api/notifications", {
    method: "PATCH",
    body: JSON.stringify(id ? { id } : { markAllRead: true }),
  });
}

export async function fetchFacilities(): Promise<{ id: string; name: string; location: string; type: string }[]> {
  return fetcher("/api/facilities");
}

export async function searchGlobal(q: string): Promise<{
  results: { type: string; id: string; title: string; subtitle: string }[];
}> {
  return fetcher(`/api/search?q=${encodeURIComponent(q)}`);
}
