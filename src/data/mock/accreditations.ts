/** Mock accreditation list shape for GET /api/accreditations */
export const mockAccreditationsList = [
  { id: "ACC-CBAHI", name: "CBAHI Hospital Accreditation", code: "CBAHI", description: "Central Board for Accreditation of Healthcare Institutions — national accreditation standards for hospitals in Saudi Arabia.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [{ id: "CH-CBAHI-DA", code: "DA", name: "Document Authentication" }, { id: "CH-CBAHI-SIPC", code: "SIPC", name: "Surveillance, Infection Prevention & Control" }, { id: "CH-CBAHI-PS", code: "PS", name: "Patient Safety" }, { id: "CH-CBAHI-FM", code: "FM", name: "Facility Management" }, { id: "CH-CBAHI-MM", code: "MM", name: "Medication Management" }, { id: "CH-CBAHI-LD", code: "LD", name: "Leadership" }], project_count: 2, active_projects: 2, overall_progress: 72 },
  { id: "ACC-CBAHI-CLINIC", name: "CBAHI Clinic Accreditation", code: "CBAHI-CLINIC", description: "Central Board for Accreditation of Healthcare Institutions — Sibahi standards for primary healthcare clinics.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [{ id: "CH-CLINIC-DA", code: "DA", name: "Document Authentication" }, { id: "CH-CLINIC-PS", code: "PS", name: "Patient Safety" }], project_count: 0, active_projects: 0, overall_progress: 0 },
  { id: "ACC-JCI", name: "JCI Hospital Accreditation", code: "JCI", description: "Joint Commission International — global gold-standard accreditation for healthcare organizations.", version: "7th Edition", status: "active", created_at: "2026-01-01T00:00:00.000Z", chapters: [{ id: "CH-JCI-IPSG", code: "IPSG", name: "International Patient Safety Goals" }, { id: "CH-JCI-PCI", code: "PCI", name: "Prevention and Control of Infections" }], project_count: 1, active_projects: 1, overall_progress: 45 },
];

/** Full accreditation by id (nested chapters -> standards -> sub_standards -> activities + measurable_elements) */
const measurableElement = (id: string, code: string, text: string, criticality: string, requiredEvidenceType: string[], keywords: string[], departments: string[], scoringRule: string) =>
  ({ id, code, text, criticality, required_evidence_type: requiredEvidenceType, keywords, departments, scoring_rule: scoringRule });
const activity = (id: string, subStandardId: string, meId: string | null, type: string, label: string, description: string, fieldType: string, options: unknown[], required: boolean, sortOrder: number) =>
  ({ id, sub_standard_id: subStandardId, me_id: meId, type, label, description, field_type: fieldType, options, required, sort_order: sortOrder });

const subStandard = (id: string, standardId: string, code: string, name: string, sortOrder: number, measurableElements: ReturnType<typeof measurableElement>[], activities: ReturnType<typeof activity>[]) =>
  ({ id, standard_id: standardId, code, name, sort_order: sortOrder, measurable_elements: measurableElements, activities });

const standard = (id: string, chapterId: string, code: string, standardName: string, description: string, criticality: string, sortOrder: number, subStandards: ReturnType<typeof subStandard>[]) =>
  ({ id, chapter_id: chapterId, code, standard_name: standardName, description, criticality, sort_order: sortOrder, sub_standards: subStandards });

const chapter = (id: string, accreditationId: string, code: string, name: string, description: string, sortOrder: number, standards: ReturnType<typeof standard>[], score?: number) =>
  ({ id, accreditation_id: accreditationId, code, name, description, sort_order: sortOrder, total_standards: standards.length, score, standards });

const ME = measurableElement;
const Act = activity;
const SS = subStandard;
const Std = standard;
const Ch = chapter;

/** CBAHI Hospital full tree (DA, SIPC, PS, FM, MM, LD chapters with standards and activities) */
const cbahiChapters = [
  Ch("CH-CBAHI-DA", "ACC-CBAHI", "DA", "Document Authentication", "Standards for document authentication and control.", 1, [
    Std("STD-DA1", "CH-CBAHI-DA", "DA1", "Document Control System", "The organization has a document control system.", "non-critical", 1, [
      SS("SS-DA1-1", "STD-DA1", "DA 1.1", "Master document list is maintained and current", 1, [ME("ME-DA1-1-01", "DA.1.1.1", "A master list of all controlled documents is available and kept up-to-date.", "non-critical", ["record"], ["master list", "document control"], ["Quality"], "Must show a current master document list.")], [Act("ACT-DA1-1-C1", "SS-DA1-1", "ME-DA1-1-01", "checklist", "Master document list exists", "Verify a master list is maintained.", "boolean", [], true, 1), Act("ACT-DA1-1-E1", "SS-DA1-1", "ME-DA1-1-01", "document_evidence", "Master Document List", "Upload the current master document list.", "file", [], true, 2)]),
      SS("SS-DA1-2", "STD-DA1", "DA 1.2", "Documents are version-controlled", 2, [ME("ME-DA1-2-01", "DA.1.2.1", "All documents display a version number, effective date, and review date.", "non-critical", ["record", "policy"], ["version", "effective date"], ["Quality"], "Sample documents must show version control.")], [Act("ACT-DA1-2-C1", "SS-DA1-2", "ME-DA1-2-01", "checklist", "Documents show version numbers", "Verify sampled documents display version numbers.", "boolean", [], true, 1)]),
    ]),
    Std("STD-DA2", "CH-CBAHI-DA", "DA2", "Policy Approval and Review", "All policies undergo a formal approval and periodic review process.", "non-critical", 2, [
      SS("SS-DA2-1", "STD-DA2", "DA 2.1", "Policy approval workflow exists", 1, [], [Act("ACT-DA2-1-C1", "SS-DA2-1", null, "checklist", "Policy approval workflow", "Confirm policy approval workflow exists.", "boolean", [], true, 1)]),
    ]),
  ], 85),
  Ch("CH-CBAHI-SIPC", "ACC-CBAHI", "SIPC", "Surveillance, Infection Prevention & Control", "Standards for infection prevention and control programs.", 4, [
    Std("STD-SIPC1", "CH-CBAHI-SIPC", "SIPC1", "Infection Control Program", "The organization has an effective infection prevention and control program.", "critical", 1, [
      SS("SS-SIPC1-1", "STD-SIPC1", "SIPC 1.1", "Hand Hygiene Compliance", 1, [ME("ME-SIPC1-1-01", "SIPC.1.1.1", "The organization has an approved hand hygiene policy consistent with WHO guidelines.", "critical", ["policy"], ["hand hygiene", "WHO"], ["Infection Control"], "Policy must reference WHO Five Moments."), ME("ME-SIPC1-1-02", "SIPC.1.1.2", "Hand hygiene compliance rates are monitored monthly and reported to the ICC.", "critical", ["audit", "record"], ["compliance rate", "audit"], ["Quality"], "At least 6 months of audit data.")], [Act("ACT-SIPC1-1-C1", "SS-SIPC1-1", "ME-SIPC1-1-01", "checklist", "Hand hygiene policy available", "Is an approved hand hygiene policy available?", "boolean", [], true, 1), Act("ACT-SIPC1-1-C2", "SS-SIPC1-1", "ME-SIPC1-1-01", "checklist", "WHO Five Moments referenced", "Does the policy reference WHO Five Moments?", "boolean", [], true, 2), Act("ACT-SIPC1-1-D1", "SS-SIPC1-1", "ME-SIPC1-1-02", "data_collection", "Current compliance rate (%)", "What is the current hand hygiene compliance rate?", "number", [], true, 3), Act("ACT-SIPC1-1-E1", "SS-SIPC1-1", "ME-SIPC1-1-01", "document_evidence", "Hand Hygiene Policy Document", "Upload the approved hand hygiene policy.", "file", [], true, 4)]),
    ]),
    Std("STD-SIPC2", "CH-CBAHI-SIPC", "SIPC2", "Sterilization and Disinfection", "Standards for sterilization and disinfection of medical equipment.", "critical", 2, [
      SS("SS-SIPC2-1", "STD-SIPC2", "SIPC 2.1", "Sterilization SOPs", 1, [ME("ME-SIPC2-1-01", "SIPC.2.1.1", "The organization has policies and procedures for cleaning, disinfection, and sterilization of medical devices.", "critical", ["policy", "procedure"], ["sterilization", "Spaulding", "CSSD"], ["CSSD"], "Must include Spaulding classification.")], [Act("ACT-SIPC2-1-C1", "SS-SIPC2-1", "ME-SIPC2-1-01", "checklist", "Spaulding classification used", "Does the CSSD use Spaulding classification?", "boolean", [], true, 1), Act("ACT-SIPC2-1-E1", "SS-SIPC2-1", "ME-SIPC2-1-01", "document_evidence", "CSSD Standard Operating Procedures", "Upload CSSD sterilization SOPs.", "file", [], true, 2)]),
      SS("SS-SIPC2-2", "STD-SIPC2", "SIPC 2.2", "Biological Indicator Monitoring", 2, [ME("ME-SIPC2-2-01", "SIPC.2.2.1", "Biological indicators are used to monitor sterilization processes and results are documented.", "critical", ["record", "procedure"], ["biological indicator", "spore test"], ["CSSD"], "Daily BI testing logs required.")], [Act("ACT-SIPC2-2-C1", "SS-SIPC2-2", "ME-SIPC2-2-01", "checklist", "BI testing program exists", "Is there a biological indicator testing program for sterilizers?", "boolean", [], true, 1)]),
    ]),
  ], 62),
  Ch("CH-CBAHI-PS", "ACC-CBAHI", "PS", "Patient Safety", "Standards for patient safety goals and practices.", 5, [
    Std("STD-PS1", "CH-CBAHI-PS", "PS1", "Patient Identification", "Standards for correct patient identification.", "critical", 1, [
      SS("SS-PS1-1", "STD-PS1", "PS 1.1", "Two-identifier policy", 1, [ME("ME-PS1-1-01", "PS.1.1.1", "The organization has a patient identification policy that requires at least two patient identifiers before any intervention.", "critical", ["policy"], ["patient identification", "two identifiers"], ["Nursing"], "Policy must specify two identifiers.")], [Act("ACT-PS1-1-C1", "SS-PS1-1", "ME-PS1-1-01", "checklist", "Two-identifier policy in place", "Does the patient identification policy require two identifiers?", "boolean", [], true, 1), Act("ACT-PS1-1-E1", "SS-PS1-1", "ME-PS1-1-01", "document_evidence", "Patient Identification Policy", "Upload the patient identification policy.", "file", [], true, 2)]),
    ]),
    Std("STD-PS2", "CH-CBAHI-PS", "PS2", "Fire & Safety", "Fire safety and emergency preparedness.", "critical", 2, [
      SS("SS-PS2-1", "STD-PS2", "PS 2.1", "Fire safety plan and drills", 1, [ME("ME-PS2-1-01", "PS.2.1.1", "The organization has a comprehensive fire safety plan including evacuation, fire drills, and equipment maintenance.", "critical", ["policy", "record"], ["fire safety", "RACE", "PASS"], ["Safety"], "Must include RACE and PASS protocols.")], [Act("ACT-PS2-1-C1", "SS-PS2-1", "ME-PS2-1-01", "checklist", "Fire safety plan exists", "Does the organization have a comprehensive fire safety plan?", "boolean", [], true, 1), Act("ACT-PS2-1-E1", "SS-PS2-1", "ME-PS2-1-01", "document_evidence", "Fire Safety Plan", "Upload the fire safety plan document.", "file", [], true, 2)]),
    ]),
  ], 78),
  Ch("CH-CBAHI-FM", "ACC-CBAHI", "FM", "Facility Management", "Standards for facility management and safety.", 3, [
    Std("STD-FM1", "CH-CBAHI-FM", "FM1", "Safety Management Plan", "The organization has a comprehensive safety management plan.", "critical", 1, [SS("SS-FM1-1", "STD-FM1", "FM 1.1", "Risk assessment program", 1, [ME("ME-FM1-1-01", "FM.1.1.1", "A facility-wide risk assessment is conducted annually.", "critical", ["record", "audit"], ["risk assessment", "hazard identification"], ["Safety"], "Annual risk assessment report must be documented.")], [Act("ACT-FM1-1-C1", "SS-FM1-1", "ME-FM1-1-01", "checklist", "Annual risk assessment conducted", "Has a facility-wide risk assessment been conducted this year?", "boolean", [], true, 1)])]),
  ], 70),
  Ch("CH-CBAHI-MM", "ACC-CBAHI", "MM", "Medication Management", "Standards for safe medication management practices.", 7, [
    Std("STD-MM1", "CH-CBAHI-MM", "MM1", "Medication Safety", "Safe medication management practices.", "critical", 1, [SS("SS-MM1-1", "STD-MM1", "MM 1.1", "High-alert medications policy", 1, [ME("ME-MM1-1-01", "MM.1.1.1", "The organization has a high-alert medications policy identifying medications that require additional safeguards.", "critical", ["policy"], ["high-alert", "ISMP", "LASA"], ["Pharmacy"], "Must align with ISMP list.")], [Act("ACT-MM1-1-C1", "SS-MM1-1", "ME-MM1-1-01", "checklist", "High-alert medications list maintained", "Does the organization maintain a high-alert medications list per ISMP?", "boolean", [], true, 1)])]),
  ], 90),
  Ch("CH-CBAHI-LD", "ACC-CBAHI", "LD", "Leadership", "Standards for organizational leadership and governance.", 8, [
    Std("STD-LD1", "CH-CBAHI-LD", "LD1", "Governance Structure", "Organizational governance and leadership.", "non-critical", 1, [SS("SS-LD1-1", "STD-LD1", "LD 1.1", "Organizational structure documented", 1, [ME("ME-LD1-1-01", "LD.1.1.1", "The organizational structure is documented with clear lines of authority and accountability.", "non-critical", ["record"], ["org chart", "governance"], ["Administration"], "Current org chart with defined reporting lines.")], [Act("ACT-LD1-1-C1", "SS-LD1-1", "ME-LD1-1-01", "checklist", "Org structure documented", "Is the organizational structure documented?", "boolean", [], true, 1)])]),
  ], 80),
];

const fullAccreditationById: Record<string, { id: string; name: string; code: string; description: string; version: string; status: string; created_at: string; project_count: number; overall_progress: number; chapters: ReturnType<typeof chapter>[] }> = {
  "ACC-CBAHI": { id: "ACC-CBAHI", name: "CBAHI Hospital Accreditation", code: "CBAHI", description: "Central Board for Accreditation of Healthcare Institutions — national accreditation standards for hospitals in Saudi Arabia.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", project_count: 2, overall_progress: 72, chapters: cbahiChapters },
  "ACC-CBAHI-CLINIC": { id: "ACC-CBAHI-CLINIC", name: "CBAHI Clinic Accreditation", code: "CBAHI-CLINIC", description: "Central Board for Accreditation of Healthcare Institutions — Sibahi standards for primary healthcare clinics.", version: "2026 v1.0", status: "active", created_at: "2026-01-01T00:00:00.000Z", project_count: 0, overall_progress: 0, chapters: [Ch("CH-CLINIC-DA", "ACC-CBAHI-CLINIC", "DA", "Document Authentication", "Standards for document authentication.", 1, [], undefined), Ch("CH-CLINIC-PS", "ACC-CBAHI-CLINIC", "PS", "Patient Safety", "Patient safety goals.", 5, [], undefined)] },
  "ACC-JCI": { id: "ACC-JCI", name: "JCI Hospital Accreditation", code: "JCI", description: "Joint Commission International — global gold-standard accreditation for healthcare organizations.", version: "7th Edition", status: "active", created_at: "2026-01-01T00:00:00.000Z", project_count: 1, overall_progress: 45, chapters: [Ch("CH-JCI-IPSG", "ACC-JCI", "IPSG", "International Patient Safety Goals", "JCI patient safety goals.", 1, [], undefined), Ch("CH-JCI-PCI", "ACC-JCI", "PCI", "Prevention and Control of Infections", "Infection prevention and control.", 6, [], undefined)] },
};

export function getAccreditationById(id: string) {
  return fullAccreditationById[id] ?? null;
}

/** Chapters for GET /api/accreditations/[id]/chapters (flat list with standards summary, optional score) */
export function getChaptersByAccreditationId(accreditationId: string) {
  const acc = fullAccreditationById[accreditationId];
  if (!acc) return [];
  return acc.chapters.map(ch => ({
    id: ch.id,
    accreditation_id: ch.accreditation_id,
    code: ch.code,
    name: ch.name,
    description: ch.description,
    sort_order: ch.sort_order,
    total_standards: ch.standards.length,
    standards: ch.standards.map(s => ({ id: s.id, code: s.code, standard_name: s.standard_name })),
    score: ch.score,
  }));
}

/** Standards for GET /api/chapters/[id]/standards (with sub_standards summary: total_activities, total_mes) */
export function getStandardsByChapterId(chapterId: string) {
  for (const acc of Object.values(fullAccreditationById)) {
    const ch = acc.chapters.find(c => c.id === chapterId);
    if (ch) {
      return ch.standards.map(std => ({
        id: std.id,
        chapter_id: std.chapter_id,
        code: std.code,
        standard_name: std.standard_name,
        description: std.description,
        criticality: std.criticality,
        sort_order: std.sort_order,
        sub_standards: std.sub_standards.map(ss => ({
          id: ss.id,
          standard_id: ss.standard_id,
          code: ss.code,
          name: ss.name,
          sort_order: ss.sort_order,
          total_activities: ss.activities.length,
          total_mes: ss.measurable_elements.length,
        })),
      }));
    }
  }
  return [];
}

/** Activity responses for PRJ-001 (mock) */
const mockResponsesByActivity: Record<string, { value: string; status: string }> = {
  "ACT-SIPC1-1-C1": { value: "true", status: "completed" },
  "ACT-SIPC1-1-C2": { value: "true", status: "completed" },
  "ACT-SIPC1-1-D1": { value: "82", status: "completed" },
  "ACT-PS1-1-C1": { value: "true", status: "completed" },
  "ACT-SIPC2-2-C1": { value: "false", status: "completed" },
  "ACT-MM1-1-C1": { value: "true", status: "completed" },
};

/** Sub-standard + activities for GET /api/sub-standards/[id]/activities (optional projectId for response) */
export function getActivitiesBySubStandardId(subStandardId: string, projectId?: string) {
  for (const acc of Object.values(fullAccreditationById)) {
    for (const ch of acc.chapters) {
      for (const std of ch.standards) {
        const ss = std.sub_standards.find(s => s.id === subStandardId);
        if (ss) {
          const activities = ss.activities.map(act => {
            const resp = projectId && mockResponsesByActivity[act.id];
            return {
              id: act.id,
              sub_standard_id: act.sub_standard_id,
              me_id: act.me_id,
              type: act.type,
              label: act.label,
              description: act.description,
              field_type: act.field_type,
              options: act.options,
              required: act.required,
              sort_order: act.sort_order,
              response: resp ? { id: `resp-${act.id}`, activity_id: act.id, project_id: projectId, value: resp.value, status: resp.status, notes: "", files: [], updated_at: "2026-02-12T00:00:00.000Z" } : undefined,
            };
          });
          const total = activities.length;
          const completed = activities.filter(a => a.response?.status === "completed").length;
          return {
            sub_standard: { id: ss.id, code: ss.code, name: ss.name, sort_order: ss.sort_order, measurable_elements: ss.measurable_elements.map(me => ({ id: me.id, code: me.code, text: me.text, criticality: me.criticality })) },
            activities,
            completion: { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 },
          };
        }
      }
    }
  }
  return null;
}
