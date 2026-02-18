import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getComplianceColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

export function getComplianceBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 50) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getStatusIcon(status: "compliant" | "partial" | "non-compliant" | "not-applicable"): string {
  switch (status) {
    case "compliant": return "✅";
    case "partial": return "⚠️";
    case "non-compliant": return "❌";
    case "not-applicable": return "➖";
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
