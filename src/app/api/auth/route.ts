import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// POST: login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Check if login is enabled
    const loginEnabledRow = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "login_enabled"));
    if (loginEnabledRow.length > 0 && loginEnabledRow[0].value === "false") {
      return NextResponse.json({ success: true, loginDisabled: true });
    }

    const passwordRow = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "admin_password"));
    if (passwordRow.length === 0) {
      return NextResponse.json({ error: "سیستم مقداردهی نشده" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(password, passwordRow[0].value);
    if (!isValid) {
      return NextResponse.json({ error: "رمز عبور اشتباه است" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: change password
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    const passwordRow = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "admin_password"));
    if (passwordRow.length === 0) {
      return NextResponse.json({ error: "تنظیمات یافت نشد" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(currentPassword, passwordRow[0].value);
    if (!isValid) {
      return NextResponse.json({ error: "رمز عبور فعلی اشتباه است" }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db
      .update(settings)
      .set({ value: hashed })
      .where(eq(settings.key, "admin_password"));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: check if login is required
export async function GET() {
  try {
    const loginEnabledRow = await db
      .select()
      .from(settings)
      .where(eq(settings.key, "login_enabled"));
    const loginEnabled =
      loginEnabledRow.length === 0 || loginEnabledRow[0].value === "true";
    return NextResponse.json({ loginEnabled });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
