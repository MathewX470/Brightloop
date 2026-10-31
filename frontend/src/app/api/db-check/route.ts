import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const result = await sql`SELECT NOW() as current_time, version() as pg_version;`;
    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to Neon PostgreSQL!",
      timestamp: result[0]?.current_time,
      version: result[0]?.pg_version,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 }
    );
  }
}
