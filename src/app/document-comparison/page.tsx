"use client";

import { useEffect, useState } from "react";
import { DocumentComparison } from "@/components/document-comparison";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Evidence {
  id: string;
  documentName: string;
  type: string;
  department: string;
}

interface MasterDocument {
  id: string;
  name: string;
  category: string;
  description: string;
}

export default function DocumentComparisonPage() {
  const [userEvidences, setUserEvidences] = useState<Evidence[]>([]);
  const [masterDocuments, setMasterDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user evidence documents
        const evidenceRes = await fetch("/api/evidence");
        if (evidenceRes.ok) {
          const data = await evidenceRes.json();
          setUserEvidences(data.evidence || []);
        }

        // Fetch master documents
        const masterRes = await fetch("/api/admin/master-documents");
        if (masterRes.ok) {
          const data = await masterRes.json();
          setMasterDocuments(data.documents || []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📄</span>
            <h1 className="text-4xl font-bold text-gray-900">
              Document Comparison Tool
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Compare user-uploaded documents with master reference documents to
            assess compliance alignment and identify gaps.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm text-gray-600">User Documents Available</p>
            <p className="text-2xl font-bold text-blue-600">
              {userEvidences.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Master Documents</p>
            <p className="text-2xl font-bold text-green-600">
              {masterDocuments.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Powered by</p>
            <p className="text-lg font-bold text-purple-600">Google Gemini AI</p>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200 mb-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {/* Comparison Tool */}
        {userEvidences.length === 0 || masterDocuments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              {userEvidences.length === 0
                ? "No user documents available. Please upload documents first."
                : "No master documents available. Please have an admin upload master documents first."}
            </p>
          </Card>
        ) : (
          <DocumentComparison
            userEvidences={userEvidences}
            masterDocuments={masterDocuments}
          />
        )}

        {/* Feature Info */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Select a user-uploaded document and a master reference document</li>
            <li>✓ AI analyzes the content and compares compliance alignment</li>
            <li>✓ Generates a detailed matching report with score (0-100%)</li>
            <li>✓ Identifies key matches, gaps, and specific recommendations</li>
            <li>✓ All results are saved for audit trail and historical reference</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
