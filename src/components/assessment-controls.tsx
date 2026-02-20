"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AssessmentValue = "met" | "partially_met" | "not_met" | "na" | null;

interface AssessmentControlsProps {
  value: AssessmentValue;
  onChange: (value: AssessmentValue) => void;
  disabled?: boolean;
}

const options: { key: AssessmentValue; label: string; icon?: React.ReactNode; activeClass: string }[] = [
  {
    key: "met",
    label: "Met",
    icon: <Check className="h-3.5 w-3.5" />,
    activeClass: "bg-white border-gray-300 text-gray-800 shadow-sm",
  },
  {
    key: "partially_met",
    label: "Partially Met",
    activeClass: "bg-orange-500 border-orange-500 text-white",
  },
  {
    key: "not_met",
    label: "Not Met",
    icon: <X className="h-3.5 w-3.5" />,
    activeClass: "bg-white border-gray-300 text-gray-800 shadow-sm",
  },
  {
    key: "na",
    label: "N/A",
    activeClass: "bg-white border-gray-300 text-gray-800 shadow-sm",
  },
];

export function AssessmentControls({ value, onChange, disabled }: AssessmentControlsProps) {
  return (
    <div className="flex items-center gap-0">
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(isActive ? null : opt.key)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 border px-4 py-2 text-sm font-medium transition-all first:rounded-l-md last:rounded-r-md",
              isActive
                ? opt.activeClass
                : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
