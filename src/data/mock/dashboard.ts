import { mockActivityLog } from "./activityLog";

const chapterScoresPrj1 = [
  { chapter_id: "CH-CBAHI-DA", chapter_name: "Document Authentication", score: 85, total_mes: 3, compliant: 2, partial: 1, non_compliant: 0, not_applicable: 0 },
  { chapter_id: "CH-CBAHI-SIPC", chapter_name: "Surveillance, IPC", score: 62, total_mes: 8, compliant: 3, partial: 3, non_compliant: 2, not_applicable: 0 },
  { chapter_id: "CH-CBAHI-PS", chapter_name: "Patient Safety", score: 78, total_mes: 2, compliant: 1, partial: 1, non_compliant: 0, not_applicable: 0 },
  { chapter_id: "CH-CBAHI-FM", chapter_name: "Facility Management", score: 70, total_mes: 2, compliant: 1, partial: 0, non_compliant: 1, not_applicable: 0 },
  { chapter_id: "CH-CBAHI-MM", chapter_name: "Medication Management", score: 90, total_mes: 1, compliant: 1, partial: 0, non_compliant: 0, not_applicable: 0 },
  { chapter_id: "CH-CBAHI-LD", chapter_name: "Leadership", score: 80, total_mes: 1, compliant: 0, partial: 1, non_compliant: 0, not_applicable: 0 },
];

export const mockProjects = [
  { id: "PRJ-001", name: "CBAHI 2026 Full Readiness Assessment", facility: "King Fahad Medical City", facility_id: "FAC-001", accreditation_id: "ACC-CBAHI", accreditation_name: "CBAHI Hospital Accreditation", standard_version: "CBAHI 2026 v1.0", scope: "full", selected_chapters: ["CH-CBAHI-DA", "CH-CBAHI-SIPC", "CH-CBAHI-PS", "CH-CBAHI-FM", "CH-CBAHI-MM", "CH-CBAHI-LD"], departments: ["All"], status: "in-progress", created_by: "Dr. Varun Mehta", created_on: "2026-01-15", updated_on: "2026-02-12", deadline: "2026-04-30", team_members: ["Dr. Varun Mehta", "Pradeep Kumar", "Utkarsh Singh", "Dr. Fatima Al-Rashid"], overall_score: 72, chapter_scores: chapterScoresPrj1 },
  { id: "PRJ-002", name: "IPC Chapter Focused Review", facility: "King Fahad Medical City", facility_id: "FAC-001", accreditation_id: "ACC-CBAHI", accreditation_name: "CBAHI Hospital Accreditation", standard_version: "CBAHI 2026 v1.0", scope: "partial", selected_chapters: ["CH-CBAHI-SIPC"], departments: ["Infection Control", "CSSD", "ICU", "Surgery"], status: "draft", created_by: "Pradeep Kumar", created_on: "2026-01-20", updated_on: "2026-01-20", deadline: "2026-03-15", team_members: ["Pradeep Kumar", "Dr. Fatima Al-Rashid"], overall_score: 0, chapter_scores: [] },
  { id: "PRJ-003", name: "JCI Hospital Accreditation Prep", facility: "National Guard Hospital", facility_id: "FAC-002", accreditation_id: "ACC-JCI", accreditation_name: "JCI Hospital Accreditation", standard_version: "JCI 7th Edition", scope: "full", selected_chapters: ["CH-JCI-IPSG", "CH-JCI-PCI", "CH-JCI-MMU"], departments: ["All"], status: "in-progress", created_by: "Utkarsh Singh", created_on: "2026-01-25", updated_on: "2026-02-01", deadline: "2026-06-30", team_members: ["Utkarsh Singh"], overall_score: 45, chapter_scores: [] },
];

export const mockComplianceScores = [
  { me_id: "ME-SIPC1-1-01", me_code: "SIPC.1.1.1", me_text: "Hand hygiene policy consistent with WHO guidelines.", ai_score: "compliant", ai_confidence: 92, match_score: 92, reviewer_score: null, justification: "Hand Hygiene Policy v3 fully aligns with WHO Five Moments framework.", evidence_found: [{ evidence_id: "EV-001", document_name: "Hand_Hygiene_Policy_v3.pdf", relevance_score: 95, matched_sections: [] }], evidence_missing: [], gaps: [], recommendations: [] },
  { me_id: "ME-SIPC1-1-02", me_code: "SIPC.1.1.2", me_text: "Hand hygiene compliance rates monitored monthly.", ai_score: "partial", ai_confidence: 75, match_score: 68, reviewer_score: "partial", justification: "Monthly audit found but compliance at 82%. Only 1 month uploaded.", evidence_found: [{ evidence_id: "EV-002", document_name: "Monthly_HH_Audit_Jan2026.xlsx", relevance_score: 78, matched_sections: [] }], evidence_missing: ["Audit reports for past 6 months", "ICC meeting minutes"], gaps: ["Compliance rate below 85%", "Insufficient audit history"], recommendations: [] },
  { me_id: "ME-PS1-1-01", me_code: "PS.1.1.1", me_text: "Patient identification with two identifiers.", ai_score: "compliant", ai_confidence: 95, match_score: 96, reviewer_score: null, justification: "Policy fully meets requirements.", evidence_found: [{ evidence_id: "EV-006", document_name: "Patient_ID_Policy_v2.pdf", relevance_score: 96, matched_sections: [] }], evidence_missing: [], gaps: [], recommendations: [] },
  { me_id: "ME-MM1-1-01", me_code: "MM.1.1.1", me_text: "High-alert medications policy.", ai_score: "compliant", ai_confidence: 90, match_score: 90, reviewer_score: null, justification: "Policy is comprehensive and ISMP-based.", evidence_found: [{ evidence_id: "EV-007", document_name: "High_Alert_Medications_Policy.pdf", relevance_score: 92, matched_sections: [] }], evidence_missing: [], gaps: [], recommendations: [] },
];

export const mockAccreditationsForDashboard = [
  { id: "ACC-CBAHI", name: "CBAHI Hospital Accreditation", code: "CBAHI", description: "Central Board for Accreditation of Healthcare Institutions.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [{ id: "CH-CBAHI-DA", code: "DA", name: "Document Authentication" }, { id: "CH-CBAHI-SIPC", code: "SIPC", name: "Surveillance, IPC" }, { id: "CH-CBAHI-PS", code: "PS", name: "Patient Safety" }], project_count: 2, overall_progress: 72 },
  { id: "ACC-CBAHI-CLINIC", name: "CBAHI Clinic Accreditation", code: "CBAHI-CLINIC", description: "CBAHI Sibahi standards for primary healthcare clinics.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [], project_count: 0, overall_progress: 0 },
  { id: "ACC-JCI", name: "JCI Hospital Accreditation", code: "JCI", description: "Joint Commission International - global gold-standard.", version: "7th Edition", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [{ id: "CH-JCI-IPSG", code: "IPSG", name: "International Patient Safety Goals" }, { id: "CH-JCI-PCI", code: "PCI", name: "Prevention and Control of Infections" }], project_count: 1, overall_progress: 45 },
];

export const mockDashboard = {
  projects: mockProjects,
  activityLog: mockActivityLog,
  complianceScores: mockComplianceScores,
  accreditations: mockAccreditationsForDashboard,
};
