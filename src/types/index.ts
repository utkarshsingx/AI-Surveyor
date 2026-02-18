// ============================================
// AI Surveyor — Core Type Definitions
// ============================================

// Standards & Measurable Elements
export interface Standard {
  id: string;
  chapter_id: string;
  chapter_name: string;
  standard_name: string;
  description: string;
  sub_standards: SubStandard[];
  version: string;
  criticality: "critical" | "non-critical";
}

export interface SubStandard {
  id: string;
  name: string;
  measurable_elements: MeasurableElement[];
}

export interface MeasurableElement {
  id: string;
  code: string;
  text: string;
  criticality: "critical" | "non-critical";
  required_evidence_type: EvidenceType[];
  keywords: string[];
  departments: string[];
  scoring_rule: string;
}

export type EvidenceType = "policy" | "procedure" | "record" | "observation" | "interview" | "training" | "audit";

// Evidence & Documents
export interface Evidence {
  id: string;
  document_name: string;
  type: EvidenceType;
  department: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  upload_date: string;
  version: string;
  owner: string;
  summary: string;
  status: "pending" | "classified" | "mapped" | "reviewed";
}

// Compliance & Scoring
export type ComplianceStatus = "compliant" | "partial" | "non-compliant" | "not-applicable";

export interface ComplianceScore {
  me_id: string;
  me_code: string;
  me_text: string;
  ai_score: ComplianceStatus;
  ai_confidence: number;
  match_score: number;
  reviewer_score?: ComplianceStatus;
  justification: string;
  evidence_found: EvidenceMatch[];
  evidence_missing: string[];
  gaps: string[];
  recommendations: string[];
}

export interface EvidenceMatch {
  evidence_id: string;
  document_name: string;
  relevance_score: number;
  matched_sections: string[];
}

// Survey Projects
export interface SurveyProject {
  id: string;
  name: string;
  facility: string;
  standard_version: string;
  scope: "full" | "partial";
  selected_chapters: string[];
  departments: string[];
  status: "draft" | "in-progress" | "review" | "completed";
  created_by: string;
  created_on: string;
  updated_on: string;
  deadline: string;
  team_members: string[];
  overall_score: number;
  chapter_scores: ChapterScore[];
}

export interface ChapterScore {
  chapter_id: string;
  chapter_name: string;
  score: number;
  total_mes: number;
  compliant: number;
  partial: number;
  non_compliant: number;
  not_applicable: number;
}

// Corrective Actions
export interface CorrectiveAction {
  id: string;
  me_id: string;
  me_code: string;
  gap_description: string;
  action_type: "policy_update" | "training" | "evidence_creation" | "process_redesign" | "rca";
  recommended_action: string;
  assigned_department: string;
  assigned_to: string;
  due_date: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "completed" | "verified";
}

// Master Documents
export interface MasterDocument {
  id: string;
  name: string;
  standard_id: string;
  chapter_id: string;
  description: string;
  file_type: string;
  uploaded_by: string;
  upload_date: string;
  mapped_mes: string[];
  version: string;
  category?: string;
  status?: string;
  last_updated?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: "upload" | "scan" | "review" | "report" | "override" | "system";
}

// Checklist Template (JSON-driven)
export interface ChecklistTemplate {
  id: string;
  standard_id: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  me_code: string;
  category: "checklist" | "data_collection" | "document_evidence";
  label: string;
  description: string;
  type: "boolean" | "text" | "number" | "date" | "file" | "select";
  required: boolean;
  options?: string[];
  value?: string | boolean | number;
  evidence_files?: string[];
}

// Co-Pilot
export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: CopilotSource[];
}

export interface CopilotSource {
  document_name: string;
  section: string;
  relevance: number;
}
