import { NextRequest, NextResponse } from "next/server";
import { removeCreatedPolicy } from "@/lib/policy-store";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  removeCreatedPolicy(params.id);
  return NextResponse.json({ success: true });
}
