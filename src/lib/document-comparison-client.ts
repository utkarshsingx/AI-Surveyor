/**
 * Document Comparison API Client
 * 
 * Utility functions for interacting with the document comparison API
 * from client-side components.
 */

export interface ComparisonResult {
  id: string;
  userEvidenceId: string;
  masterDocumentId: string;
  matchingPercentage: number;
  status: "pending" | "processing" | "completed" | "failed";
  overallSummary: string;
  keyMatches: string[];
  gaps: string[];
  recommendations: string[];
  detailedAnalysis: string;
  createdAt: string;
  completedAt: string | null;
  userEvidence?: {
    id: string;
    documentName: string;
    type: string;
    department: string;
  };
  masterDocument?: {
    id: string;
    name: string;
    category: string;
  };
}

/**
 * Compare two documents
 * @param userEvidenceId - ID of user-uploaded evidence document
 * @param masterDocumentId - ID of admin master document
 * @returns Comparison result with matching percentage and analysis
 */
export async function compareDocuments(
  userEvidenceId: string,
  masterDocumentId: string
): Promise<ComparisonResult> {
  const response = await fetch("/api/document-comparison/compare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userEvidenceId,
      masterDocumentId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to compare documents");
  }

  return response.json();
}

/**
 * Get a specific comparison result
 * @param comparisonId - ID of the comparison to retrieve
 * @returns Comparison result details
 */
export async function getComparison(comparisonId: string): Promise<ComparisonResult> {
  const response = await fetch(`/api/document-comparison/${comparisonId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch comparison");
  }

  return response.json();
}

/**
 * List comparisons with optional filters
 * @param filters - Optional filter parameters
 * @returns List of comparisons
 */
export async function listComparisons(filters?: {
  userEvidenceId?: string;
  masterDocumentId?: string;
  status?: "pending" | "processing" | "completed" | "failed";
}): Promise<{
  count: number;
  comparisons: ComparisonResult[];
}> {
  const params = new URLSearchParams();

  if (filters?.userEvidenceId) {
    params.append("userEvidenceId", filters.userEvidenceId);
  }
  if (filters?.masterDocumentId) {
    params.append("masterDocumentId", filters.masterDocumentId);
  }
  if (filters?.status) {
    params.append("status", filters.status);
  }

  const query = params.toString();
  const url = query ? `/api/document-comparison?${query}` : "/api/document-comparison";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch comparisons");
  }

  return response.json();
}

/**
 * Delete a comparison record
 * @param comparisonId - ID of the comparison to delete
 */
export async function deleteComparison(comparisonId: string): Promise<void> {
  const response = await fetch(`/api/document-comparison/${comparisonId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete comparison");
  }
}

/**
 * Get comparisons for a specific user evidence
 * @param userEvidenceId - ID of the user evidence
 * @returns List of comparisons for that evidence
 */
export async function getComparisonsByEvidence(
  userEvidenceId: string
): Promise<ComparisonResult[]> {
  const result = await listComparisons({ userEvidenceId });
  return result.comparisons;
}

/**
 * Get comparisons for a specific master document
 * @param masterDocumentId - ID of the master document
 * @returns List of comparisons for that master document
 */
export async function getComparisonsByMasterDoc(
  masterDocumentId: string
): Promise<ComparisonResult[]> {
  const result = await listComparisons({ masterDocumentId });
  return result.comparisons;
}

/**
 * Watch for comparison completion
 * @param comparisonId - ID of comparison to watch
 * @param maxWaitMs - Maximum time to wait (default: 60000ms)
 * @param pollInterval - Polling interval (default: 1000ms)
 */
export async function waitForComparison(
  comparisonId: string,
  maxWaitMs: number = 60000,
  pollInterval: number = 1000
): Promise<ComparisonResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const comparison = await getComparison(comparisonId);

    if (comparison.status === "completed" || comparison.status === "failed") {
      return comparison;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Comparison timeout");
}

/**
 * Format matching percentage for display
 * @param percentage - The matching percentage (0-100)
 * @returns Formatted string with emoji and color
 */
export function formatMatchingPercentage(percentage: number): {
  emoji: string;
  label: string;
  color: string;
} {
  if (percentage >= 80) {
    return {
      emoji: "✅",
      label: "Excellent Match",
      color: "text-green-600",
    };
  }
  if (percentage >= 50) {
    return {
      emoji: "⚠️",
      label: "Moderate Match",
      color: "text-yellow-600",
    };
  }
  return {
    emoji: "❌",
    label: "Poor Match",
    color: "text-red-600",
  };
}

/**
 * Export comparison result as JSON
 * @param comparison - The comparison result to export
 */
export function exportComparisonAsJSON(comparison: ComparisonResult): void {
  const dataStr = JSON.stringify(comparison, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `comparison_${comparison.id}_${new Date()
    .toISOString()
    .split(".")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

/**
 * Export comparison result as CSV
 * @param comparison - The comparison result to export
 */
export function exportComparisonAsCSV(comparison: ComparisonResult): void {
  const csvContent = [
    ["Field", "Value"],
    ["Comparison ID", comparison.id],
    ["Matching Percentage", comparison.matchingPercentage.toString()],
    ["Status", comparison.status],
    ["User Evidence", comparison.userEvidence?.documentName || "N/A"],
    ["Master Document", comparison.masterDocument?.name || "N/A"],
    ["Overall Summary", comparison.overallSummary],
    ["Key Matches", comparison.keyMatches.join("; ")],
    ["Gaps", comparison.gaps.join("; ")],
    ["Recommendations", comparison.recommendations.join("; ")],
    ["Created Date", new Date(comparison.createdAt).toLocaleString()],
    [
      "Completed Date",
      comparison.completedAt
        ? new Date(comparison.completedAt).toLocaleString()
        : "N/A",
    ],
  ]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const dataUri =
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);

  const exportFileDefaultName = `comparison_${comparison.id}_${new Date()
    .toISOString()
    .split(".")[0]}.csv`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}
