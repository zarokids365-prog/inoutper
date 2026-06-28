import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: generate report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!employeeId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "شناسه کارمند و بازه تاریخ الزامی است" },
        { status: 400 }
      );
    }

    const empId = parseInt(employeeId);
    const [emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, empId));

    if (!emp) {
      return NextResponse.json({ error: "کارمند یافت نشد" }, { status: 404 });
    }

    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.employeeId, empId))
      .orderBy(attendance.dateJalali);

    const filtered = records.filter(
      (r) => r.dateJalali >= dateFrom && r.dateJalali <= dateTo
    );

    let totalWorkedMinutes = 0;
    let totalDelayMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalAbsences = 0;

    for (const r of filtered) {
      totalWorkedMinutes += r.totalWorkedMinutes;
      totalDelayMinutes += r.delayMinutes;
      totalOvertimeMinutes += r.overtimeMinutes;
      if (r.status === "absent") totalAbsences++;
    }

    return NextResponse.json({
      employee: emp,
      records: filtered,
      summary: {
        totalWorkedMinutes,
        totalDelayMinutes,
        totalOvertimeMinutes,
        totalAbsences,
        totalRecords: filtered.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
