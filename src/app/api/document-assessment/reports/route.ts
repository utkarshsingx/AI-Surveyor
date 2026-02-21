import { NextResponse } from "next/server";
import { getReports } from "@/lib/document-assessment-store";

export async function GET() {
  const reports = getReports();
  return NextResponse.json(reports);
}
