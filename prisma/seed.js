const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // Clean in reverse-dependency order
  const deleteOps = [
    prisma.policyMapping.deleteMany(),
    prisma.policy.deleteMany(),
    prisma.copilotMessage.deleteMany(),
    prisma.copilotConversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.checklistItem.deleteMany(),
    prisma.checklistTemplate.deleteMany(),
    prisma.masterDocMapping.deleteMany(),
    prisma.documentComparison.deleteMany(),
    prisma.masterDocument.deleteMany(),
    prisma.correctiveAction.deleteMany(),
    prisma.evidenceMatch.deleteMany(),
    prisma.complianceScore.deleteMany(),
    prisma.assessment.deleteMany(),
    prisma.projectEvidence.deleteMany(),
    prisma.evidence.deleteMany(),
    prisma.activityResponse.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.chapterScore.deleteMany(),
    prisma.surveyProject.deleteMany(),
    prisma.measurableElement.deleteMany(),
    prisma.subStandard.deleteMany(),
    prisma.standard.deleteMany(),
    prisma.chapter.deleteMany(),
    prisma.accreditation.deleteMany(),
    prisma.facility.deleteMany(),
    prisma.user.deleteMany(),
  ];
  for (const op of deleteOps) await op;

  // ============================================
  // USERS
  // ============================================
  await Promise.all([
    prisma.user.create({ data: { id: "USR-001", name: "Dr. Varun Mehta", email: "varun.mehta@kfmc.sa", role: "quality_director", avatar: "/avatars/varun.jpg" } }),
    prisma.user.create({ data: { id: "USR-002", name: "Pradeep Kumar", email: "pradeep.kumar@kfmc.sa", role: "quality_officer" } }),
    prisma.user.create({ data: { id: "USR-003", name: "Utkarsh Singh", email: "utkarsh.singh@kfmc.sa", role: "quality_officer" } }),
    prisma.user.create({ data: { id: "USR-004", name: "Dr. Fatima Al-Rashid", email: "fatima.alrashid@kfmc.sa", role: "department_head" } }),
    prisma.user.create({ data: { id: "USR-ADMIN", name: "Admin", email: "admin@kfmc.sa", role: "admin" } }),
  ]);
  console.log("  Created 5 users");

  // ============================================
  // FACILITIES
  // ============================================
  await Promise.all([
    prisma.facility.create({ data: { id: "FAC-001", name: "King Fahad Medical City", location: "Riyadh", type: "hospital" } }),
    prisma.facility.create({ data: { id: "FAC-002", name: "National Guard Hospital", location: "Riyadh", type: "hospital" } }),
    prisma.facility.create({ data: { id: "FAC-003", name: "Al Noor Specialist Clinic", location: "Jeddah", type: "clinic" } }),
  ]);
  console.log("  Created 3 facilities");

  // ============================================
  // ACCREDITATIONS
  // ============================================
  const cbahi = await prisma.accreditation.create({
    data: {
      id: "ACC-CBAHI",
      name: "CBAHI Hospital Accreditation",
      code: "CBAHI",
      description: "Central Board for Accreditation of Healthcare Institutions — national accreditation standards for hospitals in Saudi Arabia.",
      version: "2026 v1.0",
      status: "active",
    },
  });

  const cbahiClinic = await prisma.accreditation.create({
    data: {
      id: "ACC-CBAHI-CLINIC",
      name: "CBAHI Clinic Accreditation",
      code: "CBAHI-CLINIC",
      description: "Central Board for Accreditation of Healthcare Institutions — Sibahi standards for primary healthcare clinics.",
      version: "2026 v1.0",
      status: "active",
    },
  });

  const jci = await prisma.accreditation.create({
    data: {
      id: "ACC-JCI",
      name: "JCI Hospital Accreditation",
      code: "JCI",
      description: "Joint Commission International — global gold-standard accreditation for healthcare organizations.",
      version: "7th Edition",
      status: "active",
    },
  });
  console.log("  Created 3 accreditations (CBAHI, CBAHI-CLINIC, JCI)");

  // ============================================
  // CHAPTERS — CBAHI Hospital
  // ============================================
  const cbahiChapters = await Promise.all([
    prisma.chapter.create({ data: { id: "CH-CBAHI-DA", accreditationId: "ACC-CBAHI", code: "DA", name: "Document Authentication", description: "Standards for document authentication and control across the organization.", sortOrder: 1 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-DN", accreditationId: "ACC-CBAHI", code: "DN", name: "Dental Care", description: "Standards for dental care services.", sortOrder: 2 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-FM", accreditationId: "ACC-CBAHI", code: "FM", name: "Facility Management", description: "Standards for facility management and safety.", sortOrder: 3 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-SIPC", accreditationId: "ACC-CBAHI", code: "SIPC", name: "Surveillance, Infection Prevention & Control", description: "Standards for infection prevention and control programs.", sortOrder: 4 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-PS", accreditationId: "ACC-CBAHI", code: "PS", name: "Patient Safety", description: "Standards for patient safety goals and practices.", sortOrder: 5 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-PC", accreditationId: "ACC-CBAHI", code: "PC", name: "Patient Care", description: "Standards for providing patient care services.", sortOrder: 6 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-MM", accreditationId: "ACC-CBAHI", code: "MM", name: "Medication Management", description: "Standards for safe medication management practices.", sortOrder: 7 } }),
    prisma.chapter.create({ data: { id: "CH-CBAHI-LD", accreditationId: "ACC-CBAHI", code: "LD", name: "Leadership", description: "Standards for organizational leadership and governance.", sortOrder: 8 } }),
  ]);
  console.log("  Created 8 CBAHI Hospital chapters");

  // CHAPTERS — CBAHI Clinic (Sibahi)
  await Promise.all([
    prisma.chapter.create({ data: { id: "CH-CLINIC-DA", accreditationId: "ACC-CBAHI-CLINIC", code: "DA", name: "Document Authentication", description: "Standards for document authentication and control.", sortOrder: 1 } }),
    prisma.chapter.create({ data: { id: "CH-CLINIC-DN", accreditationId: "ACC-CBAHI-CLINIC", code: "DN", name: "Dental Care", description: "Standards for dental care.", sortOrder: 2 } }),
    prisma.chapter.create({ data: { id: "CH-CLINIC-FM", accreditationId: "ACC-CBAHI-CLINIC", code: "FM", name: "Facility Management", description: "Facility management and safety.", sortOrder: 3 } }),
    prisma.chapter.create({ data: { id: "CH-CLINIC-SIPC", accreditationId: "ACC-CBAHI-CLINIC", code: "SIPC", name: "Surveillance, Infection Prevention & Control", description: "Infection prevention and control.", sortOrder: 4 } }),
    prisma.chapter.create({ data: { id: "CH-CLINIC-PS", accreditationId: "ACC-CBAHI-CLINIC", code: "PS", name: "Patient Safety", description: "Patient safety goals.", sortOrder: 5 } }),
  ]);
  console.log("  Created 5 CBAHI Clinic chapters");

  // CHAPTERS — JCI
  await Promise.all([
    prisma.chapter.create({ data: { id: "CH-JCI-IPSG", accreditationId: "ACC-JCI", code: "IPSG", name: "International Patient Safety Goals", description: "JCI patient safety goals.", sortOrder: 1 } }),
    prisma.chapter.create({ data: { id: "CH-JCI-ACC", accreditationId: "ACC-JCI", code: "ACC", name: "Access to Care and Continuity of Care", description: "Standards for access and continuity.", sortOrder: 2 } }),
    prisma.chapter.create({ data: { id: "CH-JCI-PCC", accreditationId: "ACC-JCI", code: "PCC", name: "Patient-Centered Care", description: "Patient-centered care standards.", sortOrder: 3 } }),
    prisma.chapter.create({ data: { id: "CH-JCI-ASC", accreditationId: "ACC-JCI", code: "ASC", name: "Anesthesia and Surgical Care", description: "Anesthesia and surgical care standards.", sortOrder: 4 } }),
    prisma.chapter.create({ data: { id: "CH-JCI-MMU", accreditationId: "ACC-JCI", code: "MMU", name: "Medication Management and Use", description: "Medication management standards.", sortOrder: 5 } }),
    prisma.chapter.create({ data: { id: "CH-JCI-PCI", accreditationId: "ACC-JCI", code: "PCI", name: "Prevention and Control of Infections", description: "Infection prevention and control.", sortOrder: 6 } }),
  ]);
  console.log("  Created 6 JCI chapters");

  // ============================================
  // STANDARDS — CBAHI DA Chapter
  // ============================================
  await prisma.standard.create({ data: { id: "STD-DA1", chapterId: "CH-CBAHI-DA", code: "DA1", standardName: "Document Control System", description: "The organization has a document control system that ensures all policies, procedures, and guidelines are current and accessible.", criticality: "non-critical", sortOrder: 1 } });
  await prisma.standard.create({ data: { id: "STD-DA2", chapterId: "CH-CBAHI-DA", code: "DA2", standardName: "Policy Approval and Review", description: "All policies and procedures undergo a formal approval and periodic review process.", criticality: "non-critical", sortOrder: 2 } });
  await prisma.standard.create({ data: { id: "STD-DA3", chapterId: "CH-CBAHI-DA", code: "DA3", standardName: "Record Retention", description: "The organization has policies for retention, storage and disposal of records.", criticality: "non-critical", sortOrder: 3 } });

  // STANDARDS — CBAHI SIPC Chapter
  await prisma.standard.create({ data: { id: "STD-SIPC1", chapterId: "CH-CBAHI-SIPC", code: "SIPC1", standardName: "Infection Control Program", description: "The organization has an effective infection prevention and control program coordinated across all departments.", criticality: "critical", sortOrder: 1 } });
  await prisma.standard.create({ data: { id: "STD-SIPC2", chapterId: "CH-CBAHI-SIPC", code: "SIPC2", standardName: "Sterilization and Disinfection", description: "Standards for sterilization and disinfection of medical equipment.", criticality: "critical", sortOrder: 2 } });
  await prisma.standard.create({ data: { id: "STD-SIPC3", chapterId: "CH-CBAHI-SIPC", code: "SIPC3", standardName: "HAI Surveillance", description: "Surveillance of healthcare-associated infections.", criticality: "critical", sortOrder: 3 } });

  // STANDARDS — CBAHI PS Chapter
  await prisma.standard.create({ data: { id: "STD-PS1", chapterId: "CH-CBAHI-PS", code: "PS1", standardName: "Patient Identification", description: "Standards for correct patient identification.", criticality: "critical", sortOrder: 1 } });
  await prisma.standard.create({ data: { id: "STD-PS2", chapterId: "CH-CBAHI-PS", code: "PS2", standardName: "Fire & Safety", description: "Fire safety and emergency preparedness.", criticality: "critical", sortOrder: 2 } });

  // STANDARDS — CBAHI FM Chapter
  await prisma.standard.create({ data: { id: "STD-FM1", chapterId: "CH-CBAHI-FM", code: "FM1", standardName: "Safety Management Plan", description: "The organization has a comprehensive safety management plan.", criticality: "critical", sortOrder: 1 } });
  await prisma.standard.create({ data: { id: "STD-FM2", chapterId: "CH-CBAHI-FM", code: "FM2", standardName: "Medical Equipment Management", description: "Management of medical equipment lifecycle.", criticality: "non-critical", sortOrder: 2 } });

  // STANDARDS — CBAHI MM Chapter
  await prisma.standard.create({ data: { id: "STD-MM1", chapterId: "CH-CBAHI-MM", code: "MM1", standardName: "Medication Safety", description: "Safe medication management practices.", criticality: "critical", sortOrder: 1 } });

  // STANDARDS — CBAHI LD Chapter
  await prisma.standard.create({ data: { id: "STD-LD1", chapterId: "CH-CBAHI-LD", code: "LD1", standardName: "Governance Structure", description: "Organizational governance and leadership.", criticality: "non-critical", sortOrder: 1 } });

  console.log("  Created 12 standards across CBAHI chapters");

  // ============================================
  // SUB-STANDARDS
  // ============================================
  // DA Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-DA1-1", standardId: "STD-DA1", code: "DA 1.1", name: "Master document list is maintained and current", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-DA1-2", standardId: "STD-DA1", code: "DA 1.2", name: "Documents are version-controlled", sortOrder: 2 } });
  await prisma.subStandard.create({ data: { id: "SS-DA1-3", standardId: "STD-DA1", code: "DA 1.3", name: "Staff have access to current documents", sortOrder: 3 } });
  await prisma.subStandard.create({ data: { id: "SS-DA2-1", standardId: "STD-DA2", code: "DA 2.1", name: "Policy approval workflow exists", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-DA2-2", standardId: "STD-DA2", code: "DA 2.2", name: "Policies are reviewed at least every 3 years", sortOrder: 2 } });
  await prisma.subStandard.create({ data: { id: "SS-DA3-1", standardId: "STD-DA3", code: "DA 3.1", name: "Record retention policy exists", sortOrder: 1 } });

  // SIPC Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-SIPC1-1", standardId: "STD-SIPC1", code: "SIPC 1.1", name: "Hand Hygiene Compliance", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC1-2", standardId: "STD-SIPC1", code: "SIPC 1.2", name: "Infection Control Committee", sortOrder: 2 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC1-3", standardId: "STD-SIPC1", code: "SIPC 1.3", name: "IPC Training for Staff", sortOrder: 3 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC2-1", standardId: "STD-SIPC2", code: "SIPC 2.1", name: "Sterilization SOPs", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC2-2", standardId: "STD-SIPC2", code: "SIPC 2.2", name: "Biological Indicator Monitoring", sortOrder: 2 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC3-1", standardId: "STD-SIPC3", code: "SIPC 3.1", name: "HAI Surveillance Program", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-SIPC3-2", standardId: "STD-SIPC3", code: "SIPC 3.2", name: "Benchmarking Infection Rates", sortOrder: 2 } });

  // PS Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-PS1-1", standardId: "STD-PS1", code: "PS 1.1", name: "Two-identifier policy", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-PS2-1", standardId: "STD-PS2", code: "PS 2.1", name: "Fire safety plan and drills", sortOrder: 1 } });

  // FM Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-FM1-1", standardId: "STD-FM1", code: "FM 1.1", name: "Risk assessment program", sortOrder: 1 } });
  await prisma.subStandard.create({ data: { id: "SS-FM2-1", standardId: "STD-FM2", code: "FM 2.1", name: "Medical equipment inventory", sortOrder: 1 } });

  // MM Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-MM1-1", standardId: "STD-MM1", code: "MM 1.1", name: "High-alert medications policy", sortOrder: 1 } });

  // LD Sub-standards
  await prisma.subStandard.create({ data: { id: "SS-LD1-1", standardId: "STD-LD1", code: "LD 1.1", name: "Organizational structure documented", sortOrder: 1 } });

  console.log("  Created 19 sub-standards");

  // ============================================
  // MEASURABLE ELEMENTS
  // ============================================
  const mesData = [
    { id: "ME-DA1-1-01", subStandardId: "SS-DA1-1", code: "DA.1.1.1", text: "A master list of all controlled documents is available and kept up-to-date.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["master list", "document control", "index"]), departments: JSON.stringify(["Quality"]), scoringRule: "Must show a current master document list with review dates." },
    { id: "ME-DA1-1-02", subStandardId: "SS-DA1-1", code: "DA.1.1.2", text: "Obsolete documents are removed from points of use.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["procedure"]), keywords: JSON.stringify(["obsolete", "withdrawal", "archive"]), departments: JSON.stringify(["Quality"]), scoringRule: "Procedure for obsolete document removal must be in place." },
    { id: "ME-DA1-2-01", subStandardId: "SS-DA1-2", code: "DA.1.2.1", text: "All documents display a version number, effective date, and review date.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record", "policy"]), keywords: JSON.stringify(["version", "effective date", "revision history"]), departments: JSON.stringify(["Quality"]), scoringRule: "Sample documents must show version control elements." },
    { id: "ME-SIPC1-1-01", subStandardId: "SS-SIPC1-1", code: "SIPC.1.1.1", text: "The organization has an approved hand hygiene policy that is consistent with WHO guidelines and is reviewed annually.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["hand hygiene", "WHO", "five moments", "ABHR"]), departments: JSON.stringify(["Infection Control", "All Clinical"]), scoringRule: "Policy must reference WHO Five Moments and include ABHR protocol." },
    { id: "ME-SIPC1-1-02", subStandardId: "SS-SIPC1-1", code: "SIPC.1.1.2", text: "Hand hygiene compliance rates are monitored monthly and reported to the Infection Control Committee.", criticality: "critical", requiredEvidenceType: JSON.stringify(["audit", "record"]), keywords: JSON.stringify(["compliance rate", "audit", "monitoring", "ICC"]), departments: JSON.stringify(["Quality", "Infection Control"]), scoringRule: "At least 6 months of audit data with >85% compliance." },
    { id: "ME-SIPC1-2-01", subStandardId: "SS-SIPC1-2", code: "SIPC.1.2.1", text: "The Infection Control Committee meets regularly and reviews surveillance data.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["ICC", "committee", "meeting minutes"]), departments: JSON.stringify(["Infection Control"]), scoringRule: "Meeting minutes for the past 12 months must be available." },
    { id: "ME-SIPC1-3-01", subStandardId: "SS-SIPC1-3", code: "SIPC.1.3.1", text: "Hand hygiene training is provided to all new staff during orientation and annually thereafter.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["training", "record"]), keywords: JSON.stringify(["training", "orientation", "competency"]), departments: JSON.stringify(["Education", "HR"]), scoringRule: "Training completion rate >90% for new hires." },
    { id: "ME-SIPC2-1-01", subStandardId: "SS-SIPC2-1", code: "SIPC.2.1.1", text: "The organization has policies and procedures for cleaning, disinfection, and sterilization of medical devices.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy", "procedure"]), keywords: JSON.stringify(["sterilization", "disinfection", "Spaulding", "CSSD"]), departments: JSON.stringify(["CSSD", "Infection Control"]), scoringRule: "Must include Spaulding classification and approved disinfectant list." },
    { id: "ME-SIPC2-2-01", subStandardId: "SS-SIPC2-2", code: "SIPC.2.2.1", text: "Biological indicators are used to monitor sterilization processes and results are documented.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record", "procedure"]), keywords: JSON.stringify(["biological indicator", "spore test", "BI monitoring"]), departments: JSON.stringify(["CSSD"]), scoringRule: "Daily BI testing logs required." },
    { id: "ME-SIPC3-1-01", subStandardId: "SS-SIPC3-1", code: "SIPC.3.1.1", text: "The organization conducts surveillance of healthcare-associated infections using standardized definitions.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record", "audit"]), keywords: JSON.stringify(["HAI", "surveillance", "CLABSI", "CAUTI", "SSI"]), departments: JSON.stringify(["Infection Control"]), scoringRule: "All major HAI types must be under surveillance with NHSN definitions." },
    { id: "ME-SIPC3-2-01", subStandardId: "SS-SIPC3-2", code: "SIPC.3.2.1", text: "Infection rates are benchmarked against national and international standards.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["benchmark", "NHSN", "national rate"]), departments: JSON.stringify(["Infection Control", "Quality"]), scoringRule: "Quarterly benchmarking reports with NHSN comparison." },
    { id: "ME-PS1-1-01", subStandardId: "SS-PS1-1", code: "PS.1.1.1", text: "The organization has a patient identification policy that requires at least two patient identifiers before any intervention.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["patient identification", "two identifiers", "wristband"]), departments: JSON.stringify(["Nursing", "All Clinical"]), scoringRule: "Policy must specify two identifiers and wristband verification." },
    { id: "ME-PS2-1-01", subStandardId: "SS-PS2-1", code: "PS.2.1.1", text: "The organization has a comprehensive fire safety plan including evacuation, fire drills, and equipment maintenance.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy", "record"]), keywords: JSON.stringify(["fire safety", "evacuation", "RACE", "PASS", "fire drill"]), departments: JSON.stringify(["Safety"]), scoringRule: "Must include RACE and PASS protocols; fire drill records required." },
    { id: "ME-FM1-1-01", subStandardId: "SS-FM1-1", code: "FM.1.1.1", text: "A facility-wide risk assessment is conducted annually to identify potential hazards.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record", "audit"]), keywords: JSON.stringify(["risk assessment", "hazard identification", "annual review"]), departments: JSON.stringify(["Safety", "Quality"]), scoringRule: "Annual risk assessment report must be documented." },
    { id: "ME-FM2-1-01", subStandardId: "SS-FM2-1", code: "FM.2.1.1", text: "A complete inventory of medical equipment is maintained with maintenance schedules.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["equipment inventory", "maintenance schedule", "biomedical"]), departments: JSON.stringify(["Biomedical Engineering"]), scoringRule: "Inventory and preventive maintenance schedule must be current." },
    { id: "ME-MM1-1-01", subStandardId: "SS-MM1-1", code: "MM.1.1.1", text: "The organization has a high-alert medications policy identifying medications that require additional safeguards.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["high-alert", "ISMP", "LASA", "double check"]), departments: JSON.stringify(["Pharmacy"]), scoringRule: "Must align with ISMP list; double-check procedures documented." },
    { id: "ME-LD1-1-01", subStandardId: "SS-LD1-1", code: "LD.1.1.1", text: "The organizational structure is documented with clear lines of authority and accountability.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["org chart", "governance", "authority"]), departments: JSON.stringify(["Administration"]), scoringRule: "Current org chart with defined reporting lines." },
  ];

  for (const me of mesData) {
    await prisma.measurableElement.create({ data: me });
  }
  console.log(`  Created ${mesData.length} measurable elements`);

  // ============================================
  // ACTIVITIES under Sub-Standards
  // ============================================
  const activitiesData = [
    // DA 1.1 activities
    { id: "ACT-DA1-1-C1", subStandardId: "SS-DA1-1", meId: "ME-DA1-1-01", type: "checklist", label: "Master document list exists", description: "Verify a master list of all controlled documents is maintained.", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-DA1-1-C2", subStandardId: "SS-DA1-1", meId: "ME-DA1-1-02", type: "checklist", label: "Obsolete documents removed from use", description: "Confirm obsolete documents are withdrawn from points of use.", fieldType: "boolean", sortOrder: 2 },
    { id: "ACT-DA1-1-D1", subStandardId: "SS-DA1-1", meId: "ME-DA1-1-01", type: "data_collection", label: "Total controlled documents", description: "Enter the total number of controlled documents in the master list.", fieldType: "number", sortOrder: 3 },
    { id: "ACT-DA1-1-D2", subStandardId: "SS-DA1-1", meId: "ME-DA1-1-01", type: "data_collection", label: "Last master list update date", description: "When was the master document list last updated?", fieldType: "date", sortOrder: 4 },
    { id: "ACT-DA1-1-E1", subStandardId: "SS-DA1-1", meId: "ME-DA1-1-01", type: "document_evidence", label: "Master Document List", description: "Upload the current master document list.", fieldType: "file", sortOrder: 5 },

    // DA 1.2 activities
    { id: "ACT-DA1-2-C1", subStandardId: "SS-DA1-2", meId: "ME-DA1-2-01", type: "checklist", label: "Documents show version numbers", description: "Verify sampled documents display version numbers.", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-DA1-2-E1", subStandardId: "SS-DA1-2", meId: "ME-DA1-2-01", type: "document_evidence", label: "Sample Version-Controlled Documents", description: "Upload sample documents showing version control.", fieldType: "file", sortOrder: 2 },

    // SIPC 1.1 activities
    { id: "ACT-SIPC1-1-C1", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-01", type: "checklist", label: "Hand hygiene policy available", description: "Is an approved hand hygiene policy consistent with WHO guidelines available?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-SIPC1-1-C2", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-01", type: "checklist", label: "WHO Five Moments referenced", description: "Does the policy reference the WHO Five Moments for Hand Hygiene?", fieldType: "boolean", sortOrder: 2 },
    { id: "ACT-SIPC1-1-D1", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-02", type: "data_collection", label: "Current compliance rate (%)", description: "What is the current overall hand hygiene compliance rate?", fieldType: "number", sortOrder: 3 },
    { id: "ACT-SIPC1-1-D2", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-01", type: "data_collection", label: "Policy last review date", description: "When was the hand hygiene policy last reviewed?", fieldType: "date", sortOrder: 4 },
    { id: "ACT-SIPC1-1-E1", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-01", type: "document_evidence", label: "Hand Hygiene Policy Document", description: "Upload the approved hand hygiene policy.", fieldType: "file", sortOrder: 5 },
    { id: "ACT-SIPC1-1-E2", subStandardId: "SS-SIPC1-1", meId: "ME-SIPC1-1-02", type: "document_evidence", label: "Monthly Audit Reports (6 months)", description: "Upload monthly hand hygiene audit reports for the past 6 months.", fieldType: "file", sortOrder: 6 },

    // SIPC 2.1 activities
    { id: "ACT-SIPC2-1-C1", subStandardId: "SS-SIPC2-1", meId: "ME-SIPC2-1-01", type: "checklist", label: "Spaulding classification used", description: "Does the CSSD use Spaulding classification for device categorization?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-SIPC2-1-E1", subStandardId: "SS-SIPC2-1", meId: "ME-SIPC2-1-01", type: "document_evidence", label: "CSSD Standard Operating Procedures", description: "Upload CSSD sterilization and disinfection SOPs.", fieldType: "file", sortOrder: 2 },

    // SIPC 2.2 activities
    { id: "ACT-SIPC2-2-C1", subStandardId: "SS-SIPC2-2", meId: "ME-SIPC2-2-01", type: "checklist", label: "BI testing program exists", description: "Is there a biological indicator testing program for sterilizers?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-SIPC2-2-E1", subStandardId: "SS-SIPC2-2", meId: "ME-SIPC2-2-01", type: "document_evidence", label: "Biological Indicator Testing Logs", description: "Upload biological indicator testing logs.", fieldType: "file", sortOrder: 2 },

    // PS 1.1 activities
    { id: "ACT-PS1-1-C1", subStandardId: "SS-PS1-1", meId: "ME-PS1-1-01", type: "checklist", label: "Two-identifier policy in place", description: "Does the patient identification policy require two identifiers?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-PS1-1-E1", subStandardId: "SS-PS1-1", meId: "ME-PS1-1-01", type: "document_evidence", label: "Patient Identification Policy", description: "Upload the patient identification policy.", fieldType: "file", sortOrder: 2 },

    // PS 2.1 activities
    { id: "ACT-PS2-1-C1", subStandardId: "SS-PS2-1", meId: "ME-PS2-1-01", type: "checklist", label: "Fire safety plan exists", description: "Does the organization have a comprehensive fire safety plan?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-PS2-1-C2", subStandardId: "SS-PS2-1", meId: "ME-PS2-1-01", type: "checklist", label: "RACE and PASS protocols documented", description: "Are RACE and PASS protocols included in the fire safety plan?", fieldType: "boolean", sortOrder: 2 },
    { id: "ACT-PS2-1-D1", subStandardId: "SS-PS2-1", meId: "ME-PS2-1-01", type: "data_collection", label: "Fire drills conducted this year", description: "How many fire drills have been conducted this calendar year?", fieldType: "number", sortOrder: 3 },
    { id: "ACT-PS2-1-E1", subStandardId: "SS-PS2-1", meId: "ME-PS2-1-01", type: "document_evidence", label: "Fire Safety Plan", description: "Upload the fire safety plan document.", fieldType: "file", sortOrder: 4 },

    // MM 1.1 activities
    { id: "ACT-MM1-1-C1", subStandardId: "SS-MM1-1", meId: "ME-MM1-1-01", type: "checklist", label: "High-alert medications list maintained", description: "Does the organization maintain a high-alert medications list per ISMP?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-MM1-1-E1", subStandardId: "SS-MM1-1", meId: "ME-MM1-1-01", type: "document_evidence", label: "High-Alert Medications Policy", description: "Upload the high-alert medications policy.", fieldType: "file", sortOrder: 2 },

    // FM 1.1 activities
    { id: "ACT-FM1-1-C1", subStandardId: "SS-FM1-1", meId: "ME-FM1-1-01", type: "checklist", label: "Annual risk assessment conducted", description: "Has a facility-wide risk assessment been conducted this year?", fieldType: "boolean", sortOrder: 1 },
    { id: "ACT-FM1-1-E1", subStandardId: "SS-FM1-1", meId: "ME-FM1-1-01", type: "document_evidence", label: "Risk Assessment Report", description: "Upload the annual risk assessment report.", fieldType: "file", sortOrder: 2 },
  ];

  for (const act of activitiesData) {
    await prisma.activity.create({ data: act });
  }
  console.log(`  Created ${activitiesData.length} activities`);

  // ============================================
  // SURVEY PROJECTS
  // ============================================
  await prisma.surveyProject.create({
    data: {
      id: "PRJ-001",
      name: "CBAHI 2026 Full Readiness Assessment",
      facilityId: "FAC-001",
      accreditationId: "ACC-CBAHI",
      standardVersion: "CBAHI 2026 v1.0",
      scope: "full",
      selectedChapters: JSON.stringify(["CH-CBAHI-DA", "CH-CBAHI-SIPC", "CH-CBAHI-PS", "CH-CBAHI-FM", "CH-CBAHI-MM", "CH-CBAHI-LD"]),
      departments: JSON.stringify(["All"]),
      status: "in-progress",
      createdById: "USR-001",
      deadline: "2026-04-30",
      teamMembers: JSON.stringify(["Dr. Varun Mehta", "Pradeep Kumar", "Utkarsh Singh", "Dr. Fatima Al-Rashid"]),
      overallScore: 72,
    },
  });

  await prisma.surveyProject.create({
    data: {
      id: "PRJ-002",
      name: "IPC Chapter Focused Review",
      facilityId: "FAC-001",
      accreditationId: "ACC-CBAHI",
      standardVersion: "CBAHI 2026 v1.0",
      scope: "partial",
      selectedChapters: JSON.stringify(["CH-CBAHI-SIPC"]),
      departments: JSON.stringify(["Infection Control", "CSSD", "ICU", "Surgery"]),
      status: "draft",
      createdById: "USR-002",
      deadline: "2026-03-15",
      teamMembers: JSON.stringify(["Pradeep Kumar", "Dr. Fatima Al-Rashid"]),
      overallScore: 0,
    },
  });

  await prisma.surveyProject.create({
    data: {
      id: "PRJ-003",
      name: "JCI Hospital Accreditation Prep",
      facilityId: "FAC-002",
      accreditationId: "ACC-JCI",
      standardVersion: "JCI 7th Edition",
      scope: "full",
      selectedChapters: JSON.stringify(["CH-JCI-IPSG", "CH-JCI-PCI", "CH-JCI-MMU"]),
      departments: JSON.stringify(["All"]),
      status: "in-progress",
      createdById: "USR-003",
      deadline: "2026-06-30",
      teamMembers: JSON.stringify(["Utkarsh Singh"]),
      overallScore: 45,
    },
  });
  console.log("  Created 3 survey projects");

  // ============================================
  // CHAPTER SCORES
  // ============================================
  const chapterScoresData = [
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-DA", chapterName: "Document Authentication", score: 85, totalMes: 3, compliant: 2, partial: 1, nonCompliant: 0, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-SIPC", chapterName: "Surveillance, IPC", score: 62, totalMes: 8, compliant: 3, partial: 3, nonCompliant: 2, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-PS", chapterName: "Patient Safety", score: 78, totalMes: 2, compliant: 1, partial: 1, nonCompliant: 0, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-FM", chapterName: "Facility Management", score: 70, totalMes: 2, compliant: 1, partial: 0, nonCompliant: 1, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-MM", chapterName: "Medication Management", score: 90, totalMes: 1, compliant: 1, partial: 0, nonCompliant: 0, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-CBAHI-LD", chapterName: "Leadership", score: 80, totalMes: 1, compliant: 0, partial: 1, nonCompliant: 0, notApplicable: 0 },
  ];
  for (const cs of chapterScoresData) {
    await prisma.chapterScore.create({ data: cs });
  }
  console.log(`  Created ${chapterScoresData.length} chapter scores`);

  // ============================================
  // EVIDENCE
  // ============================================
  const evidenceData = [
    { id: "EV-001", documentName: "Hand_Hygiene_Policy_v3.pdf", type: "policy", department: "Infection Control", fileType: "application/pdf", fileSize: 2456000, filePath: "/uploads/ev/Hand_Hygiene_Policy_v3.pdf", uploadedById: "USR-004", version: "3.0", owner: "IPC Department", summary: "Comprehensive hand hygiene policy referencing WHO five moments. Includes ABHR protocol. Last reviewed December 2025.", status: "mapped" },
    { id: "EV-002", documentName: "Monthly_HH_Audit_Jan2026.xlsx", type: "audit", department: "Quality", fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 890000, filePath: "/uploads/ev/Monthly_HH_Audit_Jan2026.xlsx", uploadedById: "USR-002", version: "1.0", owner: "Quality Department", summary: "Hand hygiene compliance audit for January 2026. Overall compliance: 82%.", status: "mapped" },
    { id: "EV-003", documentName: "Fire_Safety_Plan_2025.pdf", type: "policy", department: "Safety", fileType: "application/pdf", fileSize: 5120000, filePath: "/uploads/ev/Fire_Safety_Plan_2025.pdf", uploadedById: "USR-003", version: "2.0", owner: "Safety Department", summary: "Fire safety plan with evacuation procedures. Contains RACE protocol but missing PASS protocol.", status: "mapped" },
    { id: "EV-004", documentName: "Sterilization_SOP_CSSD.pdf", type: "procedure", department: "CSSD", fileType: "application/pdf", fileSize: 3210000, filePath: "/uploads/ev/Sterilization_SOP_CSSD.pdf", uploadedById: "USR-004", version: "4.1", owner: "CSSD", summary: "Standard operating procedures for CSSD. Includes Spaulding classification. Missing BI monitoring section.", status: "mapped" },
    { id: "EV-005", documentName: "HAI_Surveillance_Q4_2025.pdf", type: "record", department: "Infection Control", fileType: "application/pdf", fileSize: 1540000, filePath: "/uploads/ev/HAI_Surveillance_Q4_2025.pdf", uploadedById: "USR-004", version: "1.0", owner: "IPC Department", summary: "HAI surveillance report covering CLABSI and CAUTI. Missing SSI and VAP data.", status: "classified" },
    { id: "EV-006", documentName: "Patient_ID_Policy_v2.pdf", type: "policy", department: "Nursing", fileType: "application/pdf", fileSize: 1280000, filePath: "/uploads/ev/Patient_ID_Policy_v2.pdf", uploadedById: "USR-002", version: "2.0", owner: "Nursing", summary: "Patient identification policy requiring two identifiers. Includes wristband verification.", status: "mapped" },
    { id: "EV-007", documentName: "High_Alert_Medications_Policy.pdf", type: "policy", department: "Pharmacy", fileType: "application/pdf", fileSize: 1980000, filePath: "/uploads/ev/High_Alert_Medications_Policy.pdf", uploadedById: "USR-003", version: "3.0", owner: "Pharmacy", summary: "High-alert medications policy based on ISMP list. Includes double-check and LASA protocols.", status: "mapped" },
    { id: "EV-008", documentName: "Orientation_Training_Records_2025.xlsx", type: "training", department: "HR", fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 650000, filePath: "/uploads/ev/Orientation_Training_Records_2025.xlsx", uploadedById: "USR-002", version: "1.0", owner: "Education Department", summary: "Staff orientation training records for 2025. Hand hygiene training completion: 88%.", status: "classified" },
  ];
  for (const ev of evidenceData) {
    await prisma.evidence.create({ data: ev });
  }
  for (const ev of evidenceData) {
    await prisma.projectEvidence.create({ data: { projectId: "PRJ-001", evidenceId: ev.id } });
  }
  console.log(`  Created ${evidenceData.length} evidence documents`);

  // ============================================
  // ASSESSMENT & COMPLIANCE SCORES
  // ============================================
  await prisma.assessment.create({
    data: { id: "ASM-001", projectId: "PRJ-001", standardVersion: "CBAHI 2026 v1.0", status: "completed", progress: 100, completedAt: new Date("2026-02-10T11:08:00Z"), totalMes: 17, processedMes: 17 },
  });

  const complianceData = [
    { id: "CS-001", assessmentId: "ASM-001", meId: "ME-SIPC1-1-01", meCode: "SIPC.1.1.1", meText: "Hand hygiene policy consistent with WHO guidelines.", aiScore: "compliant", aiConfidence: 92, matchScore: 92, justification: "Hand Hygiene Policy v3 fully aligns with WHO Five Moments framework." },
    { id: "CS-002", assessmentId: "ASM-001", meId: "ME-SIPC1-1-02", meCode: "SIPC.1.1.2", meText: "Hand hygiene compliance rates monitored monthly.", aiScore: "partial", aiConfidence: 75, matchScore: 68, justification: "Monthly audit found but compliance at 82% (below 85% target). Only 1 month uploaded.", evidenceMissing: JSON.stringify(["Audit reports for past 6 months", "ICC meeting minutes"]), gaps: JSON.stringify(["Compliance rate below 85%", "Insufficient audit history"]) },
    { id: "CS-003", assessmentId: "ASM-001", meId: "ME-SIPC1-3-01", meCode: "SIPC.1.3.1", meText: "Hand hygiene training during orientation.", aiScore: "partial", aiConfidence: 70, matchScore: 72, justification: "Training records found showing 88% completion (below 90% target).", evidenceMissing: JSON.stringify(["Annual refresher records"]), gaps: JSON.stringify(["Completion rate below 90%"]) },
    { id: "CS-004", assessmentId: "ASM-001", meId: "ME-SIPC2-1-01", meCode: "SIPC.2.1.1", meText: "Policies for sterilization of medical devices.", aiScore: "partial", aiConfidence: 78, matchScore: 75, justification: "CSSD SOP found with Spaulding classification. Missing BI monitoring section.", gaps: JSON.stringify(["Missing BI monitoring section"]) },
    { id: "CS-005", assessmentId: "ASM-001", meId: "ME-SIPC2-2-01", meCode: "SIPC.2.2.1", meText: "Biological indicators used to monitor sterilization.", aiScore: "non-compliant", aiConfidence: 88, matchScore: 15, justification: "No documentation of biological indicator testing found.", evidenceMissing: JSON.stringify(["BI testing logs", "Spore test results"]), gaps: JSON.stringify(["No BI documentation"]) },
    { id: "CS-006", assessmentId: "ASM-001", meId: "ME-SIPC3-1-01", meCode: "SIPC.3.1.1", meText: "HAI surveillance using standardized definitions.", aiScore: "partial", aiConfidence: 72, matchScore: 55, justification: "HAI report found but missing SSI and VAP data.", gaps: JSON.stringify(["Incomplete surveillance"]) },
    { id: "CS-007", assessmentId: "ASM-001", meId: "ME-SIPC3-2-01", meCode: "SIPC.3.2.1", meText: "Infection rates benchmarked.", aiScore: "non-compliant", aiConfidence: 90, matchScore: 10, justification: "No benchmarking documentation found." },
    { id: "CS-008", assessmentId: "ASM-001", meId: "ME-PS1-1-01", meCode: "PS.1.1.1", meText: "Patient identification with two identifiers.", aiScore: "compliant", aiConfidence: 95, matchScore: 96, justification: "Policy fully meets requirements." },
    { id: "CS-009", assessmentId: "ASM-001", meId: "ME-PS2-1-01", meCode: "PS.2.1.1", meText: "Fire safety plan with evacuation and drills.", aiScore: "partial", aiConfidence: 68, matchScore: 60, justification: "RACE protocol present. Missing PASS protocol and Q4 drill records.", gaps: JSON.stringify(["Missing PASS protocol"]) },
    { id: "CS-010", assessmentId: "ASM-001", meId: "ME-MM1-1-01", meCode: "MM.1.1.1", meText: "High-alert medications policy.", aiScore: "compliant", aiConfidence: 90, matchScore: 90, justification: "Policy is comprehensive and ISMP-based." },
  ];
  for (const cs of complianceData) {
    await prisma.complianceScore.create({ data: cs });
  }
  console.log(`  Created ${complianceData.length} compliance scores`);

  // Evidence matches
  const evidenceMatchesData = [
    { complianceScoreId: "CS-001", evidenceId: "EV-001", documentName: "Hand_Hygiene_Policy_v3.pdf", relevanceScore: 95 },
    { complianceScoreId: "CS-002", evidenceId: "EV-002", documentName: "Monthly_HH_Audit_Jan2026.xlsx", relevanceScore: 78 },
    { complianceScoreId: "CS-003", evidenceId: "EV-008", documentName: "Orientation_Training_Records_2025.xlsx", relevanceScore: 74 },
    { complianceScoreId: "CS-004", evidenceId: "EV-004", documentName: "Sterilization_SOP_CSSD.pdf", relevanceScore: 80 },
    { complianceScoreId: "CS-006", evidenceId: "EV-005", documentName: "HAI_Surveillance_Q4_2025.pdf", relevanceScore: 62 },
    { complianceScoreId: "CS-008", evidenceId: "EV-006", documentName: "Patient_ID_Policy_v2.pdf", relevanceScore: 96 },
    { complianceScoreId: "CS-009", evidenceId: "EV-003", documentName: "Fire_Safety_Plan_2025.pdf", relevanceScore: 65 },
    { complianceScoreId: "CS-010", evidenceId: "EV-007", documentName: "High_Alert_Medications_Policy.pdf", relevanceScore: 92 },
  ];
  for (const em of evidenceMatchesData) {
    await prisma.evidenceMatch.create({ data: em });
  }

  // ============================================
  // SAMPLE ACTIVITY RESPONSES (for PRJ-001)
  // ============================================
  const responseData = [
    { activityId: "ACT-SIPC1-1-C1", projectId: "PRJ-001", value: "true", status: "completed" },
    { activityId: "ACT-SIPC1-1-C2", projectId: "PRJ-001", value: "true", status: "completed" },
    { activityId: "ACT-SIPC1-1-D1", projectId: "PRJ-001", value: "82", status: "completed" },
    { activityId: "ACT-SIPC1-1-D2", projectId: "PRJ-001", value: "2025-12-15", status: "completed" },
    { activityId: "ACT-PS1-1-C1", projectId: "PRJ-001", value: "true", status: "completed" },
    { activityId: "ACT-SIPC2-2-C1", projectId: "PRJ-001", value: "false", status: "completed" },
    { activityId: "ACT-MM1-1-C1", projectId: "PRJ-001", value: "true", status: "completed" },
  ];
  for (const r of responseData) {
    await prisma.activityResponse.create({ data: r });
  }
  console.log(`  Created ${responseData.length} activity responses`);

  // ============================================
  // CORRECTIVE ACTIONS
  // ============================================
  const caData = [
    { id: "CA-001", projectId: "PRJ-001", meId: "ME-SIPC1-1-02", meCode: "SIPC.1.1.2", gapDescription: "Hand hygiene compliance below 85% target", actionType: "evidence_creation", recommendedAction: "Upload audit reports for the past 6 months. Improve compliance in ICU and ER.", assignedDepartment: "Quality", assignedTo: "Pradeep Kumar", dueDate: "2026-03-01", priority: "high", status: "in-progress" },
    { id: "CA-002", projectId: "PRJ-001", meId: "ME-SIPC2-2-01", meCode: "SIPC.2.2.1", gapDescription: "No biological indicator testing documentation", actionType: "process_redesign", recommendedAction: "Establish BI testing program for all sterilizers.", assignedDepartment: "CSSD", assignedTo: "Dr. Fatima Al-Rashid", dueDate: "2026-02-28", priority: "critical", status: "open" },
    { id: "CA-003", projectId: "PRJ-001", meId: "ME-SIPC3-2-01", meCode: "SIPC.3.2.1", gapDescription: "No infection rate benchmarking process", actionType: "process_redesign", recommendedAction: "Obtain NHSN benchmarking access. Create quarterly reports.", assignedDepartment: "Infection Control", assignedTo: "Dr. Fatima Al-Rashid", dueDate: "2026-03-15", priority: "high", status: "open" },
    { id: "CA-004", projectId: "PRJ-001", meId: "ME-PS2-1-01", meCode: "PS.2.1.1", gapDescription: "Incomplete fire safety plan — missing PASS protocol", actionType: "policy_update", recommendedAction: "Update fire safety plan to include PASS protocol.", assignedDepartment: "Safety", assignedTo: "Utkarsh Singh", dueDate: "2026-03-01", priority: "high", status: "in-progress" },
  ];
  for (const ca of caData) {
    await prisma.correctiveAction.create({ data: ca });
  }
  console.log(`  Created ${caData.length} corrective actions`);

  // ============================================
  // MASTER DOCUMENTS
  // ============================================
  const masterDocsData = [
    { id: "MD-001", name: "CBAHI Hand Hygiene Standard Reference", chapterId: "CH-CBAHI-SIPC", description: "Gold standard reference for hand hygiene policy requirements.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_hh_reference.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", mappedMes: ["ME-SIPC1-1-01", "ME-SIPC1-1-02", "ME-SIPC1-3-01"] },
    { id: "MD-002", name: "CBAHI IPC Complete Chapter Guide", chapterId: "CH-CBAHI-SIPC", description: "Complete reference for all IPC measurable elements.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_ipc_guide.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", mappedMes: ["ME-SIPC2-1-01", "ME-SIPC2-2-01", "ME-SIPC3-1-01", "ME-SIPC3-2-01"] },
    { id: "MD-003", name: "CBAHI Patient Safety Standards Master", chapterId: "CH-CBAHI-PS", description: "Master reference for patient safety standards.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_ps_master.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", mappedMes: ["ME-PS1-1-01", "ME-PS2-1-01"] },
  ];
  for (const md of masterDocsData) {
    const { mappedMes, ...docData } = md;
    await prisma.masterDocument.create({ data: docData });
    for (const meId of mappedMes) {
      const meExists = await prisma.measurableElement.findUnique({ where: { id: meId } });
      if (meExists) {
        await prisma.masterDocMapping.create({ data: { masterDocumentId: md.id, meId } });
      }
    }
  }
  console.log(`  Created ${masterDocsData.length} master documents`);

  // ============================================
  // POLICIES
  // ============================================
  const policiesData = [
    { id: "POL-001", name: "Hand Hygiene Policy", code: "IPC-POL-001", category: "policy", department: "Infection Control", description: "Organizational hand hygiene policy consistent with WHO guidelines.", version: "3.0", status: "active", effectiveDate: "2025-01-01", reviewDate: "2026-01-01", owner: "IPC Department" },
    { id: "POL-002", name: "Patient Identification Policy", code: "PS-POL-001", category: "policy", department: "Nursing", description: "Policy for patient identification using two identifiers.", version: "2.0", status: "active", effectiveDate: "2024-06-01", reviewDate: "2026-06-01", owner: "Nursing Department" },
    { id: "POL-003", name: "Fire Safety Plan", code: "FM-POL-001", category: "policy", department: "Safety", description: "Comprehensive fire safety plan with evacuation procedures.", version: "2.0", status: "active", effectiveDate: "2025-03-01", reviewDate: "2026-03-01", owner: "Safety Department" },
    { id: "POL-004", name: "High-Alert Medications Policy", code: "MM-POL-001", category: "policy", department: "Pharmacy", description: "High-alert medications management per ISMP guidelines.", version: "3.0", status: "active", effectiveDate: "2025-01-15", reviewDate: "2026-01-15", owner: "Pharmacy" },
    { id: "POL-005", name: "Document Control Procedure", code: "DA-POL-001", category: "procedure", department: "Quality", description: "Procedure for document control, versioning, and distribution.", version: "1.0", status: "active", effectiveDate: "2025-06-01", reviewDate: "2026-06-01", owner: "Quality Department" },
    { id: "POL-006", name: "CSSD Sterilization SOP", code: "IPC-SOP-001", category: "procedure", department: "CSSD", description: "Standard operating procedures for CSSD sterilization and disinfection.", version: "4.1", status: "active", effectiveDate: "2025-09-01", reviewDate: "2026-09-01", owner: "CSSD" },
  ];
  for (const pol of policiesData) {
    await prisma.policy.create({ data: pol });
  }

  // Map policies to sub-standards
  const policyMappings = [
    { policyId: "POL-001", subStandardId: "SS-SIPC1-1" },
    { policyId: "POL-002", subStandardId: "SS-PS1-1" },
    { policyId: "POL-003", subStandardId: "SS-PS2-1" },
    { policyId: "POL-004", subStandardId: "SS-MM1-1" },
    { policyId: "POL-005", subStandardId: "SS-DA1-1" },
    { policyId: "POL-005", subStandardId: "SS-DA1-2" },
    { policyId: "POL-006", subStandardId: "SS-SIPC2-1" },
  ];
  for (const pm of policyMappings) {
    await prisma.policyMapping.create({ data: pm });
  }
  console.log(`  Created ${policiesData.length} policies with ${policyMappings.length} mappings`);

  // ============================================
  // ACTIVITY LOG
  // ============================================
  const activityLogData = [
    { action: "Survey project created", userId: "USR-001", details: "Created 'CBAHI 2026 Full Readiness Assessment'", type: "system", createdAt: new Date("2026-01-15T09:30:00Z") },
    { action: "Evidence uploaded", userId: "USR-004", details: "Uploaded Hand_Hygiene_Policy_v3.pdf", type: "upload", createdAt: new Date("2026-01-20T14:22:00Z") },
    { action: "AI Assessment run", userId: "USR-001", details: "Full CBAHI assessment — 72% overall", type: "scan", createdAt: new Date("2026-02-10T11:00:00Z") },
    { action: "Score override", userId: "USR-002", details: "Override SIPC.1.1.2 from 'Non-Compliant' to 'Partial'", type: "override", createdAt: new Date("2026-02-11T09:15:00Z") },
    { action: "Report generated", userId: "USR-001", details: "Mock Survey Report exported as PDF", type: "report", createdAt: new Date("2026-02-12T16:00:00Z") },
    { action: "Evidence uploaded", userId: "USR-003", details: "Uploaded High_Alert_Medications_Policy.pdf", type: "upload", createdAt: new Date("2026-02-01T13:30:00Z") },
  ];
  for (const al of activityLogData) {
    await prisma.activityLog.create({ data: al });
  }

  // ============================================
  // CO-PILOT CONVERSATION
  // ============================================
  await prisma.copilotConversation.create({ data: { id: "CONV-001", projectId: "PRJ-001", title: "IPC Assessment Questions" } });
  await prisma.copilotMessage.create({ data: { conversationId: "CONV-001", userId: "USR-001", role: "user", content: "Why did we fail SIPC.2.2.1?" } });
  await prisma.copilotMessage.create({ data: { conversationId: "CONV-001", role: "assistant", content: "SIPC.2.2.1 (Biological indicators monitoring) scored **Non-Compliant** because no BI testing documentation was uploaded.\n\n**Required Actions:**\n1. Implement a BI testing program\n2. Create standardized testing logs\n3. Ensure spore test results are reviewed within 24 hours" } });

  // ============================================
  // NOTIFICATIONS
  // ============================================
  await prisma.notification.create({ data: { userId: "USR-001", title: "Assessment Complete", message: "AI assessment for CBAHI 2026 Full Readiness has completed. Overall score: 72%", type: "success", link: "/gap-analysis" } });
  await prisma.notification.create({ data: { userId: "USR-001", title: "Corrective Action Overdue", message: "CA-002: BI testing program is past due", type: "warning", link: "/gap-analysis" } });

  console.log("\nDatabase seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
