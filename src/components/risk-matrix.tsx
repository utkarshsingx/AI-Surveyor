"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskMatrixProps {
  selectedCell: { likelihood: number; impact: number } | null;
  onSelect: (cell: { likelihood: number; impact: number }) => void;
}

const likelihoods = ["Rare", "Unlikely", "Possible", "Probable"];
const impacts = ["Low", "Medium", "High", "Very High"];

const riskLevels: { label: string; severity: string; className: string }[][] = [
  // Probable
  [
    { label: "4 Moderate", severity: "moderate", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { label: "8 Major", severity: "major", className: "bg-orange-100 text-orange-800 border-orange-200" },
    { label: "12 Severe", severity: "severe", className: "bg-red-100 text-red-800 border-red-200" },
    { label: "16 Severe", severity: "severe", className: "bg-red-200 text-red-900 border-red-300" },
  ],
  // Possible
  [
    { label: "3 Minor", severity: "minor", className: "bg-green-100 text-green-800 border-green-200" },
    { label: "6 Moderate", severity: "moderate", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { label: "9 Major", severity: "major", className: "bg-orange-100 text-orange-800 border-orange-200" },
    { label: "13 Severe", severity: "severe", className: "bg-red-100 text-red-800 border-red-200" },
  ],
  // Unlikely
  [
    { label: "2 Minor", severity: "minor", className: "bg-green-100 text-green-800 border-green-200" },
    { label: "4 Moderate", severity: "moderate", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { label: "6 Moderate", severity: "moderate", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { label: "8 Major", severity: "major", className: "bg-orange-100 text-orange-800 border-orange-200" },
  ],
  // Rare
  [
    { label: "1 Minor", severity: "minor", className: "bg-green-100 text-green-800 border-green-200" },
    { label: "2 Minor", severity: "minor", className: "bg-green-100 text-green-800 border-green-200" },
    { label: "3 Minor", severity: "minor", className: "bg-green-100 text-green-800 border-green-200" },
    { label: "4 Moderate", severity: "moderate", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  ],
];

export function RiskMatrix({ selectedCell, onSelect }: RiskMatrixProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Significant</h4>
      </div>
      <p className="text-xs text-gray-500">Click a cell to select risk (score + rating).</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600">
                Likelihood / Impact
              </th>
              {impacts.map((impact) => (
                <th
                  key={impact}
                  className="border border-gray-200 bg-gray-50 px-3 py-2 text-center font-medium text-gray-600"
                >
                  {impact}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likelihoods
              .slice()
              .reverse()
              .map((likelihood, rowIdx) => (
                <tr key={likelihood}>
                  <td className="border border-gray-200 bg-gray-50 px-3 py-2 font-medium text-gray-700">
                    {likelihood}
                  </td>
                  {riskLevels[rowIdx].map((cell, colIdx) => {
                    const actualRow = likelihoods.length - 1 - rowIdx;
                    const isSelected =
                      selectedCell?.likelihood === actualRow && selectedCell?.impact === colIdx;
                    return (
                      <td
                        key={colIdx}
                        onClick={() => onSelect({ likelihood: actualRow, impact: colIdx })}
                        className={cn(
                          "border border-gray-200 px-3 py-2.5 text-center font-medium cursor-pointer transition-all hover:opacity-80",
                          cell.className,
                          isSelected && "ring-2 ring-[#1a5276] ring-offset-1"
                        )}
                      >
                        {cell.label}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
