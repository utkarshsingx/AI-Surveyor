// ============================================
// AI Surveyor — Core Type Definitions
// ============================================

// Accreditation & Hierarchy
export interface Accreditation {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: "active" | "draft" | "archived";
  created_at: string;
  chapters: Chapter[];
  project_count?: number;
  overall_progress?: number;
}

export interface Chapter {
  id: string;
  accreditation_id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  standards: Standard[];
  score?: number;
  total_standards?: number;
}

export interface Standard {
  id: string;
  chapter_id: string;
  code: string;
  standard_name: string;
  description: string;
  criticality: "critical" | "non-critical";
  sort_order: number;
  sub_standards: SubStandard[];
}

export interface SubStandard {
  id: string;
  standard_id: string;
  code: string;
  name: string;
  sort_order: number;
  measurable_elements: MeasurableElement[];
  activities: Activity[];
  completion?: {
    total: number;
    completed: number;
    percentage: number;
  };
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

// Activities
export interface Activity {
  id: string;
  sub_standard_id: string;
  me_id?: string;
  type: "checklist" | "data_collection" | "document_evidence";
  label: string;
  description: string;
  field_type: "boolean" | "text" | "number" | "date" | "file" | "select";
  options?: string[];
  required: boolean;
  sort_order: number;
  response?: ActivityResponse;
}

export interface ActivityResponse {
  id: string;
  activity_id: string;
  project_id: string;
  value: string;
  status: "pending" | "completed" | "reviewed";
  notes: string;
  files: string[];
  updated_at: string;
}

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
  facility_id: string;
  accreditation_id?: string;
  accreditation_name?: string;
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
  /** Per-standard scores (AI surveyor report — compare with manual assessment) */
  standard_scores?: StandardScore[];
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

export interface StandardScore {
  standard_id: string;
  standard_code: string;
  standard_name: string;
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
  chapter_id: string;
  description: string;
  file_type: string;
  uploaded_by: string;
  upload_date: string;
  mapped_mes: string[];
  version: string;
  category?: string;
  status?: string;
}

// Policies
export interface Policy {
  id: string;
  name: string;
  code?: string;
  category: "policy" | "procedure" | "guideline" | "manual";
  department: string;
  description: string;
  file_type: string;
  file_path: string;
  version: string;
  status: "active" | "draft" | "archived" | "expired";
  effective_date?: string;
  review_date?: string;
  owner: string;
  mapped_sub_standards?: string[];
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

// Checklist Template (Legacy / Admin)
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

// AI Surveyor — standards-based assessment results
export type ActivityAssessmentStatus = "met" | "partially_met" | "not_met";

export interface AISurveyorActivityResult {
  activityId: string;
  label: string;
  status: ActivityAssessmentStatus;
  justification: string;
}

export interface AISurveyorSubStandardResult {
  subStandardId: string;
  code: string;
  name: string;
  score: number;
  activities: AISurveyorActivityResult[];
}

export interface AISurveyorStandardResult {
  standardId: string;
  code: string;
  name: string;
  score: number;
  subStandards: AISurveyorSubStandardResult[];
}

export interface AISurveyorResult {
  overallScore: number;
  summary: string;
  standards: AISurveyorStandardResult[];
  documentName: string;
  analyzedAt: string;
}
