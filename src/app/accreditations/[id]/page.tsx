"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Loader2,
  ArrowLeft,
  Filter,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchAccreditation, fetchAccreditations } from "@/lib/api-client";
import { useAccreditation } from "@/contexts/accreditation-context";

interface AccreditationDetail {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: string;
  chapters: ChapterDetail[];
}

interface ChapterDetail {
  id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  score?: number;
  total_standards: number;
  standards: StandardDetail[];
}

interface StandardDetail {
  id: string;
  code: string;
  standard_name: string;
  description: string;
  criticality: string;
  sub_standards: SubStandardDetail[];
}

interface SubStandardDetail {
  id: string;
  code: string;
  name: string;
  activities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  label: string;
  description: string;
  field_type: string;
  required: boolean;
}

type TabLevel = "library" | "chapter" | "standard" | "substandard" | "activity";

interface LibraryItem {
  id: string;
  name: string;
  code: string;
  status: string;
}

export default function AccreditationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accreditationId = params.id as string;
  useAccreditation();

  const [accreditation, setAccreditation] = useState<AccreditationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabLevel>("library");
  const [selectedChapter, setSelectedChapter] = useState<ChapterDetail | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<StandardDetail | null>(null);
  const [selectedSubStandard, setSelectedSubStandard] = useState<SubStandardDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAccreditation(accreditationId),
      fetchAccreditations(),
    ])
      .then(([acc, allAccs]) => {
        const detail = acc as unknown as AccreditationDetail;
        setAccreditation(detail);
        const libs = (allAccs as unknown as LibraryItem[]).map((a) => ({
          id: a.id,
          name: a.name,
          code: a.code,
          status: (a as unknown as { status: string }).status || "active",
        }));
        setLibraries(libs);
        const current = libs.find((l) => l.id === accreditationId);
        if (current) setSelectedLibrary(current);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accreditationId]);

  const handleSelectLibrary = useCallback(
    (lib: LibraryItem) => {
      setSelectedLibrary(lib);
      if (lib.id !== accreditationId) {
        router.push(`/accreditations/${lib.id}`);
      }
    },
    [accreditationId, router]
  );

  const totalChapters = accreditation?.chapters.length || 0;
  const totalStandards = accreditation?.chapters.reduce((s, c) => s + c.standards.length, 0) || 0;
  const totalSubStandards =
    accreditation?.chapters.reduce(
      (s, c) => s + c.standards.reduce((ss, st) => ss + st.sub_standards.length, 0),
      0
    ) || 0;
  const totalActivities =
    accreditation?.chapters.reduce(
      (s, c) =>
        s +
        c.standards.reduce(
          (ss, st) => ss + st.sub_standards.reduce((sa, sub) => sa + (sub.activities?.length || 0), 0),
          0
        ),
      0
    ) || 0;

  const tabs: { key: TabLevel; label: string; count: number }[] = [
    { key: "library", label: "Library", count: libraries.length },
    { key: "chapter", label: "Chapter/Clause", count: totalChapters },
    { key: "standard", label: "Standard", count: totalStandards },
    { key: "substandard", label: "Substandard/Element", count: totalSubStandards },
    { key: "activity", label: "Activity", count: totalActivities },
  ];

  const handleTabClick = (tab: TabLevel) => {
    setActiveTab(tab);
    if (tab === "library") {
      setSelectedChapter(null);
      setSelectedStandard(null);
      setSelectedSubStandard(null);
    } else if (tab === "chapter") {
      setSelectedStandard(null);
      setSelectedSubStandard(null);
    } else if (tab === "standard") {
      setSelectedSubStandard(null);
    }
  };

  const breadcrumbText = (() => {
    const parts = ["Libraries"];
    if (selectedLibrary) parts.push(selectedLibrary.code);
    if (activeTab !== "library" && selectedChapter) parts.push(selectedChapter.code);
    if ((activeTab === "standard" || activeTab === "substandard" || activeTab === "activity") && selectedStandard)
      parts.push(selectedStandard.code);
    if ((activeTab === "substandard" || activeTab === "activity") && selectedSubStandard)
      parts.push(selectedSubStandard.code);
    return parts;
  })();

  if (loading || !accreditation) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
      </div>
    );
  }

  const allStandards = accreditation.chapters.flatMap((c) =>
    c.standards.map((s) => ({ ...s, chapterCode: c.code, chapterName: c.name }))
  );

  const allSubStandards = accreditation.chapters.flatMap((c) =>
    c.standards.flatMap((s) =>
      s.sub_standards.map((ss) => ({ ...ss, standardCode: s.code, chapterCode: c.code }))
    )
  );

  const allActivities = accreditation.chapters.flatMap((c) =>
    c.standards.flatMap((s) =>
      s.sub_standards.flatMap((ss) =>
        (ss.activities || []).map((a) => ({
          ...a,
          subStandardCode: ss.code,
          standardCode: s.code,
          chapterCode: c.code,
        }))
      )
    )
  );

  const chaptersForTable = selectedChapter
    ? accreditation.chapters.filter((c) => c.id === selectedChapter.id)
    : accreditation.chapters;

  const standardsForTable = selectedStandard
    ? allStandards.filter((s) => s.id === selectedStandard.id)
    : selectedChapter
    ? allStandards.filter((s) => s.chapterCode === selectedChapter.code)
    : allStandards;

  const subStandardsForTable = selectedSubStandard
    ? allSubStandards.filter((s) => s.id === selectedSubStandard.id)
    : selectedStandard
    ? allSubStandards.filter((s) => s.standardCode === selectedStandard.code)
    : selectedChapter
    ? allSubStandards.filter((s) => s.chapterCode === selectedChapter.code)
    : allSubStandards;

  const activitiesForTable = selectedSubStandard
    ? allActivities.filter((a) => a.subStandardCode === selectedSubStandard.code)
    : selectedStandard
    ? allActivities.filter((a) => a.standardCode === selectedStandard.code)
    : selectedChapter
    ? allActivities.filter((a) => a.chapterCode === selectedChapter.code)
    : allActivities;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Accreditation</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            {breadcrumbText.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumbText.length - 1 ? "text-[#1a5276] font-medium" : ""}>{part}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/accreditations")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-[#1a5276] border-b-2 border-[#1a5276]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <Badge
              variant={activeTab === tab.key ? "default" : "secondary"}
              className={`text-[10px] px-1.5 py-0 h-5 ${
                activeTab === tab.key ? "bg-[#1a5276]" : ""
              }`}
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Main content: left panel + right panel */}
      <div className="flex gap-6">
        {/* Left panel */}
        <div className="w-[280px] shrink-0">
          {activeTab === "library" && (
            <LeftPanel title="List of library">
              {libraries.map((lib) => (
                <button
                  key={lib.id}
                  onClick={() => handleSelectLibrary(lib)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedLibrary?.id === lib.id
                      ? "border-[#1a5276] bg-[#1a5276]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{lib.name}</p>
                  <p className="text-xs text-gray-500">Code: {lib.code}</p>
                  <Badge
                    className={`mt-1.5 text-[10px] ${
                      lib.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    variant="outline"
                  >
                    {lib.status}
                  </Badge>
                </button>
              ))}
            </LeftPanel>
          )}

          {activeTab === "chapter" && (
            <LeftPanel title="List of library">
              {libraries.map((lib) => (
                <button
                  key={lib.id}
                  onClick={() => handleSelectLibrary(lib)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedLibrary?.id === lib.id
                      ? "border-[#1a5276] bg-[#1a5276]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">{lib.name}</p>
                  <p className="text-xs text-gray-500">Code: {lib.code}</p>
                  <Badge
                    className={`mt-1.5 text-[10px] ${
                      lib.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    variant="outline"
                  >
                    {lib.status}
                  </Badge>
                </button>
              ))}
            </LeftPanel>
          )}

          {(activeTab === "standard" || activeTab === "substandard" || activeTab === "activity") && (
            <LeftPanel
              title={
                activeTab === "activity"
                  ? "List of Sub Standard"
                  : activeTab === "substandard"
                  ? "List of Standard"
                  : "List of Chapter"
              }
            >
              {activeTab === "standard" &&
                accreditation.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapter(ch)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedChapter?.id === ch.id
                        ? "border-[#1a5276] bg-[#1a5276]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{ch.code}</p>
                    <p className="text-xs text-gray-500">{ch.name}</p>
                  </button>
                ))}

              {activeTab === "substandard" &&
                (selectedChapter?.standards || allStandards).map((std) => (
                  <button
                    key={std.id}
                    onClick={() => setSelectedStandard(std as StandardDetail)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedStandard?.id === std.id
                        ? "border-[#1a5276] bg-[#1a5276]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{std.code}</p>
                    <p className="text-xs text-gray-500">{std.standard_name}</p>
                  </button>
                ))}

              {activeTab === "activity" && (() => {
                const subs = selectedStandard
                  ? selectedStandard.sub_standards
                  : selectedChapter
                  ? selectedChapter.standards.flatMap((s) => s.sub_standards)
                  : accreditation.chapters.flatMap((c) => c.standards.flatMap((s) => s.sub_standards));
                return subs.map((ss) => (
                  <button
                    key={ss.id}
                    onClick={() => setSelectedSubStandard(ss)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedSubStandard?.id === ss.id
                        ? "border-[#1a5276] bg-[#1a5276]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{ss.code}</span>
                      <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{ss.name}</p>
                  </button>
                ));
              })()}
            </LeftPanel>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          <div className="rounded-lg border border-gray-200 bg-white">
            {/* Right panel header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1a5276]">
                  {selectedLibrary?.code || accreditation.code}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "activity" && (
                  <Button size="sm" className="gap-1.5 bg-[#1a5276] hover:bg-[#154360]">
                    <Plus className="h-3.5 w-3.5" /> Assign
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" /> Filter
                </Button>
              </div>
            </div>

            {/* Table header label */}
            <div className="border-b border-gray-100 px-5 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {activeTab === "library" || activeTab === "chapter"
                    ? "Chapter List"
                    : activeTab === "standard"
                    ? "Standard List"
                    : activeTab === "substandard"
                    ? "Substandard/Element List"
                    : "Activity List"}
                </span>
                <Badge variant="default" className="bg-[#1a5276] text-[10px] h-5 px-1.5">
                  {activeTab === "library" || activeTab === "chapter"
                    ? chaptersForTable.length
                    : activeTab === "standard"
                    ? standardsForTable.length
                    : activeTab === "substandard"
                    ? subStandardsForTable.length
                    : activitiesForTable.length}
                </Badge>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {(activeTab === "library" || activeTab === "chapter") && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="w-10 px-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3">Tag</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Assigned to</th>
                      <th className="w-16 px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chaptersForTable.map((ch) => (
                      <tr
                        key={ch.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedChapter(ch);
                          setActiveTab("standard");
                        }}
                      >
                        <td className="px-5 py-3"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{ch.code}</td>
                        <td className="px-4 py-3 text-gray-700">{ch.name}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[240px] truncate">{ch.description || "-"}</td>
                        <td className="px-4 py-3 text-gray-500">Demo Updater + {ch.total_standards}</td>
                        <td className="px-4 py-3">
                          <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "standard" && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="w-10 px-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Standard Name</th>
                      <th className="px-4 py-3">Chapter</th>
                      <th className="px-4 py-3">Sub-standards</th>
                      <th className="px-4 py-3">Criticality</th>
                      <th className="w-16 px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardsForTable.map((std) => (
                      <tr
                        key={std.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedStandard(std as StandardDetail);
                          setActiveTab("substandard");
                        }}
                      >
                        <td className="px-5 py-3"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{std.code}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{std.standard_name}</td>
                        <td className="px-4 py-3 text-gray-500">{"chapterCode" in std ? (std as unknown as { chapterCode: string }).chapterCode : "-"}</td>
                        <td className="px-4 py-3 text-gray-500">{std.sub_standards.length}</td>
                        <td className="px-4 py-3">
                          <Badge variant={std.criticality === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                            {std.criticality}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "substandard" && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="w-10 px-5 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Activities</th>
                      <th className="w-16 px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subStandardsForTable.map((ss) => (
                      <tr
                        key={ss.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedSubStandard(ss as SubStandardDetail);
                          setActiveTab("activity");
                        }}
                      >
                        <td className="px-5 py-3"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{ss.code}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[240px] truncate">{ss.name}</td>
                        <td className="px-4 py-3 text-gray-500">{"standardCode" in ss ? (ss as unknown as { standardCode: string }).standardCode : "-"}</td>
                        <td className="px-4 py-3 text-gray-500">{(ss as SubStandardDetail).activities?.length || 0}</td>
                        <td className="px-4 py-3">
                          <button className="text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "activity" && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Tag</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Type of Activity</th>
                      <th className="px-4 py-3">Frequency of response</th>
                      <th className="w-16 px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activitiesForTable.map((act) => (
                      <tr key={act.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-500 text-xs">
                          {"subStandardCode" in act ? (act as unknown as { subStandardCode: string }).subStandardCode : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-900">{act.label}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{act.description || "-"}</td>
                        <td className="px-4 py-3 text-gray-700 capitalize">{act.type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-gray-500">Monthly</td>
                        <td className="px-4 py-3">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activitiesForTable.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                          No activities found. Select a sub-standard from the left panel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [filter, setFilter] = useState<"active" | "archive">("active");

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <select className="mt-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-600">
          <option>All</option>
        </select>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
            filter === "active"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("archive")}
          className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
            filter === "archive"
              ? "text-[#1a5276] border-b-2 border-[#1a5276]"
              : "text-gray-400"
          }`}
        >
          Archive
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2 p-3">{children}</div>
      </ScrollArea>
    </div>
  );
}
