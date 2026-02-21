import { NextRequest, NextResponse } from "next/server";
import { getAccreditationById } from "@/data/mock";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const accreditation = getAccreditationById(params.id);
  if (!accreditation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(accreditation);
}
