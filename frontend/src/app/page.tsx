"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { Student } from "@/types/student";
import type { FinanceTransaction } from "@/types/finance";
import { Users, UserCheck, Wallet, TrendingUp, Loader2 } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    monthlyRevenue: 0,
    totalExpenses: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{ en: string; kn: string; time: string }>>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        const [students, staff, transactions] = await Promise.all([
          api.students.getAll(),
          api.staff.getAll(),
          api.finance.getAll(),
        ]);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTransactions = transactions.filter((tx: FinanceTransaction) => {
          const txDate = new Date(tx.date);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });

        const monthlyRevenue = monthlyTransactions
          .filter((tx: FinanceTransaction) => tx.type !== "expenses" && tx.type !== "payroll_staff")
          .reduce((sum: number, tx: FinanceTransaction) => sum + tx.amount, 0);

        const totalExpenses = monthlyTransactions
          .filter((tx: FinanceTransaction) => tx.type === "expenses" || tx.type === "payroll_staff")
          .reduce((sum: number, tx: FinanceTransaction) => sum + tx.amount, 0);

        setStats({
          totalStudents: students.length,
          totalStaff: staff.length,
          monthlyRevenue,
          totalExpenses,
        });

        const activities: Array<{ en: string; kn: string; time: string }> = [];
        
        students.slice(-3).reverse().forEach((student: Student) => {
          const timeAgo = Math.floor((Date.now() - new Date(student.created_at).getTime()) / 60000);
          activities.push({
            en: `Student ${student.name} enrolled`,
            kn: `ವಿದ್ಯಾರ್ಥಿ ${student.name} ಸೇರಿದ್ದಾರೆ`,
            time: timeAgo < 60 ? `${timeAgo} min ago` : `${Math.floor(timeAgo / 60)} hours ago`,
          });
        });

        transactions.slice(-3).reverse().forEach((tx: FinanceTransaction) => {
          const timeAgo = Math.floor((Date.now() - new Date(tx.date).getTime()) / 60000);
          activities.push({
            en: `Payment of ₹${tx.amount} recorded`,
            kn: `₹${tx.amount} ಪಾವತಿ ದಾಖಲಾಗಿದೆ`,
            time: timeAgo < 60 ? `${timeAgo} min ago` : `${Math.floor(timeAgo / 60)} hours ago`,
          });
        });

        setRecentActivities(activities.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-green-800">{t("Dashboard Overview", "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನ")}</h1>
          <p className="text-green-600 text-sm mt-1">{t("Welcome to your Masjid CRM dashboard", "ನಿಮ್ಮ ಮಸೀದ್ CRM ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸ್ವಾಗತ")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                <Users size={22} className="text-white" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-green-900">{stats.totalStudents}</p>
            <p className="text-sm text-green-600 mt-1">{t("Total Students", "ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು")}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-green-700 flex items-center justify-center">
                <UserCheck size={22} className="text-white" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-green-900">{stats.totalStaff}</p>
            <p className="text-sm text-green-600 mt-1">{t("Total Staff", "ಒಟ್ಟು ಸಿಬ್ಬಂದಿ")}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-green-800 flex items-center justify-center">
                <Wallet size={22} className="text-white" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-green-900">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</p>
            <p className="text-sm text-green-600 mt-1">{t("Monthly Revenue", "ಮಾಸಿಕ ಆದಾಯ")}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
                <TrendingUp size={22} className="text-white" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-bold text-red-700">₹{stats.totalExpenses.toLocaleString("en-IN")}</p>
            <p className="text-sm text-green-600 mt-1">{t("Monthly Expenses", "ಮಾಸಿಕ ವೆಚ್ಚಗಳು")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">{t("Recent Activity", "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ")}</h3>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-green-500">{t("No recent activities", "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆಗಳಿಲ್ಲ")}</p>
              ) : (
                recentActivities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-green-50 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-green-800">{activity.en}</p>
                      <p className="text-xs text-green-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">{t("Quick Actions", "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು")}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { en: "Add Student", kn: "ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ" },
                { en: "Record Payment", kn: "ಪಾವತಿ ದಾಖಲಿಸಿ" },
                { en: "Add Staff", kn: "ಸಿಬ್ಬಂದಿ ಸೇರಿಸಿ" },
                { en: "View Reports", kn: "ವರದಿಗಳು ವೀಕ್ಷಿಸಿ" },
              ].map((action) => (
                <button
                  key={action.en}
                  className="px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
                >
                  {action.en}
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="text-sm font-semibold text-green-800">{t("Monthly Summary", "ಮಾಸಿಕ ಸಾರಾಂಶ")}</h4>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats.monthlyRevenue > 0 ? Math.min(100, (stats.monthlyRevenue / (stats.monthlyRevenue + stats.totalExpenses || 1)) * 100) : 0}%` 
                  }} 
                />
              </div>
              <p className="text-xs text-green-700 mt-1">
                {t("Revenue vs Expenses tracking", "ಆದಾಯ vs ವೆಚ್ಚ ಟ್ರ್ಯಾಕಿಂಗ್")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
