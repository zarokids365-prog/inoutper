import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weeklySchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: get schedules for employee
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json(
        { error: "شناسه کارمند الزامی است" },
        { status: 400 }
      );
    }
    const rows = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.employeeId, parseInt(employeeId)))
      .orderBy(weeklySchedules.dayOfWeek);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
