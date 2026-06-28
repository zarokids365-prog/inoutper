import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { minutesToTime } from "@/lib/jalali";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!employeeId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "پارامترهای ناقص" },
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

    const statusLabels: Record<string, string> = {
      present: "حاضر",
      leave: "مرخصی",
      dayoff: "تعطیل",
      absent: "غایب",
    };

    const data = filtered.map((r) => ({
      تاریخ: r.dateJalali,
      "ساعت ورود": r.checkIn || "-",
      "ساعت خروج": r.checkOut || "-",
      وضعیت: statusLabels[r.status] || r.status,
      "تأخیر (دقیقه)": r.delayMinutes,
      "اضافه‌کاری (دقیقه)": r.overtimeMinutes,
      "کسری (دقیقه)": r.deficitMinutes,
      "ساعت کاری": minutesToTime(r.totalWorkedMinutes),
      توضیحات: r.description || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "گزارش");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="report-${emp.personnelCode}-${dateFrom}-${dateTo}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
