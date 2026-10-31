import { NextResponse } from "next/server";
import { runDatabaseSeed } from "@/lib/seed-data";

export async function POST() {
  try {
    const result = await runDatabaseSeed();
    return NextResponse.json({ message: "Database seeded successfully", ...result });
  } catch (error: unknown) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
