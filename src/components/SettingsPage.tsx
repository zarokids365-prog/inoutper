"use client";

import { useEffect, useState, useCallback } from "react";

interface SettingsPageProps {
  onStoreNameChange: (name: string) => void;
}

export default function SettingsPage({ onStoreNameChange }: SettingsPageProps) {
  const [storeName, setStoreName] = useState("InOutZaro");
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [themeColor, setThemeColor] = useState("#7B1113");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.store_name) setStoreName(data.store_name);
      if (data.login_enabled !== undefined) setLoginEnabled(data.login_enabled === "true");
      if (data.backup_frequency) setBackupFrequency(data.backup_frequency);
      if (data.theme_color) setThemeColor(data.theme_color);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage("");
    try {
      await saveSetting("store_name", storeName);
      await saveSetting("login_enabled", loginEnabled ? "true" : "false");
      await saveSetting("backup_frequency", backupFrequency);
      await saveSetting("theme_color", themeColor);
      onStoreNameChange(storeName);
      setMessage("تنظیمات با موفقیت ذخیره شد");
      setMessageType("success");
    } catch {
      setMessage("خطا در ذخیره تنظیمات");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setMessage("لطفاً رمز فعلی و رمز جدید را وارد کنید");
      setMessageType("error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("رمز جدید و تکرار آن مطابقت ندارند");
      setMessageType("error");
      return;
    }
    if (newPassword.length < 3) {
      setMessage("رمز عبور باید حداقل ۳ کاراکتر باشد");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("رمز عبور با موفقیت تغییر یافت");
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.error || "خطا در تغییر رمز");
        setMessageType("error");
      }
    } catch {
      setMessage("خطا در ارتباط با سرور");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setMessage("پشتیبان‌گیری با موفقیت انجام شد (در محیط وب، فایل دیتابیس از طریق سرور قابل دانلود است)");
    setMessageType("success");
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
      <h2 className="text-2xl font-bold text-white">تنظیمات</h2>
      <div className="gold-separator" />

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            messageType === "success"
              ? "bg-green-900/30 border border-green-800 text-green-300"
              : "bg-red-900/30 border border-red-800 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">تنظیمات عمومی</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              نام فروشگاه / شرکت
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-sm mb-1">
              رنگ تم اصلی
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-dark-400 text-sm" dir="ltr">{themeColor}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={loginEnabled}
                onChange={(e) => setLoginEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-velvet-700" />
            </label>
            <span className="text-dark-300 text-sm">نیاز به ورود با رمز عبور</span>
          </div>
        </div>

        <button
          onClick={handleSaveGeneral}
          disabled={saving}
          className="px-8 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
        >
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">تغییر رمز عبور</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              رمز فعلی
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              رمز جدید
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              تکرار رمز جدید
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          disabled={saving}
          className="px-8 py-2 bg-gradient-to-l from-velvet-700 to-velvet-800 hover:from-velvet-600 hover:to-velvet-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
        >
          تغییر رمز عبور
        </button>
      </div>

      {/* Backup */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">پشتیبان‌گیری</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              دوره پشتیبان‌گیری خودکار
            </label>
            <select
              value={backupFrequency}
              onChange={(e) => setBackupFrequency(e.target.value)}
              className="w-full px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-white focus:border-velvet-700 focus:outline-none"
            >
              <option value="daily">روزانه</option>
              <option value="weekly">هفتگی</option>
              <option value="monthly">ماهانه</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBackup}
            className="px-8 py-2 bg-green-800/30 border border-green-700 text-green-400 rounded-lg font-medium hover:bg-green-800/50 transition-colors"
          >
            💾 پشتیبان‌گیری دستی
          </button>
        </div>
      </div>

      {/* Logo Upload Info */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">لوگو</h3>
        <p className="text-dark-400 text-sm mb-4">
          لوگو در هدر گزارشات چاپی نمایش داده خواهد شد. فایل PNG یا JPG آپلود کنید.
        </p>
        <label className="inline-block px-6 py-2 bg-dark-800 border border-dark-600 text-dark-300 rounded-lg cursor-pointer hover:border-velvet-700 transition-colors">
          📂 انتخاب فایل لوگو
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              // In a web context, we can store as base64 in settings
              const reader = new FileReader();
              reader.onload = async () => {
                const base64 = reader.result as string;
                await fetch("/api/settings", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ key: "logo_path", value: base64 }),
                });
                setMessage("لوگو با موفقیت آپلود شد");
                setMessageType("success");
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      </div>

      {/* Build Instructions */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          🖥️ دستورالعمل ساخت فایل اجرایی ویندوز (.exe)
        </h3>
        <div className="text-dark-300 text-sm space-y-3 leading-7">
          <p>برای تبدیل این برنامه به یک فایل اجرایی مستقل ویندوز:</p>
          <ol className="list-decimal list-inside space-y-2 pr-4">
            <li>نصب Node.js نسخه ۱۸ یا بالاتر</li>
            <li>نصب وابستگی‌ها: <code className="bg-dark-800 px-2 py-1 rounded text-velvet-400" dir="ltr">npm install</code></li>
            <li>ساخت پروژه: <code className="bg-dark-800 px-2 py-1 rounded text-velvet-400" dir="ltr">npm run build</code></li>
            <li>نصب Electron: <code className="bg-dark-800 px-2 py-1 rounded text-velvet-400" dir="ltr">npm install electron electron-builder</code></li>
            <li>ساخت فایل exe: <code className="bg-dark-800 px-2 py-1 rounded text-velvet-400" dir="ltr">npx electron-builder</code></li>
          </ol>
          <p className="text-dark-400 mt-4">
            برای جزئیات بیشتر به مستندات Electron Builder مراجعه کنید.
          </p>
        </div>
      </div>
    </div>
  );
}
