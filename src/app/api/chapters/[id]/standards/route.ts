import { NextRequest, NextResponse } from "next/server";
import { getStandardsByChapterId } from "@/data/mock";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const standards = getStandardsByChapterId(params.id);
  return NextResponse.json(standards);
}
