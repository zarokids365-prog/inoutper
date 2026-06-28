"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getFormattedJalaliDate,
  toPersianDigits,
  minutesToTime,
} from "@/lib/jalali";

interface DashboardData {
  today: string;
  totalEmployees: number;
  presentCount: number;
  totalWorkedMinutes: number;
  totalDelayMinutes: number;
  totalOvertimeMinutes: number;
  hasDelays: boolean;
  hasOvertime: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [clock, setClock] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      setData(d);
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Live clock
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-velvet-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const jalaliDate = getFormattedJalaliDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">داشبورد</h2>
        <div className="text-left">
          <div className="text-3xl font-bold text-velvet-500 font-mono tracking-widest" dir="ltr">
            {toPersianDigits(clock)}
          </div>
          <div className="text-dark-400 text-sm">{toPersianDigits(jalaliDate)}</div>
        </div>
      </div>

      <div className="gold-separator" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-velvet-800/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-dark-400 text-sm">کل کارکنان فعال</p>
              <p className="text-2xl font-bold text-white">
                {toPersianDigits(data?.totalEmployees || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-velvet-800/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-900/30 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-dark-400 text-sm">حاضرین امروز</p>
              <p className="text-2xl font-bold text-green-400">
                {toPersianDigits(data?.presentCount || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Worked Hours */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-velvet-800/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
            <div>
              <p className="text-dark-400 text-sm">مجموع ساعت کاری امروز</p>
              <p className="text-2xl font-bold text-white" dir="ltr">
                {toPersianDigits(minutesToTime(data?.totalWorkedMinutes || 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-velvet-800/50 transition-colors">
          <div className="space-y-3">
            {/* Delay Alert */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  data?.hasDelays
                    ? "bg-red-500 animate-pulse"
                    : "bg-dark-600"
                }`}
              />
              <span
                className={`text-sm ${
                  data?.hasDelays ? "text-red-400" : "text-dark-400"
                }`}
              >
                تأخیر:{" "}
                {toPersianDigits(
                  minutesToTime(data?.totalDelayMinutes || 0)
                )}
              </span>
            </div>
            {/* Overtime */}
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  data?.hasOvertime
                    ? "bg-green-500 animate-pulse"
                    : "bg-dark-600"
                }`}
              />
              <span
                className={`text-sm ${
                  data?.hasOvertime ? "text-green-400" : "text-dark-400"
                }`}
              >
                اضافه‌کاری:{" "}
                {toPersianDigits(
                  minutesToTime(data?.totalOvertimeMinutes || 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">راهنمای سریع</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-dark-300">
          <div className="flex items-start gap-3">
            <span className="text-velvet-500 mt-1">●</span>
            <p>از بخش «مدیریت کارکنان» برای افزودن کارمند و تعریف برنامه کاری استفاده کنید.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-velvet-500 mt-1">●</span>
            <p>در بخش «ثبت حضور و غیاب» ساعات ورود و خروج را ثبت نمایید.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-velvet-500 mt-1">●</span>
            <p>بخش «گزارشات» امکان مشاهده و خروجی اکسل را فراهم می‌کند.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-velvet-500 mt-1">●</span>
            <p>در «تنظیمات» نام فروشگاه، رمز عبور و پشتیبان‌گیری را مدیریت کنید.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
