import { NextRequest, NextResponse } from "next/server";
import { getChaptersByAccreditationId } from "@/data/mock";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const chapters = getChaptersByAccreditationId(params.id);
  return NextResponse.json(chapters);
}
