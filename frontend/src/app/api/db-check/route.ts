import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [dbInfo, userCount] = await Promise.all([
      prisma.$queryRaw<Array<{ current_time: Date; pg_version: string }>>`
        SELECT NOW() as current_time, version() as pg_version;
      `,
      prisma.user.count(),
    ]);

    return NextResponse.json({
      status: "connected",
      message: "Successfully connected to PostgreSQL via Prisma!",
      timestamp: dbInfo[0]?.current_time,
      version: dbInfo[0]?.pg_version,
      stats: {
        users: userCount,
      },
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
