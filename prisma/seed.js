const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.copilotMessage.deleteMany();
  await prisma.copilotConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.masterDocMapping.deleteMany();
  await prisma.masterDocument.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.evidenceMatch.deleteMany();
  await prisma.complianceScore.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.projectEvidence.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.chapterScore.deleteMany();
  await prisma.surveyProject.deleteMany();
  await prisma.measurableElement.deleteMany();
  await prisma.subStandard.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // USERS
  // ============================================
  const users = await Promise.all([
    prisma.user.create({
      data: { id: "USR-001", name: "Dr. Varun Mehta", email: "varun.mehta@kfmc.sa", role: "quality_director", avatar: "/avatars/varun.jpg" },
    }),
    prisma.user.create({
      data: { id: "USR-002", name: "Pradeep Kumar", email: "pradeep.kumar@kfmc.sa", role: "quality_officer" },
    }),
    prisma.user.create({
      data: { id: "USR-003", name: "Utkarsh Singh", email: "utkarsh.singh@kfmc.sa", role: "quality_officer" },
    }),
    prisma.user.create({
      data: { id: "USR-004", name: "Dr. Fatima Al-Rashid", email: "fatima.alrashid@kfmc.sa", role: "department_head" },
    }),
    prisma.user.create({
      data: { id: "USR-ADMIN", name: "Admin", email: "admin@kfmc.sa", role: "admin" },
    }),
  ]);
  console.log(`  ✓ Created ${users.length} users`);

  // ============================================
  // FACILITIES
  // ============================================
  const facilities = await Promise.all([
    prisma.facility.create({ data: { id: "FAC-001", name: "King Fahad Medical City", location: "Riyadh", type: "hospital" } }),
    prisma.facility.create({ data: { id: "FAC-002", name: "National Guard Hospital", location: "Riyadh", type: "hospital" } }),
    prisma.facility.create({ data: { id: "FAC-003", name: "KSUMC", location: "Riyadh", type: "hospital" } }),
  ]);
  console.log(`  ✓ Created ${facilities.length} facilities`);

  // ============================================
  // STANDARDS (from standards.json structure)
  // ============================================
  const stdIPC = await prisma.standard.create({
    data: {
      id: "STD-IC",
      chapterId: "CH-03",
      chapterName: "Infection Prevention and Control",
      standardName: "Infection Prevention and Control Program",
      description: "The organization implements a comprehensive infection prevention and control program.",
      version: "CBAHI-Sibahi 2026 v1.0",
      criticality: "critical",
    },
  });

  const stdPS = await prisma.standard.create({
    data: {
      id: "STD-PS",
      chapterId: "CH-01",
      chapterName: "Patient Safety",
      standardName: "National Patient Safety Goals",
      description: "The organization implements national patient safety goals.",
      version: "CBAHI-Sibahi 2026 v1.0",
      criticality: "critical",
    },
  });

  const stdPC = await prisma.standard.create({
    data: {
      id: "STD-PC",
      chapterId: "CH-02",
      chapterName: "Patient Care",
      standardName: "Patient Care Standards",
      description: "Standards for providing patient care services.",
      version: "CBAHI-Sibahi 2026 v1.0",
      criticality: "non-critical",
    },
  });

  const stdMM = await prisma.standard.create({
    data: {
      id: "STD-MM",
      chapterId: "CH-05",
      chapterName: "Medication Management",
      standardName: "Medication Management and Use",
      description: "Standards for safe medication management practices.",
      version: "CBAHI-Sibahi 2026 v1.0",
      criticality: "critical",
    },
  });

  const stdLD = await prisma.standard.create({
    data: {
      id: "STD-LD",
      chapterId: "CH-06",
      chapterName: "Leadership",
      standardName: "Leadership and Governance",
      description: "Standards for organizational leadership and governance.",
      version: "CBAHI-Sibahi 2026 v1.0",
      criticality: "non-critical",
    },
  });

  console.log(`  ✓ Created 5 standards`);

  // ============================================
  // SUB-STANDARDS & MEASURABLE ELEMENTS
  // ============================================
  // IPC Sub-Standards
  const subIPC1 = await prisma.subStandard.create({ data: { id: "SS-IC-01", standardId: "STD-IC", name: "Hand Hygiene" } });
  const subIPC2 = await prisma.subStandard.create({ data: { id: "SS-IC-02", standardId: "STD-IC", name: "Sterilization and Disinfection" } });
  const subIPC3 = await prisma.subStandard.create({ data: { id: "SS-IC-03", standardId: "STD-IC", name: "HAI Surveillance" } });

  // PS Sub-Standards
  const subPS1 = await prisma.subStandard.create({ data: { id: "SS-PS-01", standardId: "STD-PS", name: "Patient Identification" } });
  const subPS2 = await prisma.subStandard.create({ data: { id: "SS-PS-02", standardId: "STD-PS", name: "Fire Safety" } });
  const subPS3 = await prisma.subStandard.create({ data: { id: "SS-PS-03", standardId: "STD-PS", name: "Medication Safety" } });

  // PC Sub-Standards
  const subPC1 = await prisma.subStandard.create({ data: { id: "SS-PC-01", standardId: "STD-PC", name: "Care Planning" } });

  // MM Sub-Standards
  const subMM1 = await prisma.subStandard.create({ data: { id: "SS-MM-01", standardId: "STD-MM", name: "Formulary Management" } });

  // LD Sub-Standards
  const subLD1 = await prisma.subStandard.create({ data: { id: "SS-LD-01", standardId: "STD-LD", name: "Governance Structure" } });

  console.log(`  ✓ Created 9 sub-standards`);

  // Measurable Elements
  const mesData = [
    { id: "ME-IC-01-01", subStandardId: "SS-IC-01", code: "IPC.1.1", text: "The organization has an approved hand hygiene policy that is consistent with WHO guidelines and is reviewed annually.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["hand hygiene", "WHO", "five moments", "ABHR", "alcohol-based hand rub"]), departments: JSON.stringify(["Infection Control", "All Clinical"]), scoringRule: "Policy document must reference WHO Five Moments and include ABHR protocol" },
    { id: "ME-IC-01-02", subStandardId: "SS-IC-01", code: "IPC.1.2", text: "Hand hygiene compliance rates are monitored monthly and reported to the Infection Control Committee.", criticality: "critical", requiredEvidenceType: JSON.stringify(["audit", "record"]), keywords: JSON.stringify(["compliance rate", "audit", "monitoring", "ICC"]), departments: JSON.stringify(["Quality", "Infection Control"]), scoringRule: "At least 6 months of audit data with >85% compliance; ICC reporting evidence required" },
    { id: "ME-IC-01-03", subStandardId: "SS-IC-01", code: "IPC.1.3", text: "Hand hygiene training is provided to all new staff during orientation and annually thereafter.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["training", "record"]), keywords: JSON.stringify(["training", "orientation", "competency", "annual refresher"]), departments: JSON.stringify(["Education", "HR"]), scoringRule: "Training completion rate >90% for new hires; annual refresher documentation required" },
    { id: "ME-IC-02-01", subStandardId: "SS-IC-02", code: "IPC.2.1", text: "The organization has policies and procedures for cleaning, disinfection, and sterilization of medical devices and equipment.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy", "procedure"]), keywords: JSON.stringify(["sterilization", "disinfection", "Spaulding", "CSSD", "autoclave"]), departments: JSON.stringify(["CSSD", "Infection Control"]), scoringRule: "Must include Spaulding classification and approved disinfectant list" },
    { id: "ME-IC-02-02", subStandardId: "SS-IC-02", code: "IPC.2.2", text: "Biological indicators are used to monitor sterilization processes and results are documented.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record", "procedure"]), keywords: JSON.stringify(["biological indicator", "spore test", "sterilizer validation", "BI monitoring"]), departments: JSON.stringify(["CSSD"]), scoringRule: "Daily BI testing logs required; results reviewed within 24 hours" },
    { id: "ME-IC-03-01", subStandardId: "SS-IC-03", code: "IPC.3.1", text: "The organization conducts surveillance of healthcare-associated infections (HAIs) using standardized definitions.", criticality: "critical", requiredEvidenceType: JSON.stringify(["record", "audit"]), keywords: JSON.stringify(["HAI", "surveillance", "CLABSI", "CAUTI", "SSI", "VAP"]), departments: JSON.stringify(["Infection Control"]), scoringRule: "All major HAI types must be under surveillance with NHSN definitions" },
    { id: "ME-IC-03-02", subStandardId: "SS-IC-03", code: "IPC.3.2", text: "Infection rates are benchmarked against national and international standards.", criticality: "non-critical", requiredEvidenceType: JSON.stringify(["record"]), keywords: JSON.stringify(["benchmark", "NHSN", "national rate", "percentile"]), departments: JSON.stringify(["Infection Control", "Quality"]), scoringRule: "Quarterly benchmarking reports with NHSN or national comparison required" },
    { id: "ME-PS-01-01", subStandardId: "SS-PS-01", code: "PS.1.1", text: "The organization has a patient identification policy that requires at least two patient identifiers before any intervention.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["patient identification", "two identifiers", "wristband", "MRN"]), departments: JSON.stringify(["Nursing", "All Clinical"]), scoringRule: "Policy must specify two identifiers and wristband verification procedure" },
    { id: "ME-PS-02-01", subStandardId: "SS-PS-02", code: "PS.2.1", text: "The organization has a comprehensive fire safety plan including evacuation procedures, fire drills, and fire equipment maintenance.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy", "record"]), keywords: JSON.stringify(["fire safety", "evacuation", "RACE", "PASS", "fire drill"]), departments: JSON.stringify(["Safety"]), scoringRule: "Must include RACE and PASS protocols; fire drill records required" },
    { id: "ME-PS-03-01", subStandardId: "SS-PS-03", code: "PS.3.1", text: "The organization has a high-alert medications policy identifying medications that require additional safeguards.", criticality: "critical", requiredEvidenceType: JSON.stringify(["policy"]), keywords: JSON.stringify(["high-alert", "ISMP", "LASA", "double check", "medication safety"]), departments: JSON.stringify(["Pharmacy"]), scoringRule: "Must align with ISMP list; double-check procedures documented" },
  ];

  for (const me of mesData) {
    await prisma.measurableElement.create({ data: me });
  }
  console.log(`  ✓ Created ${mesData.length} measurable elements`);

  // ============================================
  // SURVEY PROJECTS
  // ============================================
  const project1 = await prisma.surveyProject.create({
    data: {
      id: "PRJ-001",
      name: "Sibahi 2026 Full Readiness Assessment",
      facilityId: "FAC-001",
      standardVersion: "CBAHI-Sibahi 2026 v1.0",
      scope: "full",
      selectedChapters: JSON.stringify(["CH-01", "CH-02", "CH-03", "CH-05", "CH-06"]),
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
      standardVersion: "CBAHI-Sibahi 2026 v1.0",
      scope: "partial",
      selectedChapters: JSON.stringify(["CH-03"]),
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
      name: "Medication Management Deep Dive",
      facilityId: "FAC-002",
      standardVersion: "CBAHI-Sibahi 2026 v1.0",
      scope: "partial",
      selectedChapters: JSON.stringify(["CH-05"]),
      departments: JSON.stringify(["Pharmacy", "Nursing"]),
      status: "completed",
      createdById: "USR-003",
      deadline: "2026-01-31",
      teamMembers: JSON.stringify(["Utkarsh Singh"]),
      overallScore: 88,
    },
  });
  console.log(`  ✓ Created 3 survey projects`);

  // Chapter Scores
  const chapterScoresData = [
    { projectId: "PRJ-001", chapterId: "CH-01", chapterName: "Patient Safety", score: 78, totalMes: 5, compliant: 3, partial: 1, nonCompliant: 1, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-02", chapterName: "Patient Care", score: 85, totalMes: 3, compliant: 2, partial: 1, nonCompliant: 0, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-03", chapterName: "Infection Prevention and Control", score: 65, totalMes: 7, compliant: 3, partial: 2, nonCompliant: 2, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-05", chapterName: "Medication Management", score: 58, totalMes: 3, compliant: 1, partial: 1, nonCompliant: 1, notApplicable: 0 },
    { projectId: "PRJ-001", chapterId: "CH-06", chapterName: "Leadership", score: 80, totalMes: 2, compliant: 1, partial: 1, nonCompliant: 0, notApplicable: 0 },
    { projectId: "PRJ-003", chapterId: "CH-05", chapterName: "Medication Management", score: 88, totalMes: 3, compliant: 2, partial: 1, nonCompliant: 0, notApplicable: 0 },
  ];
  for (const cs of chapterScoresData) {
    await prisma.chapterScore.create({ data: cs });
  }
  console.log(`  ✓ Created ${chapterScoresData.length} chapter scores`);

  // ============================================
  // EVIDENCE
  // ============================================
  const evidenceData = [
    { id: "EV-001", documentName: "Hand_Hygiene_Policy_v3.pdf", type: "policy", department: "Infection Control", fileType: "application/pdf", fileSize: 2456000, filePath: "/uploads/ev/Hand_Hygiene_Policy_v3.pdf", uploadedById: "USR-004", version: "3.0", owner: "IPC Department", summary: "Comprehensive hand hygiene policy referencing WHO five moments. Includes alcohol-based hand rub protocol. Last reviewed December 2025.", status: "mapped" },
    { id: "EV-002", documentName: "Monthly_HH_Audit_Report_Jan2026.xlsx", type: "audit", department: "Quality", fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 890000, filePath: "/uploads/ev/Monthly_HH_Audit_Report_Jan2026.xlsx", uploadedById: "USR-002", version: "1.0", owner: "Quality Department", summary: "Hand hygiene compliance audit for January 2026. Overall compliance: 82%. ICU: 78%, ER: 80%, Wards: 86%.", status: "mapped" },
    { id: "EV-003", documentName: "Fire_Safety_Plan_2025.pdf", type: "policy", department: "Safety", fileType: "application/pdf", fileSize: 5120000, filePath: "/uploads/ev/Fire_Safety_Plan_2025.pdf", uploadedById: "USR-003", version: "2.0", owner: "Safety Department", summary: "Fire safety plan including evacuation procedures. Contains RACE protocol but missing PASS protocol. Fire drill schedule included but no records for Q4 2025.", status: "mapped" },
    { id: "EV-004", documentName: "Sterilization_SOP_CSSD.pdf", type: "procedure", department: "CSSD", fileType: "application/pdf", fileSize: 3210000, filePath: "/uploads/ev/Sterilization_SOP_CSSD.pdf", uploadedById: "USR-004", version: "4.1", owner: "CSSD", summary: "Standard operating procedures for CSSD. Includes Spaulding classification. Autoclave protocols present. Missing biological indicator monitoring section.", status: "mapped" },
    { id: "EV-005", documentName: "HAI_Surveillance_Report_Q4_2025.pdf", type: "record", department: "Infection Control", fileType: "application/pdf", fileSize: 1540000, filePath: "/uploads/ev/HAI_Surveillance_Report_Q4_2025.pdf", uploadedById: "USR-004", version: "1.0", owner: "IPC Department", summary: "Healthcare-associated infections surveillance report. Covers CLABSI and CAUTI. Missing SSI and VAP surveillance data.", status: "classified" },
    { id: "EV-006", documentName: "Patient_ID_Policy_v2.pdf", type: "policy", department: "Nursing", fileType: "application/pdf", fileSize: 1280000, filePath: "/uploads/ev/Patient_ID_Policy_v2.pdf", uploadedById: "USR-002", version: "2.0", owner: "Nursing", summary: "Patient identification policy requiring two identifiers (name + MRN). Includes wristband verification procedure. Annual review documented.", status: "mapped" },
    { id: "EV-007", documentName: "High_Alert_Medications_Policy.pdf", type: "policy", department: "Pharmacy", fileType: "application/pdf", fileSize: 1980000, filePath: "/uploads/ev/High_Alert_Medications_Policy.pdf", uploadedById: "USR-003", version: "3.0", owner: "Pharmacy", summary: "High-alert medications policy based on ISMP list. Includes double-check procedures and LASA medication management protocols.", status: "mapped" },
    { id: "EV-008", documentName: "Orientation_Training_Records_2025.xlsx", type: "training", department: "HR", fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSize: 650000, filePath: "/uploads/ev/Orientation_Training_Records_2025.xlsx", uploadedById: "USR-002", version: "1.0", owner: "Education Department", summary: "Staff orientation training records for 2025. Hand hygiene training completion: 88%. Fire safety training: 92%.", status: "classified" },
  ];
  for (const ev of evidenceData) {
    await prisma.evidence.create({ data: ev });
  }
  console.log(`  ✓ Created ${evidenceData.length} evidence documents`);

  // Link evidence to project
  for (const ev of evidenceData) {
    await prisma.projectEvidence.create({
      data: { projectId: "PRJ-001", evidenceId: ev.id },
    });
  }

  // ============================================
  // ASSESSMENT & COMPLIANCE SCORES
  // ============================================
  const assessment = await prisma.assessment.create({
    data: {
      id: "ASM-001",
      projectId: "PRJ-001",
      standardVersion: "CBAHI-Sibahi 2026 v1.0",
      status: "completed",
      progress: 100,
      completedAt: new Date("2026-02-10T11:08:00Z"),
      totalMes: 10,
      processedMes: 10,
    },
  });

  const complianceData = [
    { id: "CS-001", assessmentId: "ASM-001", meId: "ME-IC-01-01", meCode: "IPC.1.1", meText: "The organization has an approved hand hygiene policy that is consistent with WHO guidelines and is reviewed annually.", aiScore: "compliant", aiConfidence: 92, matchScore: 92, justification: "Hand Hygiene Policy v3 was found and fully aligns with WHO Five Moments framework. The policy references alcohol-based hand rub protocol and shows annual review date of December 2025. All required elements are present.", evidenceMissing: "[]", gaps: "[]", recommendations: JSON.stringify(["Consider updating the policy review cycle to align with the accreditation timeline."]) },
    { id: "CS-002", assessmentId: "ASM-001", meId: "ME-IC-01-02", meCode: "IPC.1.2", meText: "Hand hygiene compliance rates are monitored monthly and reported to the Infection Control Committee.", aiScore: "partial", aiConfidence: 75, matchScore: 68, justification: "Monthly audit report found for January 2026 showing compliance at 82%. However, this is below the recommended 85% target. Only 1 month of data was uploaded — the standard requires at least 6 months of documented results.", evidenceMissing: JSON.stringify(["Audit reports for August 2025 – December 2025", "ICC meeting minutes showing compliance rate reporting"]), gaps: JSON.stringify(["Compliance rate (82%) below 85% target", "Insufficient historical audit data (need 6 months minimum)", "No evidence of ICC reporting"]), recommendations: JSON.stringify(["Upload audit reports for the past 6 months to demonstrate ongoing monitoring.", "Implement improvement actions to achieve >85% hand hygiene compliance.", "Provide ICC meeting minutes documenting the compliance rate discussions."]) },
    { id: "CS-003", assessmentId: "ASM-001", meId: "ME-IC-01-03", meCode: "IPC.1.3", meText: "Hand hygiene training is provided to all new staff during orientation and annually thereafter.", aiScore: "partial", aiConfidence: 70, matchScore: 72, justification: "Training records found showing 88% completion rate for hand hygiene training in 2025. This is below the required 90% threshold.", evidenceMissing: JSON.stringify(["Annual refresher training records", "Competency assessment documentation"]), gaps: JSON.stringify(["Completion rate (88%) below 90% target", "No evidence of annual refresher training program"]), recommendations: JSON.stringify(["Increase orientation training completion to >90%.", "Develop and document an annual hand hygiene refresher program.", "Include competency assessments as part of training records."]) },
    { id: "CS-004", assessmentId: "ASM-001", meId: "ME-IC-02-01", meCode: "IPC.2.1", meText: "The organization has policies and procedures for cleaning, disinfection, and sterilization of medical devices and equipment.", aiScore: "partial", aiConfidence: 78, matchScore: 75, justification: "CSSD SOP document found with Spaulding classification and autoclave protocols. However, the document is missing a biological indicator monitoring section.", evidenceMissing: JSON.stringify(["Approved disinfectant list", "Sterilization validation protocols"]), gaps: JSON.stringify(["Missing biological indicator monitoring section", "No approved disinfectant list documented"]), recommendations: JSON.stringify(["Add biological indicator monitoring procedures to the CSSD SOP.", "Create and maintain an approved disinfectant list with concentrations and contact times."]) },
    { id: "CS-005", assessmentId: "ASM-001", meId: "ME-IC-02-02", meCode: "IPC.2.2", meText: "Biological indicators are used to monitor sterilization processes and results are documented.", aiScore: "non-compliant", aiConfidence: 88, matchScore: 15, justification: "No documentation of biological indicator testing was found in the uploaded evidence.", evidenceMissing: JSON.stringify(["Biological indicator testing logs", "Sterilizer qualification records", "Spore test results documentation"]), gaps: JSON.stringify(["No biological indicator testing documentation exists", "Critical gap in sterilization quality assurance"]), recommendations: JSON.stringify(["Immediately implement a biological indicator testing program for all sterilizers.", "Create standardized testing logs with daily documentation requirements.", "Ensure spore test results are reviewed within 24 hours."]) },
    { id: "CS-006", assessmentId: "ASM-001", meId: "ME-IC-03-01", meCode: "IPC.3.1", meText: "The organization conducts surveillance of healthcare-associated infections (HAIs) using standardized definitions.", aiScore: "partial", aiConfidence: 72, matchScore: 55, justification: "HAI surveillance report for Q4 2025 was found covering CLABSI and CAUTI data. However, the report is missing SSI and VAP surveillance data.", evidenceMissing: JSON.stringify(["SSI surveillance data", "VAP surveillance data", "Monthly collection documentation"]), gaps: JSON.stringify(["Incomplete HAI surveillance (only CLABSI/CAUTI)", "No SSI or VAP data provided"]), recommendations: JSON.stringify(["Expand surveillance program to include SSI and VAP.", "Implement monthly surveillance data collection and reporting."]) },
    { id: "CS-007", assessmentId: "ASM-001", meId: "ME-IC-03-02", meCode: "IPC.3.2", meText: "Infection rates are benchmarked against national and international standards.", aiScore: "non-compliant", aiConfidence: 90, matchScore: 10, justification: "No benchmarking documentation was found in the uploaded evidence.", evidenceMissing: JSON.stringify(["Benchmarking reports with NHSN comparison", "National benchmark data comparison"]), gaps: JSON.stringify(["No benchmarking process exists", "No comparison with national/international standards"]), recommendations: JSON.stringify(["Subscribe to NHSN or obtain national benchmarking data.", "Create quarterly benchmarking reports comparing facility rates to published benchmarks."]) },
    { id: "CS-008", assessmentId: "ASM-001", meId: "ME-PS-01-01", meCode: "PS.1.1", meText: "The organization has a patient identification policy that requires at least two patient identifiers before any intervention.", aiScore: "compliant", aiConfidence: 95, matchScore: 96, justification: "Patient Identification Policy v2 fully meets the standard requirements.", evidenceMissing: "[]", gaps: "[]", recommendations: "[]" },
    { id: "CS-009", assessmentId: "ASM-001", meId: "ME-PS-02-01", meCode: "PS.2.1", meText: "The organization has a comprehensive fire safety plan including evacuation procedures, fire drills, and fire equipment maintenance.", aiScore: "partial", aiConfidence: 68, matchScore: 60, justification: "Fire Safety Plan 2025 was found with evacuation procedures and RACE protocol. However, the PASS protocol is missing.", evidenceMissing: JSON.stringify(["PASS protocol documentation", "Q4 2025 fire drill records", "Fire equipment inspection logs"]), gaps: JSON.stringify(["Missing PASS protocol", "Incomplete fire drill records"]), recommendations: JSON.stringify(["Add PASS protocol to the fire safety plan.", "Upload fire drill records for Q4 2025."]) },
    { id: "CS-010", assessmentId: "ASM-001", meId: "ME-PS-03-01", meCode: "PS.3.1", meText: "The organization has a high-alert medications policy identifying medications that require additional safeguards.", aiScore: "compliant", aiConfidence: 90, matchScore: 90, justification: "High-Alert Medications Policy is comprehensive and based on the ISMP list.", evidenceMissing: "[]", gaps: "[]", recommendations: JSON.stringify(["Ensure annual review of the ISMP high-alert list alignment."]) },
  ];
  for (const cs of complianceData) {
    await prisma.complianceScore.create({ data: cs });
  }
  console.log(`  ✓ Created ${complianceData.length} compliance scores`);

  // Evidence matches
  const evidenceMatchesData = [
    { complianceScoreId: "CS-001", evidenceId: "EV-001", documentName: "Hand_Hygiene_Policy_v3.pdf", relevanceScore: 95, matchedSections: JSON.stringify(["Section 3: WHO Five Moments", "Section 5: ABHR Protocol", "Document Control: Review Date"]) },
    { complianceScoreId: "CS-002", evidenceId: "EV-002", documentName: "Monthly_HH_Audit_Report_Jan2026.xlsx", relevanceScore: 78, matchedSections: JSON.stringify(["Overall Compliance: 82%", "Department Breakdown", "Audit Methodology"]) },
    { complianceScoreId: "CS-003", evidenceId: "EV-008", documentName: "Orientation_Training_Records_2025.xlsx", relevanceScore: 74, matchedSections: JSON.stringify(["Hand Hygiene Module: 88% completion"]) },
    { complianceScoreId: "CS-004", evidenceId: "EV-004", documentName: "Sterilization_SOP_CSSD.pdf", relevanceScore: 80, matchedSections: JSON.stringify(["Section 2: Spaulding Classification", "Section 4: Autoclave Protocols"]) },
    { complianceScoreId: "CS-006", evidenceId: "EV-005", documentName: "HAI_Surveillance_Report_Q4_2025.pdf", relevanceScore: 62, matchedSections: JSON.stringify(["CLABSI Data: 1.2/1000 central line days", "CAUTI Data: 2.1/1000 catheter days"]) },
    { complianceScoreId: "CS-008", evidenceId: "EV-006", documentName: "Patient_ID_Policy_v2.pdf", relevanceScore: 96, matchedSections: JSON.stringify(["Section 1: Two Identifier Requirement", "Section 3: Wristband Verification", "Section 5: Corrective Measures"]) },
    { complianceScoreId: "CS-009", evidenceId: "EV-003", documentName: "Fire_Safety_Plan_2025.pdf", relevanceScore: 65, matchedSections: JSON.stringify(["Section 2: Evacuation Routes", "Section 3: RACE Protocol", "Appendix: Fire Drill Schedule"]) },
    { complianceScoreId: "CS-010", evidenceId: "EV-007", documentName: "High_Alert_Medications_Policy.pdf", relevanceScore: 92, matchedSections: JSON.stringify(["Section 1: ISMP High-Alert List", "Section 3: Double-Check Procedures", "Section 4: LASA Management"]) },
  ];
  for (const em of evidenceMatchesData) {
    await prisma.evidenceMatch.create({ data: em });
  }
  console.log(`  ✓ Created ${evidenceMatchesData.length} evidence matches`);

  // ============================================
  // CORRECTIVE ACTIONS
  // ============================================
  const caData = [
    { id: "CA-001", projectId: "PRJ-001", meId: "ME-IC-01-02", meCode: "IPC.1.2", gapDescription: "Hand hygiene compliance below 85% target; insufficient audit history", actionType: "evidence_creation", recommendedAction: "Upload audit reports for August 2025 – December 2025. Implement targeted improvement actions in ICU and ER to achieve >85% compliance rate.", assignedDepartment: "Quality", assignedTo: "Pradeep Kumar", dueDate: "2026-03-01", priority: "high", status: "in-progress" },
    { id: "CA-002", projectId: "PRJ-001", meId: "ME-IC-02-02", meCode: "IPC.2.2", gapDescription: "No biological indicator testing documentation", actionType: "process_redesign", recommendedAction: "Establish biological indicator testing program for all sterilizers. Create standardized daily testing logs.", assignedDepartment: "CSSD", assignedTo: "Dr. Fatima Al-Rashid", dueDate: "2026-02-28", priority: "critical", status: "open" },
    { id: "CA-003", projectId: "PRJ-001", meId: "ME-IC-03-02", meCode: "IPC.3.2", gapDescription: "No infection rate benchmarking process", actionType: "process_redesign", recommendedAction: "Obtain NHSN benchmarking access. Create quarterly benchmarking reports.", assignedDepartment: "Infection Control", assignedTo: "Dr. Fatima Al-Rashid", dueDate: "2026-03-15", priority: "high", status: "open" },
    { id: "CA-004", projectId: "PRJ-001", meId: "ME-PS-02-01", meCode: "PS.2.1", gapDescription: "Incomplete fire safety plan — missing PASS protocol and drill records", actionType: "policy_update", recommendedAction: "Update Fire Safety Plan to include PASS protocol. Locate and upload Q4 2025 fire drill records.", assignedDepartment: "Safety", assignedTo: "Utkarsh Singh", dueDate: "2026-03-01", priority: "high", status: "in-progress" },
    { id: "CA-005", projectId: "PRJ-001", meId: "ME-IC-01-03", meCode: "IPC.1.3", gapDescription: "Hand hygiene training completion below 90%; no annual refresher program", actionType: "training", recommendedAction: "Increase orientation HH training completion to >90%. Develop annual refresher training program.", assignedDepartment: "Education", assignedTo: "Pradeep Kumar", dueDate: "2026-03-15", priority: "medium", status: "open" },
  ];
  for (const ca of caData) {
    await prisma.correctiveAction.create({ data: ca });
  }
  console.log(`  ✓ Created ${caData.length} corrective actions`);

  // ============================================
  // MASTER DOCUMENTS
  // ============================================
  const masterDocsData = [
    { id: "MD-001", name: "CBAHI Hand Hygiene Standard Reference", standardId: "STD-IC", chapterId: "CH-03", description: "Gold standard reference for hand hygiene policy requirements per CBAHI/WHO guidelines.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_hh_reference.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", status: "active", mappedMes: ["ME-IC-01-01", "ME-IC-01-02", "ME-IC-01-03"] },
    { id: "MD-002", name: "CBAHI Infection Control Complete Chapter Guide", standardId: "STD-IC", chapterId: "CH-03", description: "Complete reference guide for all IPC measurable elements.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_ipc_guide.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", status: "active", mappedMes: ["ME-IC-02-01", "ME-IC-02-02", "ME-IC-03-01", "ME-IC-03-02"] },
    { id: "MD-003", name: "CBAHI Patient Safety Standards Master", standardId: "STD-PS", chapterId: "CH-01", description: "Master reference for patient safety standards.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_ps_master.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", status: "active", mappedMes: ["ME-PS-01-01", "ME-PS-02-01", "ME-PS-03-01"] },
    { id: "MD-004", name: "CBAHI Medication Management Reference", standardId: "STD-MM", chapterId: "CH-05", description: "Reference guide for medication management standards.", fileType: "application/pdf", filePath: "/uploads/master/cbahi_mm_reference.pdf", uploadedById: "USR-ADMIN", version: "2026.1", category: "reference", status: "active", mappedMes: ["ME-MM-01-01"] },
  ];
  for (const md of masterDocsData) {
    const { mappedMes, ...docData } = md;
    const doc = await prisma.masterDocument.create({ data: docData });
    for (const meId of mappedMes) {
      // Only create mapping if ME exists
      const meExists = await prisma.measurableElement.findUnique({ where: { id: meId } });
      if (meExists) {
        await prisma.masterDocMapping.create({
          data: { masterDocumentId: doc.id, meId },
        });
      }
    }
  }
  console.log(`  ✓ Created ${masterDocsData.length} master documents with mappings`);

  // ============================================
  // CHECKLIST TEMPLATE
  // ============================================
  const template = await prisma.checklistTemplate.create({
    data: { id: "CKL-IPC-001", standardId: "STD-IC", name: "IPC Checklist Template" },
  });

  const checklistItemsData = [
    { templateId: "CKL-IPC-001", meCode: "IPC.1.1", meId: "ME-IC-01-01", category: "checklist", label: "Hand Hygiene Policy Available", description: "Is an approved hand hygiene policy consistent with WHO guidelines available?", type: "boolean", required: true, value: "true", sortOrder: 1 },
    { templateId: "CKL-IPC-001", meCode: "IPC.1.1", meId: "ME-IC-01-01", category: "checklist", label: "WHO Five Moments Referenced", description: "Does the policy reference the WHO Five Moments for Hand Hygiene?", type: "boolean", required: true, value: "true", sortOrder: 2 },
    { templateId: "CKL-IPC-001", meCode: "IPC.1.1", meId: "ME-IC-01-01", category: "data_collection", label: "Policy Last Review Date", description: "When was the hand hygiene policy last reviewed?", type: "date", required: true, value: "2025-12-15", sortOrder: 3 },
    { templateId: "CKL-IPC-001", meCode: "IPC.1.2", meId: "ME-IC-01-02", category: "data_collection", label: "Current Hand Hygiene Compliance Rate", description: "What is the current overall hand hygiene compliance rate (%)?", type: "number", required: true, value: "82", sortOrder: 4 },
    { templateId: "CKL-IPC-001", meCode: "IPC.1.2", meId: "ME-IC-01-02", category: "document_evidence", label: "Monthly Audit Reports", description: "Upload monthly hand hygiene audit reports (past 6 months)", type: "file", required: true, evidenceFiles: JSON.stringify(["Monthly_HH_Audit_Report_Jan2026.xlsx"]), sortOrder: 5 },
    { templateId: "CKL-IPC-001", meCode: "IPC.1.3", meId: "ME-IC-01-03", category: "data_collection", label: "Training Completion Rate", description: "What is the hand hygiene training completion rate for new hires?", type: "number", required: true, value: "88", sortOrder: 6 },
    { templateId: "CKL-IPC-001", meCode: "IPC.2.1", meId: "ME-IC-02-01", category: "checklist", label: "Spaulding Classification Used", description: "Does the CSSD use Spaulding classification for device categorization?", type: "boolean", required: true, value: "true", sortOrder: 7 },
    { templateId: "CKL-IPC-001", meCode: "IPC.2.1", meId: "ME-IC-02-01", category: "document_evidence", label: "CSSD Standard Operating Procedures", description: "Upload CSSD sterilization and disinfection SOPs", type: "file", required: true, evidenceFiles: JSON.stringify(["Sterilization_SOP_CSSD.pdf"]), sortOrder: 8 },
    { templateId: "CKL-IPC-001", meCode: "IPC.2.2", meId: "ME-IC-02-02", category: "checklist", label: "Biological Indicator Testing Program", description: "Is there a biological indicator testing program for sterilizers?", type: "boolean", required: true, value: "false", sortOrder: 9 },
    { templateId: "CKL-IPC-001", meCode: "IPC.2.2", meId: "ME-IC-02-02", category: "document_evidence", label: "Biological Indicator Testing Logs", description: "Upload biological indicator testing logs", type: "file", required: true, evidenceFiles: "[]", sortOrder: 10 },
    { templateId: "CKL-IPC-001", meCode: "IPC.3.1", meId: "ME-IC-03-01", category: "data_collection", label: "HAI Types Under Surveillance", description: "Which HAI types are currently under surveillance?", type: "select", required: true, options: JSON.stringify(["CLABSI", "CAUTI", "SSI", "VAP", "C.diff", "MRSA"]), value: "CLABSI", sortOrder: 11 },
    { templateId: "CKL-IPC-001", meCode: "IPC.3.2", meId: "ME-IC-03-02", category: "checklist", label: "Benchmarking Against NHSN", description: "Are infection rates benchmarked against NHSN or national data?", type: "boolean", required: true, value: "false", sortOrder: 12 },
  ];
  for (const item of checklistItemsData) {
    await prisma.checklistItem.create({ data: item });
  }
  console.log(`  ✓ Created ${checklistItemsData.length} checklist items`);

  // ============================================
  // ACTIVITY LOG
  // ============================================
  const activityData = [
    { action: "Survey project created", userId: "USR-001", details: "Created 'Sibahi 2026 Full Readiness Assessment' project", type: "system", createdAt: new Date("2026-01-15T09:30:00Z") },
    { action: "Evidence uploaded", userId: "USR-004", details: "Uploaded Hand_Hygiene_Policy_v3.pdf", type: "upload", createdAt: new Date("2026-01-20T14:22:00Z") },
    { action: "Evidence uploaded", userId: "USR-002", details: "Uploaded Patient_ID_Policy_v2.pdf", type: "upload", createdAt: new Date("2026-01-18T10:45:00Z") },
    { action: "AI Assessment run", userId: "USR-001", details: "Full CBAHI assessment executed — 72% overall readiness", type: "scan", createdAt: new Date("2026-02-10T11:00:00Z") },
    { action: "Score override", userId: "USR-002", details: "Override IPC.1.2 from 'Non-Compliant' to 'Partial' with justification", type: "override", createdAt: new Date("2026-02-11T09:15:00Z") },
    { action: "Report generated", userId: "USR-001", details: "Mock Survey Report exported as PDF", type: "report", createdAt: new Date("2026-02-12T16:00:00Z") },
    { action: "Evidence uploaded", userId: "USR-003", details: "Uploaded High_Alert_Medications_Policy.pdf", type: "upload", createdAt: new Date("2026-02-01T13:30:00Z") },
    { action: "AI Scan completed", userId: null, details: "Mapped 8 evidence documents to 10 measurable elements", type: "scan", createdAt: new Date("2026-02-10T11:08:00Z") },
    { action: "Corrective action created", userId: null, details: "Generated 5 corrective actions for identified gaps", type: "system", createdAt: new Date("2026-02-10T11:10:00Z") },
    { action: "Evidence uploaded", userId: "USR-004", details: "Uploaded HAI_Surveillance_Report_Q4_2025.pdf", type: "upload", createdAt: new Date("2026-01-25T11:20:00Z") },
  ];
  for (const al of activityData) {
    await prisma.activityLog.create({ data: al });
  }
  console.log(`  ✓ Created ${activityData.length} activity log entries`);

  // ============================================
  // CO-PILOT CONVERSATION
  // ============================================
  const convo = await prisma.copilotConversation.create({
    data: { id: "CONV-001", projectId: "PRJ-001", title: "IPC Assessment Questions" },
  });

  const copilotData = [
    { conversationId: "CONV-001", userId: "USR-001", role: "user", content: "Why did we fail IPC.2.2?", createdAt: new Date("2026-02-12T10:00:00Z") },
    { conversationId: "CONV-001", role: "assistant", content: "The measurable element IPC.2.2 (Biological indicators monitoring) was scored **Non-Compliant** because no documentation of biological indicator testing was found in any uploaded evidence.\n\n**Specific Gaps:**\n1. No biological indicator testing logs were uploaded\n2. No sterilizer qualification records found\n3. The CSSD SOP mentions sterilization procedures but lacks specific biological indicator monitoring protocols\n\n**Required Actions:**\n- Implement a biological indicator testing program for all sterilizers\n- Create standardized daily testing logs\n- Ensure spore test results are reviewed within 24 hours", sources: JSON.stringify([{ document_name: "Sterilization_SOP_CSSD.pdf", section: "Section 4: Autoclave Protocols", relevance: 0.8 }]), createdAt: new Date("2026-02-12T10:00:05Z") },
    { conversationId: "CONV-001", userId: "USR-001", role: "user", content: "What evidence supports PS.1.1?", createdAt: new Date("2026-02-12T10:05:00Z") },
    { conversationId: "CONV-001", role: "assistant", content: "The measurable element PS.1.1 (Patient Identification Policy) is scored **Compliant** (96% match) based on the following evidence:\n\n**Primary Evidence:**\n- **Patient_ID_Policy_v2.pdf** (Relevance: 96%)\n  - Section 1: Two Identifier Requirement\n  - Section 3: Wristband Verification\n  - Section 5: Corrective Measures", sources: JSON.stringify([{ document_name: "Patient_ID_Policy_v2.pdf", section: "Full Document", relevance: 0.96 }]), createdAt: new Date("2026-02-12T10:05:04Z") },
  ];
  for (const msg of copilotData) {
    await prisma.copilotMessage.create({ data: msg });
  }
  console.log(`  ✓ Created co-pilot conversation with ${copilotData.length} messages`);

  // ============================================
  // NOTIFICATIONS
  // ============================================
  const notificationsData = [
    { userId: "USR-001", title: "Assessment Complete", message: "AI assessment for Sibahi 2026 Full Readiness has completed. Overall score: 72%", type: "success", link: "/gap-analysis", createdAt: new Date("2026-02-10T11:08:00Z") },
    { userId: "USR-001", title: "Corrective Action Overdue", message: "CA-002: Biological indicator testing program is past due date (Feb 28, 2026)", type: "warning", link: "/gap-analysis", createdAt: new Date("2026-02-18T08:00:00Z") },
    { userId: "USR-001", title: "New Evidence Uploaded", message: "Dr. Fatima Al-Rashid uploaded HAI_Surveillance_Report_Q4_2025.pdf", type: "info", link: "/evidence", createdAt: new Date("2026-01-25T11:20:00Z") },
  ];
  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  ✓ Created ${notificationsData.length} notifications`);

  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
