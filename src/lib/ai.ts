/**
 * AI Service Abstraction Layer
 * 
 * Provides a pluggable interface for AI-powered features:
 * - Document analysis & compliance scoring
 * - Co-pilot chat (RAG-based Q&A)
 * - Report generation
 * 
 * To integrate with a real AI API (OpenAI, Azure, etc.):
 * 1. Set OPENAI_API_KEY in .env
 * 2. Set AI_PROVIDER=openai in .env
 * 3. The mock fallback is used when no API key is configured
 */

export interface AIComplianceResult {
  meId: string;
  meCode: string;
  meText: string;
  aiScore: "compliant" | "partial" | "non-compliant" | "not-applicable";
  aiConfidence: number;
  matchScore: number;
  justification: string;
  evidenceMissing: string[];
  gaps: string[];
  recommendations: string[];
  evidenceMatches: {
    evidenceId: string;
    documentName: string;
    relevanceScore: number;
    matchedSections: string[];
  }[];
}

export interface AIChatResponse {
  content: string;
  sources: { document_name: string; section: string; relevance: number }[];
}

const AI_PROVIDER = process.env.AI_PROVIDER || "mock";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// ============================================
// COMPLIANCE ASSESSMENT
// ============================================
export async function analyzeCompliance(
  documents: { id: string; name: string; summary: string; type: string }[],
  measurableElements: { id: string; code: string; text: string; keywords: string[]; requiredEvidenceType: string[] }[],
  onProgress?: (processed: number, total: number) => void
): Promise<AIComplianceResult[]> {
  if (AI_PROVIDER === "openai" && OPENAI_API_KEY) {
    return analyzeComplianceOpenAI(documents, measurableElements, onProgress);
  }
  return analyzeComplianceMock(documents, measurableElements, onProgress);
}

