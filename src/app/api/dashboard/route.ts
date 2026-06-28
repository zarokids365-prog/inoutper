import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTodayJalaliStr } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = getTodayJalaliStr();

    const allEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.isActive, true));

    const todayRecords = await db.select().from(attendance).orderBy(attendance.dateJalali);

    const todayFiltered = todayRecords.filter((r) => r.dateJalali === today);

    const presentCount = todayFiltered.filter(
      (r) => r.status === "present"
    ).length;
    const totalWorkedMinutes = todayFiltered.reduce(
      (sum, r) => sum + r.totalWorkedMinutes,
      0
    );
    const totalDelayMinutes = todayFiltered.reduce(
      (sum, r) => sum + r.delayMinutes,
      0
    );
    const totalOvertimeMinutes = todayFiltered.reduce(
      (sum, r) => sum + r.overtimeMinutes,
      0
    );
    const hasDelays = totalDelayMinutes > 0;
    const hasOvertime = totalOvertimeMinutes > 0;

    return NextResponse.json({
      today,
      totalEmployees: allEmployees.length,
      presentCount,
      totalWorkedMinutes,
      totalDelayMinutes,
      totalOvertimeMinutes,
      hasDelays,
      hasOvertime,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
