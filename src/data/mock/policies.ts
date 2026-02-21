/** Policy shape returned by GET /api/policies */
export interface MockPolicy {
  id: string;
  name: string;
  code: string | null;
  category: string;
  department: string;
  description: string;
  file_type: string;
  file_path: string;
  version: string;
  status: string;
  effective_date: string | null;
  review_date: string | null;
  owner: string;
  mapped_sub_standards: string[];
}

export const mockPolicies: MockPolicy[] = [
  { id: "POL-001", name: "Hand Hygiene Policy", code: "IPC-POL-001", category: "policy", department: "Infection Control", description: "Organizational hand hygiene policy consistent with WHO guidelines.", file_type: "application/pdf", file_path: "/uploads/policies/Hand_Hygiene_Policy_v3.pdf", version: "3.0", status: "active", effective_date: "2025-01-01", review_date: "2026-01-01", owner: "IPC Department", mapped_sub_standards: ["SS-SIPC1-1"] },
  { id: "POL-002", name: "Patient Identification Policy", code: "PS-POL-001", category: "policy", department: "Nursing", description: "Policy for patient identification using two identifiers.", file_type: "application/pdf", file_path: "/uploads/policies/Patient_ID_Policy_v2.pdf", version: "2.0", status: "active", effective_date: "2024-06-01", review_date: "2026-06-01", owner: "Nursing Department", mapped_sub_standards: ["SS-PS1-1"] },
  { id: "POL-003", name: "Fire Safety Plan", code: "FM-POL-001", category: "policy", department: "Safety", description: "Comprehensive fire safety plan with evacuation procedures.", file_type: "application/pdf", file_path: "/uploads/policies/Fire_Safety_Plan_2025.pdf", version: "2.0", status: "active", effective_date: "2025-03-01", review_date: "2026-03-01", owner: "Safety Department", mapped_sub_standards: ["SS-PS2-1"] },
  { id: "POL-004", name: "High-Alert Medications Policy", code: "MM-POL-001", category: "policy", department: "Pharmacy", description: "High-alert medications management per ISMP guidelines.", file_type: "application/pdf", file_path: "/uploads/policies/High_Alert_Medications_Policy.pdf", version: "3.0", status: "active", effective_date: "2025-01-15", review_date: "2026-01-15", owner: "Pharmacy", mapped_sub_standards: ["SS-MM1-1"] },
  { id: "POL-005", name: "Document Control Procedure", code: "DA-POL-001", category: "procedure", department: "Quality", description: "Procedure for document control, versioning, and distribution.", file_type: "application/pdf", file_path: "", version: "1.0", status: "active", effective_date: "2025-06-01", review_date: "2026-06-01", owner: "Quality Department", mapped_sub_standards: ["SS-DA1-1", "SS-DA1-2"] },
  { id: "POL-006", name: "CSSD Sterilization SOP", code: "IPC-SOP-001", category: "procedure", department: "CSSD", description: "Standard operating procedures for CSSD sterilization and disinfection.", file_type: "application/pdf", file_path: "/uploads/policies/Sterilization_SOP_CSSD.pdf", version: "4.1", status: "active", effective_date: "2025-09-01", review_date: "2026-09-01", owner: "CSSD", mapped_sub_standards: ["SS-SIPC2-1"] },
];
