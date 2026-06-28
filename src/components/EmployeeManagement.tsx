"use client";

import { useEffect, useState, useCallback } from "react";
import { getWeekdayNames } from "@/lib/jalali";

interface Employee {
  id: number;
  fullName: string;
  personnelCode: string;
  position: string;
  isActive: boolean;
}

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
}

const WEEKDAYS = getWeekdayNames();

function getDefaultSchedules(): Schedule[] {
  return WEEKDAYS.map((_, i) => ({
    dayOfWeek: i,
    startTime: "08:00",
    endTime: "17:00",
    isDayOff: i === 6, // Friday off by default
  }));
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    personnelCode: "",
    position: "",
    isActive: true,
  });
  const [schedules, setSchedules] = useState<Schedule[]>(getDefaultSchedules());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSpecialDays, setShowSpecialDays] = useState<number | null>(null);
  const [specialForm, setSpecialForm] = useState({
    dateJalali: "",
    type: "personal_off" as string,
    startTime: "",
    endTime: "",
    description: "",
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openAddForm = () => {
    setEditing(null);
    setFormData({ fullName: "", personnelCode: "", position: "", isActive: true });
    setSchedules(getDefaultSchedules());
    setShowForm(true);
    setError("");
  };

  const openEditForm = async (emp: Employee) => {
    setEditing(emp);
    setFormData({
      fullName: emp.fullName,
      personnelCode: emp.personnelCode,
      position: emp.position,
      isActive: emp.isActive,
    });
    // Load schedules
    try {
      const res = await fetch(`/api/schedules?employeeId=${emp.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const scheds = getDefaultSchedules();
        for (const d of data) {
          const idx = scheds.findIndex((s) => s.dayOfWeek === d.dayOfWeek);
          if (idx >= 0) {
            scheds[idx] = {
              dayOfWeek: d.dayOfWeek,
              startTime: d.startTime,
              endTime: d.endTime,
              isDayOff: d.isDayOff,
            };
          }
        }
        setSchedules(scheds);
      } else {
        setSchedules(getDefaultSchedules());
      }
    } catch {
      setSchedules(getDefaultSchedules());
    }
    setShowForm(true);
    setError("");
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.personnelCode) {
      setError("نام و کد پرسنلی الزامی است");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formData,
        schedules,
        ...(editing ? { id: editing.id } : {}),
      };
      const res = await fetch("/api/employees", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShowForm(false);
        fetchEmployees();
      }
    } catch {
      setError("خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این کارمند اطمینان دارید؟")) return;
    try {
      await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      fetchEmployees();
    } catch {
      // ignore
    }
  };

  const handleScheduleChange = (
    index: number,
    field: keyof Schedule,
    value: string | boolean
  ) => {
    setSchedules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSpecialDaySave = async () => {
    if (!showSpecialDays || !specialForm.dateJalali) return;
    try {
      await fetch("/api/special-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: showSpecialDays,
          ...specialForm,
        }),
      });
      setSpecialForm({
        dateJalali: "",
        type: "personal_off",
        startTime: "",
        endTime: "",
        description: "",
      });
      alert("روز ویژه با موفقیت ثبت شد");
    } catch {
      alert("خطا در ثبت");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-velvet-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">مدیریت کارکنان</h2>
        <button
          onClick={openAddForm}
          className="px-6 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300"
        >
          + افزودن کارمند
        </button>
      </div>

      <div className="gold-separator" />

      {/* Employee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-10 overflow-auto">
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 w-full max-w-3xl mx-4 mb-10 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">
              {editing ? "ویرایش کارمند" : "افزودن کارمند جدید"}
            </h3>
            <div className="gold-separator mb-4" />

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  کد پرسنلی *
                </label>
                <input
                  type="text"
                  value={formData.personnelCode}
                  onChange={(e) =>
                    setFormData({ ...formData, personnelCode: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-1">سمت</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velvet-700" />
                </label>
                <span className="text-dark-300 text-sm">فعال</span>
              </div>
            </div>

            {/* Weekly Schedule */}
            <h4 className="text-lg font-bold text-white mb-3">
              برنامه کاری هفتگی
            </h4>
            <div className="space-y-2 mb-6">
              {schedules.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-dark-800 rounded-lg p-3"
                >
                  <span className="text-dark-300 text-sm w-24 shrink-0">
                    {WEEKDAYS[i]}
                  </span>
                  <label className="flex items-center gap-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={s.isDayOff}
                      onChange={(e) =>
                        handleScheduleChange(i, "isDayOff", e.target.checked)
                      }
                      className="accent-velvet-700"
                    />
                    <span className="text-dark-400 text-xs">تعطیل</span>
                  </label>
                  {!s.isDayOff && (
                    <>
                      <label className="text-dark-400 text-xs shrink-0">
                        شروع:
                      </label>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) =>
                          handleScheduleChange(i, "startTime", e.target.value)
                        }
                        className="px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:border-velvet-700 focus:outline-none"
                      />
                      <label className="text-dark-400 text-xs shrink-0">
                        پایان:
                      </label>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) =>
                          handleScheduleChange(i, "endTime", e.target.value)
                        }
                        className="px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:border-velvet-700 focus:outline-none"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
              >
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Special Days Modal */}
      {showSpecialDays !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 w-full max-w-lg mx-4 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4">
              تعریف روز ویژه
            </h3>
            <div className="gold-separator mb-4" />

            <div className="space-y-4">
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  تاریخ شمسی (مثال: ۱۴۰۳/۰۱/۱۵)
                </label>
                <input
                  type="text"
                  value={specialForm.dateJalali}
                  onChange={(e) =>
                    setSpecialForm({
                      ...specialForm,
                      dateJalali: e.target.value,
                    })
                  }
                  placeholder="1403/01/15"
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-dark-300 text-sm mb-1">نوع</label>
                <select
                  value={specialForm.type}
                  onChange={(e) =>
                    setSpecialForm({ ...specialForm, type: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                >
                  <option value="personal_off">مرخصی شخصی</option>
                  <option value="leave">مرخصی</option>
                  <option value="special_work">ساعت کاری ویژه (تعطیلات رسمی)</option>
                </select>
              </div>
              {specialForm.type === "special_work" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-dark-300 text-sm mb-1">
                      شروع
                    </label>
                    <input
                      type="time"
                      value={specialForm.startTime}
                      onChange={(e) =>
                        setSpecialForm({
                          ...specialForm,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-300 text-sm mb-1">
                      پایان
                    </label>
                    <input
                      type="time"
                      value={specialForm.endTime}
                      onChange={(e) =>
                        setSpecialForm({
                          ...specialForm,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-dark-300 text-sm mb-1">
                  توضیحات
                </label>
                <textarea
                  value={specialForm.description}
                  onChange={(e) =>
                    setSpecialForm({
                      ...specialForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowSpecialDays(null)}
                className="px-6 py-2 bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600 transition-colors"
              >
                بستن
              </button>
              <button
                onClick={handleSpecialDaySave}
                className="px-6 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 text-white rounded-lg font-medium transition-all duration-300"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      {employees.length === 0 ? (
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-12 text-center">
          <span className="text-4xl mb-4 block">👥</span>
          <p className="text-dark-400">هنوز کارمندی ثبت نشده است</p>
          <p className="text-dark-500 text-sm mt-1">
            از دکمه «افزودن کارمند» استفاده کنید
          </p>
        </div>
      ) : (
        <div className="bg-dark-900 rounded-xl border border-dark-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-800 border-b border-dark-700">
                <th className="text-right px-4 py-3 text-dark-300 text-sm font-medium">
                  نام
                </th>
                <th className="text-right px-4 py-3 text-dark-300 text-sm font-medium">
                  کد پرسنلی
                </th>
                <th className="text-right px-4 py-3 text-dark-300 text-sm font-medium">
                  سمت
                </th>
                <th className="text-center px-4 py-3 text-dark-300 text-sm font-medium">
                  وضعیت
                </th>
                <th className="text-center px-4 py-3 text-dark-300 text-sm font-medium">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-dark-800 hover:bg-dark-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-white">{emp.fullName}</td>
                  <td className="px-4 py-3 text-dark-300">{emp.personnelCode}</td>
                  <td className="px-4 py-3 text-dark-300">{emp.position || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        emp.isActive
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {emp.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditForm(emp)}
                        className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-lg text-xs hover:bg-blue-900/50 transition-colors"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => setShowSpecialDays(emp.id)}
                        className="px-3 py-1 bg-purple-900/30 text-purple-400 rounded-lg text-xs hover:bg-purple-900/50 transition-colors"
                      >
                        روز ویژه
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg text-xs hover:bg-red-900/50 transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
