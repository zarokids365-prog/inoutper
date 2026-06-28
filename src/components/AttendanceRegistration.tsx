"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTodayJalaliStr,
  toPersianDigits,
  minutesToTime,
  getDayOfWeekFromJalali,
  getWeekdayName,
} from "@/lib/jalali";

interface Employee {
  id: number;
  fullName: string;
  personnelCode: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
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

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "leave", label: "مرخصی" },
  { value: "dayoff", label: "تعطیل" },
  { value: "absent", label: "غایب" },
];

export default function AttendanceRegistration() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [dateJalali, setDateJalali] = useState(getTodayJalaliStr());
  const [checkIn, setCheckIn] = useState("08:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [status, setStatus] = useState("present");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayRecords = useCallback(async () => {
    try {
      const today = getTodayJalaliStr();
      const res = await fetch(`/api/attendance?date=${today}`);
      const data = await res.json();
      setTodayRecords(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchTodayRecords();
  }, [fetchEmployees, fetchTodayRecords]);

  const handleSave = async () => {
    if (!selectedEmployee) {
      setMessage("لطفاً کارمند را انتخاب کنید");
      setMessageType("error");
      return;
    }
    if (!dateJalali) {
      setMessage("لطفاً تاریخ را وارد کنید");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          dateJalali,
          checkIn: status === "present" ? checkIn : null,
          checkOut: status === "present" ? checkOut : null,
          status,
          description: description || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
        setMessageType("error");
      } else {
        setMessage(data.updated ? "رکورد با موفقیت بروزرسانی شد" : "حضور با موفقیت ثبت شد");
        setMessageType("success");
        fetchTodayRecords();
      }
    } catch {
      setMessage("خطا در ثبت اطلاعات");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const getEmployeeName = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.fullName : "-";
  };

  const getStatusLabel = (s: string) => {
    const found = STATUS_OPTIONS.find((o) => o.value === s);
    return found ? found.label : s;
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "present":
        return "bg-green-900/30 text-green-400";
      case "leave":
        return "bg-yellow-900/30 text-yellow-400";
      case "dayoff":
        return "bg-blue-900/30 text-blue-400";
      case "absent":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-dark-700 text-dark-300";
    }
  };

  let dayName = "";
  try {
    const dow = getDayOfWeekFromJalali(dateJalali);
    dayName = getWeekdayName(dow);
  } catch {
    // ignore invalid date
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-velvet-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">ثبت حضور و غیاب</h2>
      <div className="gold-separator" />

      {/* Registration Form */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">ثبت رکورد جدید</h3>

        {message && (
          <div
            className={`px-4 py-2 rounded-lg text-sm mb-4 ${
              messageType === "success"
                ? "bg-green-900/30 border border-green-800 text-green-300"
                : "bg-red-900/30 border border-red-800 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Employee Selection */}
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

          {/* Date */}
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              تاریخ شمسی *
            </label>
            <input
              type="text"
              value={dateJalali}
              onChange={(e) => setDateJalali(e.target.value)}
              placeholder="1403/01/15"
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
              dir="ltr"
            />
            {dayName && (
              <p className="text-dark-400 text-xs mt-1">{dayName}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-dark-300 text-sm mb-1">وضعیت</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Check-in / Check-out only for present */}
          {status === "present" && (
            <>
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  ساعت ورود
                </label>
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  ساعت خروج
                </label>
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Description */}
          <div className={status === "present" ? "" : "md:col-span-2"}>
            <label className="block text-dark-300 text-sm mb-1">توضیحات</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
              placeholder="توضیحات (اختیاری)"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
        >
          {saving ? "در حال ثبت..." : "ثبت حضور"}
        </button>
      </div>

      {/* Today's Records */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          رکوردهای امروز ({toPersianDigits(getTodayJalaliStr())})
        </h3>

        {todayRecords.length === 0 ? (
          <p className="text-dark-400 text-center py-6">
            هنوز رکوردی برای امروز ثبت نشده
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-800 border-b border-dark-700">
                  <th className="text-right px-3 py-2 text-dark-300 text-sm">
                    نام
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
                    کل کار
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-dark-800 hover:bg-dark-800/50"
                  >
                    <td className="px-3 py-2 text-white text-sm">
                      {getEmployeeName(r.employeeId)}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-300 text-sm" dir="ltr">
                      {r.checkIn || "-"}
                    </td>
                    <td className="px-3 py-2 text-center text-dark-300 text-sm" dir="ltr">
                      {r.checkOut || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          r.status
                        )}`}
                      >
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {r.delayMinutes > 0 ? (
                        <span className="text-red-400">
                          {toPersianDigits(minutesToTime(r.delayMinutes))}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm">
                      {r.overtimeMinutes > 0 ? (
                        <span className="text-green-400">
                          {toPersianDigits(minutesToTime(r.overtimeMinutes))}
                        </span>
                      ) : (
                        <span className="text-dark-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-white" dir="ltr">
                      {toPersianDigits(minutesToTime(r.totalWorkedMinutes))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