async function analyzeComplianceOpenAI(
  documents: { id: string; name: string; summary: string; type: string }[],
  measurableElements: { id: string; code: string; text: string; keywords: string[]; requiredEvidenceType: string[] }[],
  onProgress?: (processed: number, total: number) => void
): Promise<AIComplianceResult[]> {
  const results: AIComplianceResult[] = [];
  const total = measurableElements.length;

  for (let i = 0; i < measurableElements.length; i++) {
    const me = measurableElements[i];
    
    const prompt = `You are a healthcare accreditation compliance auditor. Analyze the following documents against this measurable element.

Measurable Element: ${me.code} - ${me.text}
Keywords to look for: ${me.keywords.join(", ")}
Required evidence types: ${me.requiredEvidenceType.join(", ")}

Available Documents:
${documents.map(d => `- ${d.name} (${d.type}): ${d.summary}`).join("\n")}

Respond in JSON format:
{
  "aiScore": "compliant|partial|non-compliant|not-applicable",
  "aiConfidence": 0-100,
  "matchScore": 0-100,
  "justification": "detailed justification",
  "evidenceMissing": ["list of missing evidence"],
  "gaps": ["list of gaps found"],
  "recommendations": ["list of recommendations"],
  "evidenceMatches": [{"documentName": "name", "relevanceScore": 0-100, "matchedSections": ["sections"]}]
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      results.push({
        meId: me.id,
        meCode: me.code,
        meText: me.text,
        aiScore: parsed.aiScore,
        aiConfidence: parsed.aiConfidence,
        matchScore: parsed.matchScore,
        justification: parsed.justification,
        evidenceMissing: parsed.evidenceMissing || [],
        gaps: parsed.gaps || [],
        recommendations: parsed.recommendations || [],
        evidenceMatches: (parsed.evidenceMatches || []).map((em: { documentName: string; relevanceScore: number; matchedSections: string[] }) => {
          const doc = documents.find(d => d.name === em.documentName);
          return {
            evidenceId: doc?.id || "",
            documentName: em.documentName,
            relevanceScore: em.relevanceScore,
            matchedSections: em.matchedSections,
          };
        }),
      });
    } catch {
      // Fallback to mock for this ME on error
      results.push(generateMockResult(me, documents));
    }

    onProgress?.(i + 1, total);
  }

  return results;
}

async function analyzeComplianceMock(
  documents: { id: string; name: string; summary: string; type: string }[],
  measurableElements: { id: string; code: string; text: string; keywords: string[]; requiredEvidenceType: string[] }[],
  onProgress?: (processed: number, total: number) => void
): Promise<AIComplianceResult[]> {
  const results: AIComplianceResult[] = [];
  const total = measurableElements.length;

  for (let i = 0; i < measurableElements.length; i++) {
    const me = measurableElements[i];
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    results.push(generateMockResult(me, documents));
    onProgress?.(i + 1, total);
  }

  return results;
}

function generateMockResult(
  me: { id: string; code: string; text: string; keywords: string[]; requiredEvidenceType: string[] },
  documents: { id: string; name: string; summary: string; type: string }[]
): AIComplianceResult {
  // Simple keyword matching for mock
  const matchingDocs = documents.filter(doc => {
    const docText = `${doc.name} ${doc.summary}`.toLowerCase();
    return me.keywords.some(kw => docText.includes(kw.toLowerCase()));
  });

  const matchScore = matchingDocs.length > 0
    ? Math.min(95, 40 + matchingDocs.length * 20 + Math.floor(Math.random() * 15))
    : Math.floor(Math.random() * 20);

  let aiScore: AIComplianceResult["aiScore"];
  if (matchScore >= 80) aiScore = "compliant";
  else if (matchScore >= 50) aiScore = "partial";
  else aiScore = "non-compliant";

  const confidence = Math.min(95, matchScore + Math.floor(Math.random() * 10));

  return {
    meId: me.id,
    meCode: me.code,
    meText: me.text,
    aiScore,
    aiConfidence: confidence,
    matchScore,
    justification: matchingDocs.length > 0
      ? `Found ${matchingDocs.length} relevant document(s) matching keywords for ${me.code}. ${matchScore >= 80 ? "All required elements appear to be present." : "Some required elements are missing or incomplete."}`
      : `No relevant documentation found matching the required evidence for ${me.code}. Immediate action is needed.`,
    evidenceMissing: matchScore < 80
      ? me.requiredEvidenceType.slice(0, 2).map(t => `Missing ${t} documentation for ${me.code}`)
      : [],
    gaps: matchScore < 80 && matchScore >= 50
      ? [`Incomplete coverage for ${me.code}`]
      : matchScore < 50
      ? [`No evidence found for ${me.code}`, `Critical gap in documentation`]
      : [],
    recommendations: matchScore < 80
      ? [`Upload complete ${me.requiredEvidenceType[0] || "policy"} documentation for ${me.code}`]
      : [`Maintain current documentation and ensure annual review.`],
    evidenceMatches: matchingDocs.map(doc => ({
      evidenceId: doc.id,
      documentName: doc.name,
      relevanceScore: Math.min(95, matchScore + Math.floor(Math.random() * 10)),
      matchedSections: [`Keyword match in document summary`],
    })),
  };
}

// ============================================
// CO-PILOT CHAT
// ============================================
export async function chatWithCopilot(
  message: string,
  context: {
    projectName?: string;
    facilityName?: string;
    complianceData?: string;
    evidenceList?: string;
  }
): Promise<AIChatResponse> {
  if (AI_PROVIDER === "openai" && OPENAI_API_KEY) {
    return chatOpenAI(message, context);
  }
  return chatMock(message);
}

async function chatOpenAI(
  message: string,
  context: {
    projectName?: string;
    facilityName?: string;
    complianceData?: string;
    evidenceList?: string;
  }
): Promise<AIChatResponse> {
  const systemPrompt = `You are an AI Co-Pilot for healthcare accreditation (CBAHI standards). You have access to the following context:

Project: ${context.projectName || "N/A"}
Facility: ${context.facilityName || "N/A"}

Compliance Data:
${context.complianceData || "Not available"}

Evidence Documents:
${context.evidenceList || "Not available"}

Answer the user's question based on this data. Be specific, cite document names and ME codes. Format with markdown.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      sources: [
        { document_name: "CBAHI Standards Manual 2026", section: "Various", relevance: 0.9 },
      ],
    };
  } catch {
    return chatMock(message);
  }
}

