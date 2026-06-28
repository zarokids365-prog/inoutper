"use client";

type Page = "dashboard" | "employees" | "attendance" | "reports" | "settings";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  storeName: string;
}

const menuItems: { key: Page; label: string; icon: string }[] = [
  { key: "dashboard", label: "داشبورد", icon: "📊" },
  { key: "employees", label: "مدیریت کارکنان", icon: "👥" },
  { key: "attendance", label: "ثبت حضور و غیاب", icon: "📋" },
  { key: "reports", label: "گزارشات", icon: "📈" },
  { key: "settings", label: "تنظیمات", icon: "⚙️" },
];

export default function Sidebar({
  currentPage,
  onPageChange,
  storeName,
}: SidebarProps) {
  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-dark-900 border-l border-dark-700 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-velvet-700 to-velvet-900 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">⏰</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              {storeName}
            </h1>
            <p className="text-dark-400 text-xs">حضور و غیاب</p>
          </div>
        </div>
        <div className="gold-separator mt-4" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onPageChange(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
              currentPage === item.key
                ? "bg-gradient-to-l from-velvet-700/30 to-velvet-900/20 text-white border border-velvet-800/50"
                : "text-dark-300 hover:bg-dark-800 hover:text-white"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700">
        <p className="text-dark-500 text-xs text-center">
          نسخه ۱.۰.۰ | InOutZaro
        </p>
      </div>
    </aside>
  );
}
