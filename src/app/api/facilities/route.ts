import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/facilities
export async function GET() {
  try {
    const facilities = await prisma.facility.findMany();
    return NextResponse.json(facilities.map(f => ({
      id: f.id,
      name: f.name,
      location: f.location,
      type: f.type,
    })));
  } catch (error) {
    console.error("Facilities GET error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
