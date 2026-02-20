-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'quality_officer',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "Accreditation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accreditationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Chapter_accreditationId_fkey" FOREIGN KEY ("accreditationId") REFERENCES "Accreditation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Standard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "standardName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'non-critical',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Standard_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SubStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeasurableElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subStandardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'non-critical',
    "requiredEvidenceType" TEXT NOT NULL DEFAULT '[]',
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "departments" TEXT NOT NULL DEFAULT '[]',
    "scoringRule" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "MeasurableElement_subStandardId_fkey" FOREIGN KEY ("subStandardId") REFERENCES "SubStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subStandardId" TEXT NOT NULL,
    "meId" TEXT,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fieldType" TEXT NOT NULL DEFAULT 'boolean',
    "options" TEXT NOT NULL DEFAULT '[]',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Activity_subStandardId_fkey" FOREIGN KEY ("subStandardId") REFERENCES "SubStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_meId_fkey" FOREIGN KEY ("meId") REFERENCES "MeasurableElement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "files" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActivityResponse_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityResponse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SurveyProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "accreditationId" TEXT,
    "standardVersion" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "selectedChapters" TEXT NOT NULL DEFAULT '[]',
    "departments" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deadline" TEXT NOT NULL,
    "teamMembers" TEXT NOT NULL DEFAULT '[]',
    "overallScore" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SurveyProject_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SurveyProject_accreditationId_fkey" FOREIGN KEY ("accreditationId") REFERENCES "Accreditation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SurveyProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChapterScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterName" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "totalMes" INTEGER NOT NULL DEFAULT 0,
    "compliant" INTEGER NOT NULL DEFAULT 0,
    "partial" INTEGER NOT NULL DEFAULT 0,
    "nonCompliant" INTEGER NOT NULL DEFAULT 0,
    "notApplicable" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ChapterScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChapterScore_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "owner" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    CONSTRAINT "ProjectEvidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "standardVersion" TEXT NOT NULL,
    "chapterFilter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalMes" INTEGER NOT NULL DEFAULT 0,
    "processedMes" INTEGER NOT NULL DEFAULT 0,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "errorMessage" TEXT,
    CONSTRAINT "Assessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "meId" TEXT NOT NULL,
    "meCode" TEXT NOT NULL,
    "meText" TEXT NOT NULL,
    "aiScore" TEXT NOT NULL,
    "aiConfidence" REAL NOT NULL DEFAULT 0,
    "matchScore" REAL NOT NULL DEFAULT 0,
    "reviewerScore" TEXT,
    "reviewerComment" TEXT,
    "justification" TEXT NOT NULL DEFAULT '',
    "evidenceMissing" TEXT NOT NULL DEFAULT '[]',
    "gaps" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "ComplianceScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplianceScore_meId_fkey" FOREIGN KEY ("meId") REFERENCES "MeasurableElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complianceScoreId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "relevanceScore" REAL NOT NULL DEFAULT 0,
    "matchedSections" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "EvidenceMatch_complianceScoreId_fkey" FOREIGN KEY ("complianceScoreId") REFERENCES "ComplianceScore" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceMatch_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "meId" TEXT NOT NULL,
    "meCode" TEXT NOT NULL,
    "gapDescription" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "assignedDepartment" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorrectiveAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CorrectiveAction_meId_fkey" FOREIGN KEY ("meId") REFERENCES "MeasurableElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "category" TEXT NOT NULL DEFAULT 'policy',
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "MasterDocument_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MasterDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterDocMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterDocumentId" TEXT NOT NULL,
    "meId" TEXT NOT NULL,
    CONSTRAINT "MasterDocMapping_masterDocumentId_fkey" FOREIGN KEY ("masterDocumentId") REFERENCES "MasterDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MasterDocMapping_meId_fkey" FOREIGN KEY ("meId") REFERENCES "MeasurableElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standardId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "meCode" TEXT NOT NULL,
    "meId" TEXT,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'boolean',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT NOT NULL DEFAULT '[]',
    "value" TEXT,
    "evidenceFiles" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChecklistItem_meId_fkey" FOREIGN KEY ("meId") REFERENCES "MeasurableElement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'policy',
    "department" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT '',
    "filePath" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'active',
    "effectiveDate" TEXT,
    "reviewDate" TEXT,
    "owner" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PolicyMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "subStandardId" TEXT NOT NULL,
    CONSTRAINT "PolicyMapping_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CopilotConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CopilotMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CopilotMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CopilotConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CopilotMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "details" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentComparison" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userEvidenceId" TEXT NOT NULL,
    "masterDocumentId" TEXT NOT NULL,
    "matchingPercentage" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "overallSummary" TEXT NOT NULL DEFAULT '',
    "keyMatches" TEXT NOT NULL DEFAULT '[]',
    "gaps" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "detailedAnalysis" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "processedAt" DATETIME,
    CONSTRAINT "DocumentComparison_userEvidenceId_fkey" FOREIGN KEY ("userEvidenceId") REFERENCES "Evidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentComparison_masterDocumentId_fkey" FOREIGN KEY ("masterDocumentId") REFERENCES "MasterDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Accreditation_code_key" ON "Accreditation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_accreditationId_code_key" ON "Chapter"("accreditationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Standard_chapterId_code_key" ON "Standard"("chapterId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "MeasurableElement_code_key" ON "MeasurableElement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityResponse_activityId_projectId_key" ON "ActivityResponse"("activityId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterScore_projectId_chapterId_key" ON "ChapterScore"("projectId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEvidence_projectId_evidenceId_key" ON "ProjectEvidence"("projectId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterDocMapping_masterDocumentId_meId_key" ON "MasterDocMapping"("masterDocumentId", "meId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyMapping_policyId_subStandardId_key" ON "PolicyMapping"("policyId", "subStandardId");
