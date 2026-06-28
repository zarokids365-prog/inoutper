import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { specialDays } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(specialDays)
      .where(eq(specialDays.employeeId, parseInt(employeeId)))
      .orderBy(specialDays.dateJalali);
    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, dateJalali, type, startTime, endTime, description } = body;

    // Check if already exists
    const existing = await db
      .select()
      .from(specialDays)
      .where(
        and(
          eq(specialDays.employeeId, employeeId),
          eq(specialDays.dateJalali, dateJalali)
        )
      );

    if (existing.length > 0) {
      await db
        .update(specialDays)
        .set({ type, startTime, endTime, description })
        .where(eq(specialDays.id, existing[0].id));
      return NextResponse.json({ success: true, updated: true });
    }

    const [record] = await db
      .insert(specialDays)
      .values({
        employeeId,
        dateJalali,
        type,
        startTime: startTime || null,
        endTime: endTime || null,
        description: description || null,
      })
      .returning();
    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    }
    await db.delete(specialDays).where(eq(specialDays.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
