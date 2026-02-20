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
