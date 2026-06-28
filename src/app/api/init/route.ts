import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    // Check if settings exist
    const existing = await db.select().from(settings).where(eq(settings.key, "store_name"));
    if (existing.length === 0) {
      // Initialize default settings
      const hashedPassword = await bcrypt.hash("admin", 10);
      await db.insert(settings).values([
        { key: "store_name", value: "InOutZaro" },
        { key: "admin_password", value: hashedPassword },
        { key: "login_enabled", value: "true" },
        { key: "logo_path", value: "" },
        { key: "backup_frequency", value: "daily" },
        { key: "backup_folder", value: "" },
        { key: "theme_color", value: "#7B1113" },
      ]);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
