-- CreateTable
CREATE TABLE "StandardScore" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "standardCode" TEXT NOT NULL,
    "standardName" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMes" INTEGER NOT NULL DEFAULT 0,
    "compliant" INTEGER NOT NULL DEFAULT 0,
    "partial" INTEGER NOT NULL DEFAULT 0,
    "nonCompliant" INTEGER NOT NULL DEFAULT 0,
    "notApplicable" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StandardScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StandardScore_projectId_standardId_key" ON "StandardScore"("projectId", "standardId");

-- AddForeignKey
ALTER TABLE "StandardScore" ADD CONSTRAINT "StandardScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SurveyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardScore" ADD CONSTRAINT "StandardScore_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "Standard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
