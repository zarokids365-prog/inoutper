import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees, weeklySchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: list all employees
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(employees)
      .orderBy(employees.fullName);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: add employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, personnelCode, position, isActive, schedules } = body;

    if (!fullName || !personnelCode) {
      return NextResponse.json(
        { error: "نام و کد پرسنلی الزامی است" },
        { status: 400 }
      );
    }

    const [emp] = await db
      .insert(employees)
      .values({
        fullName,
        personnelCode,
        position: position || "",
        isActive: isActive !== false,
      })
      .returning();

    // Insert weekly schedules
    if (schedules && Array.isArray(schedules)) {
      for (const s of schedules) {
        await db.insert(weeklySchedules).values({
          employeeId: emp.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime || "08:00",
          endTime: s.endTime || "17:00",
          isDayOff: s.isDayOff || false,
        });
      }
    }

    return NextResponse.json(emp, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: update employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fullName, personnelCode, position, isActive, schedules } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }

    await db
      .update(employees)
      .set({
        fullName,
        personnelCode,
        position: position || "",
        isActive: isActive !== false,
      })
      .where(eq(employees.id, id));

    // Update schedules
    if (schedules && Array.isArray(schedules)) {
      await db.delete(weeklySchedules).where(eq(weeklySchedules.employeeId, id));
      for (const s of schedules) {
        await db.insert(weeklySchedules).values({
          employeeId: id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime || "08:00",
          endTime: s.endTime || "17:00",
          isDayOff: s.isDayOff || false,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: delete employee
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }
    await db.delete(employees).where(eq(employees.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
