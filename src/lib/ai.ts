/**
 * AI Service Abstraction Layer
 * 
 * Provides a pluggable interface for AI-powered features:
 * - Document analysis & compliance scoring
 * - Document comparison & matching
 * - Co-pilot chat (RAG-based Q&A)
 * - Report generation
 * 
 * Supported providers:
 * 1. GEMINI: Set GEMINI_API_KEY in .env
 * 2. OpenAI: Set OPENAI_API_KEY and AI_PROVIDER=openai in .env
 * 3. Mock: Used as fallback when no API key is configured
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

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

export interface DocumentComparisonResult {
  matchingPercentage: number;
  overallSummary: string;
  keyMatches: string[];
  gaps: string[];
  recommendations: string[];
  detailedAnalysis: string;
  usage: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  isEstimate: boolean;
  provider: "openai" | "gemini" | "heuristic" | "estimate";
  model?: string;
  inputTokens?: InputTokenBreakdown;
}

interface InputTokenBreakdown {
  userDocumentTokens: number;
  masterDocumentTokens: number;
  standardTokens: number;
}

const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Initialize Gemini Client
const getGeminiClient = () => {
  if (GEMINI_API_KEY) {
    return new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return null;
};

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
// DOCUMENT COMPARISON & MATCHING
// ============================================
export async function compareDocuments(
  userDocument: { id: string; name: string; content: string; summary: string },
  masterDocument: { id: string; name: string; content: string; description: string },
  standard?: { name: string; description: string }
): Promise<DocumentComparisonResult> {
  const geminiClient = getGeminiClient();
  
  if (geminiClient && GEMINI_API_KEY) {
    return compareDocumentsGemini(userDocument, masterDocument, standard);
  } else if (OPENAI_API_KEY) {
    return compareDocumentsOpenAI(userDocument, masterDocument, standard);
  }
  
  return compareDocumentsHeuristic(userDocument, masterDocument, standard);
}

async function compareDocumentsGemini(
  userDocument: { id: string; name: string; content: string; summary: string },
  masterDocument: { id: string; name: string; content: string; description: string },
  standard?: { name: string; description: string }
): Promise<DocumentComparisonResult> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a healthcare compliance expert. Compare the following two documents and analyze how well the user-submitted document matches with the master (reference) document from administration.

STANDARD/CONTEXT: ${standard ? `${standard.name} - ${standard.description}` : "Healthcare compliance standard"}

MASTER DOCUMENT (Reference/Admin-provided):
Name: ${masterDocument.name}
Description: ${masterDocument.description}
Content: ${masterDocument.content}

USER DOCUMENT (To be compared):
Name: ${userDocument.name}
Summary: ${userDocument.summary}
Content: ${userDocument.content}

Please provide a detailed analysis in JSON format with the following structure:
{
  "matchingPercentage": 0-100,
  "overallSummary": "One paragraph summary of how well the documents match",
  "keyMatches": ["List of specific sections or requirements that are well-covered"],
  "gaps": ["List of sections or requirements that are missing or insufficient"],
  "recommendations": ["List of actionable recommendations to improve alignment"],
  "detailedAnalysis": "A detailed paragraph-style analysis of the comparison, highlighting strengths and weaknesses"
}

Be specific and reference actual content from both documents. Focus on compliance relevance and coverage of required elements.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const inputTokens = estimateInputTokens(userDocument, masterDocument, standard);
    const usageMetadata = (response as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } }).usageMetadata;
    const usage = usageMetadata
      ? buildUsageFromActual(
          usageMetadata.promptTokenCount || 0,
          usageMetadata.candidatesTokenCount || 0,
          usageMetadata.totalTokenCount,
          "gemini",
          "gemini-2.5-flash",
          inputTokens
        )
      : buildUsageFromEstimate(prompt, responseText, "gemini", "gemini-2.5-flash", inputTokens);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      matchingPercentage: Math.min(100, Math.max(0, parsed.matchingPercentage || 0)),
      overallSummary: parsed.overallSummary || "",
      keyMatches: parsed.keyMatches || [],
      gaps: parsed.gaps || [],
      recommendations: parsed.recommendations || [],
      detailedAnalysis: parsed.detailedAnalysis || "",
      usage,
    };
  } catch (error) {
    console.error("Gemini document comparison error:", error);
    // Fallback to mock if Gemini fails
    return compareDocumentsHeuristic(userDocument, masterDocument, standard);
  }
}

async function compareDocumentsOpenAI(
  userDocument: { id: string; name: string; content: string; summary: string },
  masterDocument: { id: string; name: string; content: string; description: string },
  standard?: { name: string; description: string }
): Promise<DocumentComparisonResult> {
  try {
    const prompt = `You are a healthcare compliance expert. Compare the following two documents and analyze how well the user-submitted document matches with the master (reference) document from administration.

STANDARD/CONTEXT: ${standard ? `${standard.name} - ${standard.description}` : "Healthcare compliance standard"}

MASTER DOCUMENT (Reference/Admin-provided):
Name: ${masterDocument.name}
Description: ${masterDocument.description}
Content: ${masterDocument.content}

USER DOCUMENT (To be compared):
Name: ${userDocument.name}
Summary: ${userDocument.summary}
Content: ${userDocument.content}

Please provide a detailed analysis in JSON format with the following structure:
{
  "matchingPercentage": 0-100,
  "overallSummary": "One paragraph summary of how well the documents match",
  "keyMatches": ["List of specific sections or requirements that are well-covered"],
  "gaps": ["List of sections or requirements that are missing or insufficient"],
  "recommendations": ["List of actionable recommendations to improve alignment"],
  "detailedAnalysis": "A detailed paragraph-style analysis of the comparison, highlighting strengths and weaknesses"
}`;

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
    const inputTokens = estimateInputTokens(userDocument, masterDocument, standard);
    const usage = data.usage
      ? buildUsageFromActual(
          data.usage.prompt_tokens || 0,
          data.usage.completion_tokens || 0,
          data.usage.total_tokens,
          "openai",
          OPENAI_MODEL,
          inputTokens
        )
      : buildUsageFromEstimate(prompt, data.choices[0].message.content, "openai", OPENAI_MODEL, inputTokens);

    return {
      matchingPercentage: Math.min(100, Math.max(0, parsed.matchingPercentage || 0)),
      overallSummary: parsed.overallSummary || "",
      keyMatches: parsed.keyMatches || [],
      gaps: parsed.gaps || [],
      recommendations: parsed.recommendations || [],
      detailedAnalysis: parsed.detailedAnalysis || "",
      usage,
    };
  } catch (error) {
    console.error("OpenAI document comparison error:", error);
    return compareDocumentsHeuristic(userDocument, masterDocument, standard);
  }
}

export function estimateDocumentComparisonUsage(
  userDocument: { id: string; name: string; content: string; summary: string },
  masterDocument: { id: string; name: string; content: string; description: string },
  standard?: { name: string; description: string }
): TokenUsage {
  const inputTokens = estimateInputTokens(userDocument, masterDocument, standard);
  const promptTokens =
    inputTokens.userDocumentTokens +
    inputTokens.masterDocumentTokens +
    inputTokens.standardTokens;

  return {
    promptTokens,
    completionTokens: 0,
    totalTokens: promptTokens,
    isEstimate: true,
    provider: "estimate",
    inputTokens,
  };
}

function compareDocumentsHeuristic(
  userDocument: { id: string; name: string; content: string; summary: string },
  masterDocument: { id: string; name: string; content: string; description: string },
  standard?: { name: string; description: string }
): DocumentComparisonResult {
  const userText = buildComparisonText(userDocument.content, userDocument.summary);
  const masterText = buildComparisonText(
    masterDocument.content,
    masterDocument.description
  );

  const userTokens = tokenize(userText);
  const masterTokens = tokenize(masterText);

  const masterTopTerms = getTopTerms(masterTokens, 20);
  const termCoverage =
    masterTopTerms.length === 0
      ? 0
      : Math.round(
          (masterTopTerms.filter((t) => userTokens.includes(t)).length /
            masterTopTerms.length) *
            100
        );

  const cosineScore = Math.round(
    cosineSimilarity(userTokens, masterTokens) * 100
  );

  const matchingPercentage = clamp(
    Math.round(termCoverage * 0.6 + cosineScore * 0.4),
    0,
    100
  );

  const requirementSentences = extractRequirementSentences(masterText, 8);
  const { keyMatches, gaps } = classifyRequirementCoverage(
    requirementSentences,
    userTokens
  );

  const recommendations = buildRecommendations(gaps);

  const summaryTone =
    matchingPercentage >= 80
      ? "aligns strongly"
      : matchingPercentage >= 50
      ? "partially aligns"
      : "has limited alignment";

  return {
    matchingPercentage,
    overallSummary: `The user document "${userDocument.name}" ${summaryTone} with the master document "${masterDocument.name}" based on requirement coverage and terminology overlap.`,
    keyMatches,
    gaps,
    recommendations,
    detailedAnalysis: `Scoring is based on coverage of key master terms (${termCoverage}%) and overall semantic overlap (${cosineScore}%). Requirement sentences in the master document were checked against the user document for evidence of coverage. Focus updates on any gaps to improve alignment.`,
    usage: {
      ...estimateDocumentComparisonUsage(userDocument, masterDocument, standard),
      provider: "heuristic",
    },
  };
}

function buildComparisonText(primary: string, secondary?: string): string {
  const combined = `${primary || ""}\n${secondary || ""}`.trim();
  return combined.length > 0 ? combined : "";
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function getTopTerms(tokens: string[], limit: number): string[] {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function cosineSimilarity(aTokens: string[], bTokens: string[]): number {
  if (aTokens.length === 0 || bTokens.length === 0) return 0;

  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();

  for (const token of aTokens) {
    freqA.set(token, (freqA.get(token) || 0) + 1);
  }
  for (const token of bTokens) {
    freqB.set(token, (freqB.get(token) || 0) + 1);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [token, countA] of Array.from(freqA.entries())) {
    const countB = freqB.get(token) || 0;
    dot += countA * countB;
    magA += countA * countA;
  }
  for (const countB of Array.from(freqB.values())) {
    magB += countB * countB;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function extractRequirementSentences(text: string, limit: number): string[] {
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const requirement = sentences.filter((s) =>
    /\b(must|shall|required|should|ensure|document|procedure|policy)\b/i.test(s)
  );

  const selected = requirement.length > 0 ? requirement : sentences;
  return selected.slice(0, limit);
}

function classifyRequirementCoverage(
  requirementSentences: string[],
  userTokens: string[]
): { keyMatches: string[]; gaps: string[] } {
  const keyMatches: string[] = [];
  const gaps: string[] = [];

  for (const sentence of requirementSentences) {
    const sentenceTokens = tokenize(sentence);
    const hits = sentenceTokens.filter((t) => userTokens.includes(t));
    if (sentenceTokens.length === 0) continue;

    const coverageRatio = hits.length / sentenceTokens.length;
    if (coverageRatio >= 0.35) {
      keyMatches.push(sentence);
    } else {
      gaps.push(sentence);
    }
  }

  return {
    keyMatches: keyMatches.slice(0, 6),
    gaps: gaps.slice(0, 6),
  };
}

function buildRecommendations(gaps: string[]): string[] {
  if (gaps.length === 0) {
    return [
      "Maintain current documentation and review annually for updates.",
    ];
  }

  return gaps.slice(0, 5).map((gap, index) => {
    const label = gap.length > 80 ? `${gap.slice(0, 77)}...` : gap;
    return `Address gap ${index + 1}: ${label}`;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function estimateInputTokens(
  userDocument: { content: string; summary: string },
  masterDocument: { content: string; description: string },
  standard?: { name: string; description: string }
): InputTokenBreakdown {
  const userText = buildComparisonText(userDocument.content, userDocument.summary);
  const masterText = buildComparisonText(
    masterDocument.content,
    masterDocument.description
  );
  const standardText = standard
    ? buildComparisonText(standard.name, standard.description)
    : "";

  return {
    userDocumentTokens: estimateTokensFromText(userText),
    masterDocumentTokens: estimateTokensFromText(masterText),
    standardTokens: estimateTokensFromText(standardText),
  };
}

function buildUsageFromEstimate(
  prompt: string,
  responseText: string,
  provider: TokenUsage["provider"],
  model: string,
  inputTokens?: InputTokenBreakdown
): TokenUsage {
  const promptTokens = estimateTokensFromText(prompt);
  const completionTokens = estimateTokensFromText(responseText);

  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    isEstimate: true,
    provider,
    model,
    inputTokens,
  };
}

function buildUsageFromActual(
  promptTokens: number,
  completionTokens: number,
  totalTokens: number | undefined,
  provider: TokenUsage["provider"],
  model: string,
  inputTokens?: InputTokenBreakdown
): TokenUsage {
  const total = totalTokens ?? promptTokens + completionTokens;

  return {
    promptTokens,
    completionTokens,
    totalTokens: total,
    isEstimate: false,
    provider,
    model,
    inputTokens,
  };
}

// ============================================
// POLICY vs DOCUMENT SELF-ASSESSMENT (multi-policy scoring)
// ============================================
export interface PolicyModuleBreakdown {
  module: string;
  submodule?: string;
  score: number;
  notes: string;
}

export interface PerPolicyScore {
  policyId: string;
  policyName: string;
  score: number;
  moduleBreakdown: PolicyModuleBreakdown[];
  goodPoints: string[];
  badPoints: string[];
  improvements: string[];
}

export interface PolicyComplianceReport {
  reportId: string;
  documentName: string;
  analyzedAt: string;
  perPolicyScores: PerPolicyScore[];
  combinedScore: number;
  overallGoodPoints: string[];
  overallBadPoints: string[];
  overallImprovements: string[];
  aiSummary: string;
}

export async function analyzePolicyCompliance(
  userDocument: { name: string; content: string },
  policies: { id: string; name: string; description: string; category: string; content: string }[]
): Promise<Omit<PolicyComplianceReport, "reportId" | "documentName" | "analyzedAt">> {
  if (policies.length === 0) {
    return {
      perPolicyScores: [],
      combinedScore: 0,
      overallGoodPoints: [],
      overallBadPoints: [],
      overallImprovements: [],
      aiSummary: "No policies selected for comparison.",
    };
  }
  const geminiClient = getGeminiClient();
  if (geminiClient && GEMINI_API_KEY) {
    return analyzePolicyComplianceGemini(userDocument, policies);
  }
  if (OPENAI_API_KEY) {
    return analyzePolicyComplianceOpenAI(userDocument, policies);
  }
  return analyzePolicyComplianceMock(userDocument, policies);
}

function buildPolicyCompliancePrompt(
  userDocument: { name: string; content: string },
  policies: { id: string; name: string; description: string; category: string; content: string }[]
): string {
  const policiesBlock = policies
    .map(
      (p) =>
        `--- POLICY: ${p.name} (ID: ${p.id}, Category: ${p.category}) ---\nDescription: ${p.description}\nContent:\n${(p.content || "").slice(0, 15000)}\n`
    )
    .join("\n");

  return `You are an expert healthcare accreditation auditor. Analyze the following SELF-ASSESSMENT DOCUMENT against each of the given STANDARD POLICIES.

SELF-ASSESSMENT DOCUMENT (uploaded by facility):
Name: ${userDocument.name}
Content:
${userDocument.content.slice(0, 25000)}

STANDARD POLICIES (reference documents to map against):
${policiesBlock}

For EACH policy, you must:
1. Go through the policy document module by module and submodule (sections, clauses, requirements).
2. Compare the self-assessment document content against that policy and assign a score 0-100 for that policy.
3. List specific good points (what aligns well), bad points (gaps/non-compliance), and scope for improvement.
4. Provide a brief module-level breakdown: for each logical module/section in the policy, give a score and short notes.

Then provide:
- A COMBINED score (0-100) across all selected policies (weighted average or your judgment).
- Overall good points, bad points, and improvements across all policies.
- A concise AI SUMMARY (2-4 paragraphs) for leadership.

Respond with ONLY valid JSON in this exact structure (no markdown, no extra text):
{
  "perPolicyScores": [
    {
      "policyId": "<id>",
      "policyName": "<name>",
      "score": 0-100,
      "moduleBreakdown": [
        { "module": "Section name", "submodule": "Subsection if any", "score": 0-100, "notes": "Brief note" }
      ],
      "goodPoints": ["point1", "point2"],
      "badPoints": ["point1", "point2"],
      "improvements": ["action1", "action2"]
    }
  ],
  "combinedScore": 0-100,
  "overallGoodPoints": ["point1", "point2"],
  "overallBadPoints": ["point1", "point2"],
  "overallImprovements": ["action1", "action2"],
  "aiSummary": "Multi-paragraph executive summary."
}

Be precise, professional, and reference specific sections of both documents.`;
}

async function analyzePolicyComplianceGemini(
  userDocument: { name: string; content: string },
  policies: { id: string; name: string; description: string; category: string; content: string }[]
): Promise<Omit<PolicyComplianceReport, "reportId" | "documentName" | "analyzedAt">> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = buildPolicyCompliancePrompt(userDocument, policies);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");
  const parsed = JSON.parse(jsonMatch[0]);
  return normalizePolicyReport(parsed, policies);
}

async function analyzePolicyComplianceOpenAI(
  userDocument: { name: string; content: string },
  policies: { id: string; name: string; description: string; category: string; content: string }[]
): Promise<Omit<PolicyComplianceReport, "reportId" | "documentName" | "analyzedAt">> {
  const prompt = buildPolicyCompliancePrompt(userDocument, policies);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no content");
  const parsed = JSON.parse(content);
  return normalizePolicyReport(parsed, policies);
}

function normalizePolicyReport(
  parsed: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for API consistency
  policies: { id: string; name: string }[]
): Omit<PolicyComplianceReport, "reportId" | "documentName" | "analyzedAt"> {
  const perPolicyScores = (parsed.perPolicyScores as PerPolicyScore[] || []).map((p) => ({
    policyId: p.policyId || "",
    policyName: p.policyName || "",
    score: Math.min(100, Math.max(0, Number(p.score) || 0)),
    moduleBreakdown: Array.isArray(p.moduleBreakdown)
      ? p.moduleBreakdown.map((m) => ({
          module: m.module || "",
          submodule: m.submodule,
          score: Math.min(100, Math.max(0, Number(m.score) || 0)),
          notes: m.notes || "",
        }))
      : [],
    goodPoints: Array.isArray(p.goodPoints) ? p.goodPoints : [],
    badPoints: Array.isArray(p.badPoints) ? p.badPoints : [],
    improvements: Array.isArray(p.improvements) ? p.improvements : [],
  }));
  const combinedScore = Math.min(100, Math.max(0, Number(parsed.combinedScore) ?? 0));
  return {
    perPolicyScores,
    combinedScore,
    overallGoodPoints: Array.isArray(parsed.overallGoodPoints) ? parsed.overallGoodPoints : [],
    overallBadPoints: Array.isArray(parsed.overallBadPoints) ? parsed.overallBadPoints : [],
    overallImprovements: Array.isArray(parsed.overallImprovements) ? parsed.overallImprovements : [],
    aiSummary: typeof parsed.aiSummary === "string" ? parsed.aiSummary : "",
  };
}

function analyzePolicyComplianceMock(
  userDocument: { name: string; content: string },
  policies: { id: string; name: string; description: string }[]
): Omit<PolicyComplianceReport, "reportId" | "documentName" | "analyzedAt"> {
  const perPolicyScores: PerPolicyScore[] = policies.map((p, i) => ({
    policyId: p.id,
    policyName: p.name,
    score: 72 + (i % 3) * 8,
    moduleBreakdown: [
      { module: "Scope & Purpose", submodule: "Definitions", score: 85, notes: "Clearly defined." },
      { module: "Responsibilities", submodule: undefined, score: 70, notes: "Some roles not specified." },
      { module: "Procedures", submodule: undefined, score: 68, notes: "Steps could be more detailed." },
    ],
    goodPoints: ["Document aligns with policy intent.", "Key terms are used consistently."],
    badPoints: ["Missing evidence of annual review.", "One procedure step not documented."],
    improvements: ["Add review dates.", "Document the missing procedure step."],
  }));
  const combinedScore = Math.round(
    perPolicyScores.reduce((s, p) => s + p.score, 0) / (perPolicyScores.length || 1)
  );
  return {
    perPolicyScores,
    combinedScore,
    overallGoodPoints: ["Strong alignment on core requirements.", "Good use of standard terminology."],
    overallBadPoints: ["Review cycle not evidenced.", "Some procedures lack detail."],
    overallImprovements: ["Evidence annual review.", "Complete procedure documentation."],
    aiSummary: `This self-assessment document was analyzed against ${policies.length} policy/policies. Combined compliance score: ${combinedScore}%. The document shows good alignment in several areas; focus on documenting review cycles and filling procedure gaps to improve scores.`,
  };
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "such",
  "their",
  "they",
  "are",
  "was",
  "were",
  "been",
  "being",
  "will",
  "shall",
  "must",
  "should",
  "may",
  "can",
  "has",
  "have",
  "had",
  "not",
  "but",
  "you",
  "your",
  "our",
  "all",
  "any",
  "each",
  "per",
  "use",
  "used",
  "using",
  "also",
  "more",
  "than",
  "then",
  "when",
  "where",
  "which",
  "what",
  "who",
  "whom",
  "why",
  "how",
]);

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