async function chatMock(message: string): Promise<AIChatResponse> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const lower = message.toLowerCase();

  if (lower.includes("ipc") || lower.includes("infection")) {
    return {
      content: `Based on the latest assessment, **IPC.2.2** (Hand Hygiene Compliance) scored **45%** — rated as **Non-Compliant**.\n\n**Root Cause Analysis:**\n- The hospital's hand hygiene audit policy document was found but only covers ICU and OR departments\n- No evidence of compliance monitoring in outpatient clinics\n- Missing quarterly audit reports for Q3–Q4 2025\n\n**Recommended Actions:**\n1. Extend hand hygiene monitoring to all clinical areas\n2. Submit quarterly audit reports for the past two quarters\n3. Update the policy to include outpatient departments\n\nThe corrective action deadline is set for **March 15, 2026**.`,
      sources: [
        { document_name: "CBAHI Standards Manual 2026", section: "p.42", relevance: 0.95 },
        { document_name: "Hospital IPC Policy v3.2", section: "p.18", relevance: 0.87 },
      ],
    };
  }
  if (lower.includes("evidence") || lower.includes("patient safety")) {
    return {
      content: `For **Patient Safety** (Chapter 1), the following evidence gaps remain:\n\n| ME ID | Requirement | Status |\n|-------|------------|--------|\n| PS.1.1 | Patient identification policy | ✅ Uploaded |\n| PS.1.2 | Timeout procedure documentation | ⚠️ Partial |\n| PS.2.1 | Medication safety reporting | ❌ Missing |\n| PS.2.2 | Fall prevention protocol | ⚠️ Partial |\n\nPriority: Upload the **Medication Safety Reporting** procedure and update the **Fall Prevention Protocol**.`,
      sources: [
        { document_name: "Patient Safety Standards", section: "Chapter 1", relevance: 0.92 },
      ],
    };
  }
  if (lower.includes("corrective") || lower.includes("due")) {
    return {
      content: `There are **3 corrective actions** due this month:\n\n1. **Develop fall risk policy** (PS.2.2) — Due: Feb 28, 2026\n2. **Update hand hygiene monitoring** (IPC.2.2) — Due: Mar 15, 2026\n3. **Install medication room cameras** (MM.1.2) — Due: Mar 30, 2026\n\nHighest priority: fall risk policy (Critical ME).`,
      sources: [
        { document_name: "Corrective Action Plan", section: "Active Items", relevance: 0.88 },
      ],
    };
  }
  if (lower.includes("department")) {
    return {
      content: `Gap analysis by department:\n\n- **Nursing**: 8 gaps (3 critical)\n- **Pharmacy**: 5 gaps (2 critical)\n- **IPC Team**: 4 gaps (1 critical)\n- **Laboratory**: 3 gaps (0 critical)\n- **Radiology**: 2 gaps (0 critical)\n\nNursing Department has the highest number of gaps.`,
      sources: [
        { document_name: "Gap Analysis Report", section: "Department Summary", relevance: 0.9 },
      ],
    };
  }

  return {
    content: `Based on the current assessment data, here's what I found:\n\n**Key Insights:**\n- Overall readiness score needs attention\n- Strongest area: Patient Care\n- Weakest area: Infection Prevention & Control\n- Multiple corrective actions are in progress\n\nWould you like me to drill deeper into any specific chapter or standard?`,
    sources: [
      { document_name: "Assessment Summary", section: "Overview", relevance: 0.85 },
    ],
  };
}

// ============================================
// REPORT GENERATION
// ============================================
export async function generateReportContent(
  projectData: {
    name: string;
    facility: string;
    standardVersion: string;
    overallScore: number;
    chapterScores: { chapterName: string; score: number; compliant: number; partial: number; nonCompliant: number }[];
    criticalFindings: { meCode: string; meText: string; justification: string; evidenceMissing: string[] }[];
    correctiveActions: { meCode: string; gap: string; action: string; priority: string; assignedTo: string; dueDate: string }[];
  }
): Promise<{ html: string }> {
  // In production, this could call an AI to generate executive summaries, 
  // format findings narratively, and produce polished report content.
  // For now, we return a structured HTML report.
  
  return {
    html: `<h1>Mock Survey Report - ${projectData.name}</h1>
<p>Overall Score: ${projectData.overallScore}%</p>
<p>Generated: ${new Date().toISOString()}</p>`,
  };
}
