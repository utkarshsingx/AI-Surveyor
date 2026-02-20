"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  ArrowLeft,
  Search,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RiskMatrix } from "@/components/risk-matrix";
import { fetchCorrectiveActions } from "@/lib/api-client";
import type { CorrectiveAction } from "@/types";
import { useRouter } from "next/navigation";

export default function ActionPlanPage() {
  const router = useRouter();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<{ likelihood: number; impact: number } | null>(null);

  useEffect(() => {
    fetchCorrectiveActions()
      .then(setActions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = actions.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.me_code.toLowerCase().includes(q) ||
      a.gap_description.toLowerCase().includes(q) ||
      a.recommended_action.toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    total: actions.length,
    open: actions.filter((a) => a.status === "open").length,
    inProgress: actions.filter((a) => a.status === "in-progress").length,
    completed: actions.filter((a) => a.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a5276]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Action Plan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create/assign tasks and view process insights.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/accreditations")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[#1a5276] text-white text-xs px-2.5 py-1">
          Total Actions <span className="ml-1 font-bold">{statusCounts.total}</span>
        </Badge>
        <Badge className="bg-red-400 text-white text-xs px-2.5 py-1">
          Open ({statusCounts.open})
        </Badge>
        <Badge className="bg-blue-400 text-white text-xs px-2.5 py-1">
          In Progress ({statusCounts.inProgress})
        </Badge>
        <Badge className="bg-green-500 text-white text-xs px-2.5 py-1">
          Completed ({statusCounts.completed})
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <select
            className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search"
              className="h-8 w-[180px] pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-[#1a5276] hover:bg-[#154360]">
            <Plus className="h-3.5 w-3.5" /> New Action
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Actions Table */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">ME Code</th>
                  <th className="px-4 py-3">Gap Description</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="w-12 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((action) => (
                  <tr key={action.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-[#1a5276]">{action.me_code}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{action.gap_description}</td>
                    <td className="px-4 py-2.5 text-gray-500 capitalize text-xs">{action.action_type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{action.assigned_to}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{action.due_date}</td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={`text-[10px] ${
                          action.priority === "critical"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : action.priority === "high"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : action.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                        variant="outline"
                      >
                        {action.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={`text-[10px] ${
                          action.status === "completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : action.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                        variant="outline"
                      >
                        {action.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                      No corrective actions found. Run an AI assessment first to generate action plans.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: Risk Matrix */}
        <div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Risk Assessment</h3>
            <RiskMatrix
              selectedCell={selectedRisk}
              onSelect={setSelectedRisk}
            />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-600">ESR Reasons</h4>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#1a5276] focus:outline-none"
                rows={3}
                placeholder="Enter ESR reasons..."
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-600">Risk Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-red-50 p-2 text-center">
                  <p className="text-lg font-bold text-red-600">
                    {actions.filter((a) => a.priority === "critical" || a.priority === "high").length}
                  </p>
                  <p className="text-red-500">High Risk</p>
                </div>
                <div className="rounded-md bg-yellow-50 p-2 text-center">
                  <p className="text-lg font-bold text-yellow-600">
                    {actions.filter((a) => a.priority === "medium").length}
                  </p>
                  <p className="text-yellow-500">Medium Risk</p>
                </div>
                <div className="rounded-md bg-green-50 p-2 text-center">
                  <p className="text-lg font-bold text-green-600">
                    {actions.filter((a) => a.priority === "low").length}
                  </p>
                  <p className="text-green-500">Low Risk</p>
                </div>
                <div className="rounded-md bg-blue-50 p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {actions.filter((a) => a.status === "completed").length}
                  </p>
                  <p className="text-blue-500">Resolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
