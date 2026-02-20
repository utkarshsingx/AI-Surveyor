"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAccreditation } from "@/contexts/accreditation-context";

const modules = [
  {
    title: "Manage Accreditation",
    description: "Track the condition, usage and scheduling of facilities.",
    href: "/accreditations/manage",
  },
  {
    title: "Policies & Documents",
    description: "Monitor and manage employee details and performance within the organization.",
    href: "/policies",
  },
  {
    title: "Manage Activity",
    description: "Define equipment, manage processes and test controls.",
    href: "/manage-activity",
  },
  {
    title: "Self Assessment",
    description: "Control Lab processes, manage lab process controls and view test process insights.",
    href: "/self-assessment",
  },
  {
    title: "Action Plan",
    description: "Create/assign tasks and view process insights.",
    href: "/action-plan",
  },
  {
    title: "Matching Standards",
    description: "Upload two standards to match",
    href: "/document-comparison",
  },
];

export default function AccreditationsPage() {
  const { selectedAccreditation } = useAccreditation();

  const getHref = (mod: typeof modules[0]) => {
    if (mod.title === "Manage Accreditation" && selectedAccreditation) {
      return `/accreditations/${selectedAccreditation.id}`;
    }
    return mod.href;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Accreditation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor and manage accreditation processes and related activities
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((mod) => (
          <Link key={mod.title} href={getHref(mod)}>
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#1a5276]/30">
              {/* Blue gradient header */}
              <div className="relative h-24 bg-gradient-to-br from-[#d4e8f5] via-[#c5dff0] to-[#b0d4eb] overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
                    <path d="M0,60 C100,20 200,100 400,40 L400,120 L0,120 Z" fill="white" opacity="0.3" />
                    <path d="M0,80 C150,40 250,100 400,60 L400,120 L0,120 Z" fill="white" opacity="0.2" />
                  </svg>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="text-base font-bold text-gray-900">{mod.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed min-h-[40px]">
                  {mod.description}
                </p>

                <div className="mt-4 flex justify-end">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#1a5276] text-[#1a5276] transition-colors group-hover:bg-[#1a5276] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
