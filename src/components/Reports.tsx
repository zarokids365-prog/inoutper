"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toPersianDigits, minutesToTime, getTodayJalali, formatJalaliDate } from "@/lib/jalali";

interface Employee {
  id: number;
  fullName: string;
  personnelCode: string;
  position: string;
}

interface AttendanceRecord {
  id: number;
  dateJalali: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  delayMinutes: number;
  overtimeMinutes: number;
  deficitMinutes: number;
  totalWorkedMinutes: number;
  description: string | null;
}

interface ReportData {
  employee: Employee;
  records: AttendanceRecord[];
  summary: {
    totalWorkedMinutes: number;
    totalDelayMinutes: number;
    totalOvertimeMinutes: number;
    totalAbsences: number;
    totalRecords: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  present: "حاضر",
  leave: "مرخصی",
  dayoff: "تعطیل",
  absent: "غایب",
};

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState("InOutZaro");
  const printRef = useRef<HTMLDivElement>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    // Set default date range to current month
    const { jy, jm } = getTodayJalali();
    setDateFrom(formatJalaliDate(jy, jm, 1));
    setDateTo(formatJalaliDate(jy, jm, 30));

    // Get store name
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.store_name) setStoreName(d.store_name);
      })
      .catch(() => {});
  }, [fetchEmployees]);

  const handleGenerate = async () => {
    if (!selectedEmployee || !dateFrom || !dateTo) {
      alert("لطفاً تمام فیلدها را پر کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports?employeeId=${selectedEmployee}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setReport(data);
      }
    } catch {
      alert("خطا در دریافت گزارش");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedEmployee || !dateFrom || !dateTo) return;
    window.open(
      `/api/reports/export?employeeId=${selectedEmployee}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
      "_blank"
    );
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>گزارش حضور و غیاب</title>
        <style>
          @font-face {
            font-family: 'Vazirmatn';
            src: url('/fonts/Vazirmatn-Regular.woff2') format('woff2');
            font-weight: 400;
          }
          @font-face {
            font-family: 'Vazirmatn';
            src: url('/fonts/Vazirmatn-Bold.woff2') format('woff2');
            font-weight: 700;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; color: #333; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 20px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
          .info { margin-bottom: 15px; font-size: 14px; }
          .info span { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background: #f5f5f5; font-weight: bold; }
          .summary { margin-top: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
          .summary-item { border: 1px solid #ddd; padding: 10px; text-align: center; border-radius: 5px; }
          .summary-item .value { font-size: 18px; font-weight: bold; color: #7B1113; }
          .summary-item .label { font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">گزارشات</h2>
      <div className="gold-separator" />

      {/* Filters */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">فیلتر گزارش</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              انتخاب کارمند *
            </label>
            <select
              value={selectedEmployee || ""}
              onChange={(e) =>
                setSelectedEmployee(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            >
              <option value="">-- انتخاب کنید --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.personnelCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              از تاریخ *
            </label>
            <input
              type="text"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="1403/01/01"
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              تا تاریخ *
            </label>
            <input
              type="text"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="1403/01/31"
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
              dir="ltr"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "در حال تولید..." : "تولید گزارش"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Result */}
      {report && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="px-6 py-2 bg-green-800/30 border border-green-700 text-green-400 rounded-lg text-sm hover:bg-green-800/50 transition-colors"
            >
              📥 خروجی اکسل
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-blue-800/30 border border-blue-700 text-blue-400 rounded-lg text-sm hover:bg-blue-800/50 transition-colors"
            >
              🖨️ چاپ گزارش
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 text-center">
              <p className="text-2xl font-bold text-white" dir="ltr">
                {toPersianDigits(minutesToTime(report.summary.totalWorkedMinutes))}
              </p>
              <p className="text-dark-400 text-sm mt-1">مجموع ساعات کاری</p>
            </div>
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 text-center">
              <p className="text-2xl font-bold text-red-400" dir="ltr">
                {toPersianDigits(minutesToTime(report.summary.totalDelayMinutes))}
              </p>
              <p className="text-dark-400 text-sm mt-1">مجموع تأخیرات</p>
            </div>
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 text-center">
              <p className="text-2xl font-bold text-green-400" dir="ltr">
                {toPersianDigits(minutesToTime(report.summary.totalOvertimeMinutes))}
              </p>
              <p className="text-dark-400 text-sm mt-1">مجموع اضافه‌کاری</p>
            </div>
            <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {toPersianDigits(report.summary.totalAbsences)}
              </p>
              <p className="text-dark-400 text-sm mt-1">مجموع غیبت‌ها</p>
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-700">
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    تاریخ
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    ورود
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    خروج
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    وضعیت
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    تأخیر
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    اضافه‌کاری
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    کسری
                  </th>
                  <th className="text-center px-3 py-2 text-dark-300 text-sm">
                    کل کار
                  </th>
                  <th className="text-right px-3 py-2 text-dark-300 text-sm">
                    توضیحات
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-dark-800 hover:bg-dark-800/50"
                  >
                    <td className="px-3 py-2 text-center text-white text-sm" dir="ltr">
                      {toPersianDigits(r.dateJalali)}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-300 text-sm" dir="ltr">
                      {r.checkIn || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-300 text-sm" dir="ltr">
                      {r.checkOut || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {STATUS_LABELS[r.status] || r.status}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {r.delayMinutes > 0 ? (
                        <span className="text-red-400">
                          {toPersianDigits(r.delayMinutes)} د
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {r.overtimeMinutes > 0 ? (
                        <span className="text-green-400">
                          {toPersianDigits(r.overtimeMinutes)} د
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {r.deficitMinutes > 0 ? (
                        <span className="text-yellow-400">
                          {toPersianDigits(r.deficitMinutes)} د
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-white" dir="ltr">
                      {toPersianDigits(minutesToTime(r.totalWorkedMinutes))}
                    </td>
                    <td className="px-3 py-2 text-right text-dark-400 text-sm">
                      {r.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hidden Printable Content */}
          <div className="hidden">
            <div ref={printRef}>
              <h1>{storeName}</h1>
              <div className="subtitle">گزارش حضور و غیاب</div>
              <div className="info">
                <span>نام کارمند:</span> {report.employee.fullName} |{" "}
                <span>کد پرسنلی:</span> {report.employee.personnelCode} |{" "}
                <span>سمت:</span> {report.employee.position || "-"}
              </div>
              <div className="info">
                <span>بازه گزارش:</span> {dateFrom} تا {dateTo}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>ورود</th>
                    <th>خروج</th>
                    <th>وضعیت</th>
                    <th>تأخیر (دقیقه)</th>
                    <th>اضافه‌کاری (دقیقه)</th>
                    <th>کسری (دقیقه)</th>
                    <th>ساعت کاری</th>
                    <th>توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.dateJalali}</td>
                      <td>{r.checkIn || "-"}</td>
                      <td>{r.checkOut || "-"}</td>
                      <td>{STATUS_LABELS[r.status] || r.status}</td>
                      <td>{r.delayMinutes}</td>
                      <td>{r.overtimeMinutes}</td>
                      <td>{r.deficitMinutes}</td>
                      <td>{minutesToTime(r.totalWorkedMinutes)}</td>
                      <td>{r.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="value">
                      {minutesToTime(report.summary.totalWorkedMinutes)}
                    </div>
                    <div className="label">مجموع ساعات کاری</div>
                  </div>
                  <div className="summary-item">
                    <div className="value">
                      {minutesToTime(report.summary.totalDelayMinutes)}
                    </div>
                    <div className="label">مجموع تأخیرات</div>
                  </div>
                  <div className="summary-item">
                    <div className="value">
                      {minutesToTime(report.summary.totalOvertimeMinutes)}
                    </div>
                    <div className="label">مجموع اضافه‌کاری</div>
                  </div>
                  <div className="summary-item">
                    <div className="value">
                      {report.summary.totalAbsences}
                    </div>
                    <div className="label">مجموع غیبت‌ها</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
          <span className="text-4xl mb-4 block">📈</span>
          <p className="text-dark-400">
            کارمند و بازه تاریخ را انتخاب کرده و دکمه «تولید گزارش» را بزنید
          </p>
        </div>
      )}
    </div>
  );
}
