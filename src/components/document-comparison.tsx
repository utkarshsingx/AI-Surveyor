"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ComparisonResult {
  id: string;
  userEvidenceId: string;
  masterDocumentId: string;
  matchingPercentage: number;
  status: string;
  overallSummary: string;
  keyMatches: string[];
  gaps: string[];
  recommendations: string[];
  detailedAnalysis: string;
  createdAt: string;
  completedAt: string | null;
  userEvidence: {
    id: string;
    documentName: string;
    type: string;
    department: string;
  };
  masterDocument: {
    id: string;
    name: string;
    category: string;
  };
}

interface DocumentComparisonProps {
  userEvidences: Array<{
    id: string;
    documentName: string;
    type: string;
    department: string;
  }>;
  masterDocuments: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  onComparison?: (result: ComparisonResult) => void;
}

export function DocumentComparison({
  userEvidences,
  masterDocuments,
  onComparison,
}: DocumentComparisonProps) {
  const [userEvidenceId, setUserEvidenceId] = useState<string>("");
  const [masterDocumentId, setMasterDocumentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleCompare = async () => {
    if (!userEvidenceId || !masterDocumentId) {
      setError("Please select both documents");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/document-comparison/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEvidenceId,
          masterDocumentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Comparison failed");
      }

      const data = await response.json();
      setResult(data);
      onComparison?.(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to perform comparison"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getMatchIcon = (percentage: number) => {
    if (percentage >= 80)
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (percentage >= 50)
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Compare Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* User Evidence Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              User Uploaded Document
            </label>
            <select
              value={userEvidenceId}
              onChange={(e) => setUserEvidenceId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              <option value="">Select a document...</option>
              {userEvidences.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.documentName} ({doc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Master Document Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Master Reference Document
            </label>
            <select
              value={masterDocumentId}
              onChange={(e) => setMasterDocumentId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              <option value="">Select a document...</option>
              {masterDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleCompare}
          disabled={loading || !userEvidenceId || !masterDocumentId}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            "Compare Documents"
          )}
        </Button>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Comparison Report</h3>

            {/* Matching Score */}
            <div className={`p-6 rounded-lg mb-6 ${getMatchColor(result.matchingPercentage)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getMatchIcon(result.matchingPercentage)}
                  <div>
                    <p className="text-sm opacity-75">Matching Score</p>
                    <p className="text-4xl font-bold">
                      {result.matchingPercentage}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {result.matchingPercentage >= 80 && (
                    <Badge variant="outline" className="bg-green-50">
                      Excellent Match
                    </Badge>
                  )}
                  {result.matchingPercentage >= 50 &&
                    result.matchingPercentage < 80 && (
                      <Badge variant="outline" className="bg-yellow-50">
                        Moderate Match
                      </Badge>
                    )}
                  {result.matchingPercentage < 50 && (
                    <Badge variant="outline" className="bg-red-50">
                      Poor Match
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Overall Summary</h4>
              <p className="text-gray-700">{result.overallSummary}</p>
            </div>

            {/* Key Matches */}
            {result.keyMatches.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-green-700 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Key Matches ({result.keyMatches.length})
                </h4>
                <ul className="space-y-2">
                  {result.keyMatches.map((match, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-700">
                      <span className="text-green-600 font-bold">✓</span>
                      {match}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-red-700 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Gaps Identified ({result.gaps.length})
                </h4>
                <ul className="space-y-2">
                  {result.gaps.map((gap, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-700">
                      <span className="text-red-600 font-bold">✗</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-blue-700 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Recommendations ({result.recommendations.length})
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-700">
                      <span className="text-blue-600 font-bold">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Analysis */}
            <div>
              <h4 className="font-semibold mb-2">Detailed Analysis</h4>
              <p className="text-gray-700 leading-relaxed">
                {result.detailedAnalysis}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t text-sm text-gray-500">
            <p>
              Report generated:{" "}
              {new Date(result.createdAt).toLocaleString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
