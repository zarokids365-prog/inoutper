import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, weeklySchedules, specialDays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDayOfWeekFromJalali, calculateAttendance } from "@/lib/jalali";

// GET: get attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const date = searchParams.get("date");

    let query = db.select().from(attendance).$dynamic();

    if (employeeId) {
      query = query.where(eq(attendance.employeeId, parseInt(employeeId)));
    }

    const rows = await query.orderBy(attendance.dateJalali);

    let filtered = rows;
    if (date) {
      filtered = rows.filter((r) => r.dateJalali === date);
    } else if (dateFrom && dateTo) {
      filtered = rows.filter(
        (r) => r.dateJalali >= dateFrom && r.dateJalali <= dateTo
      );
    }

    return NextResponse.json(filtered);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: add attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, dateJalali, checkIn, checkOut, status, description } = body;

    if (!employeeId || !dateJalali) {
      return NextResponse.json(
        { error: "شناسه کارمند و تاریخ الزامی است" },
        { status: 400 }
      );
    }

    let delayMinutes = 0;
    let overtimeMinutes = 0;
    let deficitMinutes = 0;
    let totalWorkedMinutes = 0;

    // Calculate based on schedule if status is present
    if (status === "present" && checkIn && checkOut) {
      const dayOfWeek = getDayOfWeekFromJalali(dateJalali);

      // Check for special days first
      const specials = await db
        .select()
        .from(specialDays)
        .where(
          and(
            eq(specialDays.employeeId, employeeId),
            eq(specialDays.dateJalali, dateJalali)
          )
        );

      let scheduleStart = "08:00";
      let scheduleEnd = "17:00";

      if (specials.length > 0 && specials[0].type === "special_work") {
        scheduleStart = specials[0].startTime || "08:00";
        scheduleEnd = specials[0].endTime || "17:00";
      } else {
        const schedules = await db
          .select()
          .from(weeklySchedules)
          .where(
            and(
              eq(weeklySchedules.employeeId, employeeId),
              eq(weeklySchedules.dayOfWeek, dayOfWeek)
            )
          );
        if (schedules.length > 0) {
          scheduleStart = schedules[0].startTime;
          scheduleEnd = schedules[0].endTime;
        }
      }

      const calc = calculateAttendance(checkIn, checkOut, scheduleStart, scheduleEnd);
      delayMinutes = calc.delayMinutes;
      overtimeMinutes = calc.overtimeMinutes;
      deficitMinutes = calc.deficitMinutes;
      totalWorkedMinutes = calc.totalWorkedMinutes;
    }

    // Check if attendance already exists for this employee+date
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employeeId),
          eq(attendance.dateJalali, dateJalali)
        )
      );

    if (existing.length > 0) {
      // Update existing
      await db
        .update(attendance)
        .set({
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          status: status || "present",
          delayMinutes,
          overtimeMinutes,
          deficitMinutes,
          totalWorkedMinutes,
          description: description || null,
        })
        .where(eq(attendance.id, existing[0].id));
      return NextResponse.json({ success: true, updated: true });
    }

    const [record] = await db
      .insert(attendance)
      .values({
        employeeId,
        dateJalali,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || "present",
        delayMinutes,
        overtimeMinutes,
        deficitMinutes,
        totalWorkedMinutes,
        description: description || null,
      })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: delete attendance
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }
    await db.delete(attendance).where(eq(attendance.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
