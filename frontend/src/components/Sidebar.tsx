"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  LayoutDashboard, Users, UserCheck, Wallet,
  UserSquare2, FileText, Settings, Menu, X,
} from "lucide-react";

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, href: "/" },
  { key: "students", icon: Users, href: "/students" },
  { key: "parents", icon: UserCheck, href: "/parents" },
  { key: "finance", icon: Wallet, href: "/finance" },
  { key: "staff", icon: UserSquare2, href: "/staff" },
  { key: "reports", icon: FileText, href: "/reports" },
  { key: "settings", icon: Settings, href: "/settings" },
];

const navLabels: Record<string, { en: string; kn: string }> = {
  dashboard: { en: "Dashboard", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" },
  students: { en: "Students", kn: "ವಿದ್ಯಾರ್ಥಿಗಳು" },
  parents: { en: "Parents", kn: "ಪೋಷಕರು" },
  finance: { en: "Finance", kn: "ಹಣಕಾಸು" },
  staff: { en: "Staff", kn: "ಸಿಬ್ಬಂದಿ" },
  reports: { en: "Reports", kn: "ವರದಿಗಳು" },
  settings: { en: "Settings", kn: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು" },
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-green-700 text-white shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-green-800 text-white transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-green-700">
          <h1 className="text-xl font-bold">Masjid CRM</h1>
          <p className="text-green-300 text-xs mt-1">Management System</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-700 text-white"
                    : "text-green-200 hover:bg-green-700/50"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{t(navLabels[item.key].en, navLabels[item.key].kn)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <p className="text-green-300 text-xs text-center">Masjid CRM v1.0</p>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
