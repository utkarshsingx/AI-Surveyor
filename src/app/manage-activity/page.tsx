"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  Search,
  Filter,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAccreditation } from "@/contexts/accreditation-context";
import { fetchAccreditation } from "@/lib/api-client";
import { useRouter } from "next/navigation";

type ActivityTab = "checklist" | "document_evidence" | "data_collection";
type DocSubTab = "document_evidence" | "document_evidence_form";

interface AccDetail {
  id: string;
  name: string;
  code: string;
  chapters: {
    id: string;
    code: string;
    name: string;
    standards: {
      id: string;
      code: string;
      standard_name: string;
      sub_standards: {
        id: string;
        code: string;
        name: string;
        activities: {
          id: string;
          type: string;
          label: string;
          description: string;
          response?: {
            value: string;
            status: string;
            updated_at?: string;
          };
        }[];
      }[];
    }[];
  }[];
}

interface FlatActivity {
  id: string;
  label: string;
  description: string;
  type: string;
  chapterCode: string;
  chapterName: string;
  standardCode: string;
  subStandardCode: string;
  status: "pending" | "completed";
  uploadedDocument: string;
  expiryDate: string;
  assignedTo: string;
  frequency: string;
  responseDate: string;
  score: string;
}

export default function ManageActivityPage() {
  const router = useRouter();
  const { selectedAccreditation } = useAccreditation();
  const [accDetail, setAccDetail] = useState<AccDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>("checklist");
  const [docSubTab, setDocSubTab] = useState<DocSubTab>("document_evidence");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!selectedAccreditation) return;
    setLoading(true);
    fetchAccreditation(selectedAccreditation.id)
      .then((acc) => setAccDetail(acc as unknown as AccDetail))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccreditation]);

  const allActivities: FlatActivity[] = useMemo(() => {
    if (!accDetail) return [];
    return accDetail.chapters.flatMap((ch) =>
      ch.standards.flatMap((std) =>
        std.sub_standards.flatMap((ss) =>
          (ss.activities || []).map((act) => ({
            id: act.id,
            label: act.label,
            description: act.description || act.label,
            type: act.type,
            chapterCode: ch.code,
            chapterName: ch.name,
            standardCode: std.code,
            subStandardCode: ss.code,
            status: act.response?.status === "completed" ? "completed" as const : "pending" as const,
            uploadedDocument: act.response?.value && act.response.status === "completed" ? "Uploaded" : "",
            expiryDate: "",
            assignedTo: "",
            frequency: "Monthly",
            responseDate: act.response?.updated_at || "",
            score: act.response?.value === "true" ? "100" : "",
          }))
        )
      )
    );
  }, [accDetail]);

  const filteredByTab = allActivities.filter((a) => {
    if (activeTab === "checklist") return a.type === "checklist";
    if (activeTab === "document_evidence") return a.type === "document_evidence";
    if (activeTab === "data_collection") return a.type === "data_collection";
    return true;
  });

  const filtered = filteredByTab.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.label.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.chapterCode.toLowerCase().includes(q)
    );
  });

  const tabCounts = {
    checklist: allActivities.filter((a) => a.type === "checklist").length,
    document_evidence: allActivities.filter((a) => a.type === "document_evidence").length,
    data_collection: allActivities.filter((a) => a.type === "data_collection").length,
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manage Activity</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/accreditations")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Activity type tabs */}
      <div className="flex items-center border-b border-gray-200">
        {([
          { key: "checklist" as const, label: "Checklist", count: tabCounts.checklist },
          { key: "document_evidence" as const, label: "Document Evidence", count: tabCounts.document_evidence },
          { key: "data_collection" as const, label: "Data Collection", count: tabCounts.data_collection },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-[#1a5276] border-b-2 border-[#1a5276]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            <Badge
              className={`text-[10px] px-1.5 h-5 ${
                activeTab === tab.key ? "bg-[#1a5276] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Document Evidence sub-tabs */}
      {activeTab === "document_evidence" && (
        <div className="flex items-center border-b border-gray-100">
          <button
            onClick={() => setDocSubTab("document_evidence")}
            className={`px-5 py-2 text-xs font-medium transition-colors ${
              docSubTab === "document_evidence"
                ? "text-[#1a5276] border-b-2 border-[#1a5276]"
                : "text-gray-400"
            }`}
          >
            Document Evidence
          </button>
          <button
            onClick={() => setDocSubTab("document_evidence_form")}
            className={`px-5 py-2 text-xs font-medium transition-colors ${
              docSubTab === "document_evidence_form"
                ? "text-[#1a5276] border-b-2 border-[#1a5276]"
                : "text-gray-400"
            }`}
          >
            Document Evidence Form
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <p className="text-xs text-gray-500">
        Manage Activities / <span className="text-gray-700">{activeTab === "checklist" ? "Checklist" : activeTab === "document_evidence" ? "Document Evidence" : "Data Collection"}</span>
      </p>

      {/* Filter controls */}
      <div className="flex items-center gap-3">
        <Badge className="bg-[#1a5276] text-white text-xs px-2.5 py-1">
          {activeTab === "checklist" ? "Checklist" : activeTab === "document_evidence" ? "Document Evidence" : "Data Collection"}{" "}
          <span className="ml-1 font-bold">{filtered.length}</span>
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search name"
              className="h-8 w-[180px] pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Input type="date" className="h-8 text-xs w-[130px]" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From" />
            <Input type="date" className="h-8 text-xs w-[130px]" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To" />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-[#1a5276] text-white hover:bg-[#154360] border-[#1a5276]">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Chapter Name</th>
                <th className="px-4 py-3">Standard Name</th>
                {activeTab === "document_evidence" && <th className="px-4 py-3">Uploaded Document</th>}
                {activeTab === "document_evidence" && <th className="px-4 py-3">Expiry Date</th>}
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Frequency of Response</th>
                {activeTab === "data_collection" && <th className="px-4 py-3">Score</th>}
                <th className="px-4 py-3">Date of Response</th>
                <th className="w-12 px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((act) => (
                <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-900 max-w-[160px] truncate">{act.label}</td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-[180px] truncate">{act.description}</td>
                  <td className="px-4 py-2.5 text-gray-500">{act.chapterCode}</td>
                  <td className="px-4 py-2.5 text-gray-500">{act.subStandardCode}</td>
                  {activeTab === "document_evidence" && (
                    <td className="px-4 py-2.5 text-gray-500">{act.uploadedDocument || "-"}</td>
                  )}
                  {activeTab === "document_evidence" && (
                    <td className="px-4 py-2.5 text-gray-500">{act.expiryDate || "-"}</td>
                  )}
                  <td className="px-4 py-2.5 text-gray-500">{act.assignedTo || "-"}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      className={`text-[10px] ${
                        act.status === "completed"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-orange-100 text-orange-700 border-orange-200"
                      }`}
                      variant="outline"
                    >
                      {act.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{act.frequency}</td>
                  {activeTab === "data_collection" && (
                    <td className="px-4 py-2.5 text-gray-500">{act.score || "-"}</td>
                  )}
                  <td className="px-4 py-2.5 text-gray-500">{act.responseDate ? new Date(act.responseDate).toLocaleDateString() : "Invalid date"}</td>
                  <td className="px-4 py-2.5">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                    No activities found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
