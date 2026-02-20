"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronRight,
  Loader2,
  BookOpen,
  FolderOpen,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchAccreditations } from "@/lib/api-client";

interface AccreditationSummary {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: string;
  chapters: { id: string; code: string; name: string }[];
  project_count: number;
  active_projects: number;
  overall_progress: number;
}

export default function AccreditationsPage() {
  const [accreditations, setAccreditations] = useState<AccreditationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccreditations()
      .then((data) => setAccreditations(data as unknown as AccreditationSummary[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Accreditation</h1>
        <p className="text-sm text-muted-foreground">
          Select an accreditation to drill into chapters, standards, sub-standards, and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {accreditations.map((acc) => (
          <Link key={acc.id} href={`/accreditations/${acc.id}`}>
            <Card className="h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{acc.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{acc.version}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      acc.status === "active"
                        ? "default"
                        : acc.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {acc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {acc.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{acc.chapters.length} Chapters</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FolderOpen className="h-4 w-4" />
                    <span>{acc.project_count} Projects</span>
                  </div>
                </div>

                {acc.overall_progress > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Readiness
                      </span>
                      <span
                        className={`font-semibold ${
                          acc.overall_progress >= 80
                            ? "text-green-600"
                            : acc.overall_progress >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {acc.overall_progress}%
                      </span>
                    </div>
                    <Progress
                      value={acc.overall_progress}
                      className="h-2"
                      indicatorClassName={
                        acc.overall_progress >= 80
                          ? "bg-green-500"
                          : acc.overall_progress >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {acc.chapters.slice(0, 6).map((ch) => (
                    <Badge key={ch.id} variant="outline" className="text-xs">
                      {ch.code}
                    </Badge>
                  ))}
                  {acc.chapters.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{acc.chapters.length - 6} more
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-end pt-1 text-xs text-primary">
                  View Details <ChevronRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {accreditations.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No accreditations found. Configure them in the Admin Panel.
        </div>
      )}
    </div>
  );
}
