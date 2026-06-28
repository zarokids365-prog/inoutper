"use client";

import { useEffect, useState, useCallback } from "react";
import LoginPage from "@/components/LoginPage";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import EmployeeManagement from "@/components/EmployeeManagement";
import AttendanceRegistration from "@/components/AttendanceRegistration";
import Reports from "@/components/Reports";
import SettingsPage from "@/components/SettingsPage";

type Page = "dashboard" | "employees" | "attendance" | "reports" | "settings";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginRequired, setLoginRequired] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [storeName, setStoreName] = useState("InOutZaro");

  const init = useCallback(async () => {
    try {
      // Initialize settings
      await fetch("/api/init", { method: "POST" });

      // Check if login is required
      const authRes = await fetch("/api/auth");
      const authData = await authRes.json();
      setLoginRequired(authData.loginEnabled);

      if (!authData.loginEnabled) {
        setAuthenticated(true);
      }

      // Get store name
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.store_name) {
        setStoreName(settingsData.store_name);
      }
    } catch {
      // If init fails, still show login
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const handleLogin = () => {
    setAuthenticated(true);
  };

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-velvet-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-300 text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (loginRequired && !authenticated) {
    return <LoginPage onLogin={handleLogin} storeName={storeName} />;
  }

  return (
    <div className="flex min-h-screen bg-dark-950">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        storeName={storeName}
      />
      <main className="flex-1 p-6 overflow-auto mr-64">
        <div className="animate-fade-in">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "employees" && <EmployeeManagement />}
          {currentPage === "attendance" && <AttendanceRegistration />}
          {currentPage === "reports" && <Reports />}
          {currentPage === "settings" && (
            <SettingsPage onStoreNameChange={handleStoreNameChange} />
          )}
        </div>
      </main>
    </div>
  );
}
