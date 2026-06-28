import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "InOutZaro - سیستم مدیریت حضور و غیاب",
  description: "سیستم جامع مدیریت حضور و غیاب کارکنان",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
