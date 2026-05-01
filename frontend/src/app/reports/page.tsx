"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { FinanceTransaction } from "@/types/finance";
import type { Staff } from "@/types/staff";
import type { Student } from "@/types/student";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import {
  Download, FileSpreadsheet, FileText, Filter, Calendar, X,
  Users, IndianRupee, TrendingUp, Wallet, Loader2, AlertCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [reportType, setReportType] = useState<"all" | "students" | "finance" | "salary">("all");
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [txData, staffData, studentData] = await Promise.all([
        api.finance.getAll(),
        api.staff.getAll(),
        api.students.getAll(),
      ]);
      setTransactions(txData);
      setStaff(staffData);
      setStudents(studentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesDate =
        (!dateRange.start || tx.date >= dateRange.start) &&
        (!dateRange.end || tx.date <= dateRange.end);
      const matchesType =
        reportType === "all" ||
        (reportType === "finance" && tx.type !== "payroll_staff") ||
        (reportType === "salary" && tx.type === "payroll_staff");
      return matchesDate && (reportType === "all" ? true : matchesType);
    });
  }, [transactions, dateRange, reportType]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type !== "expenses" && tx.type !== "payroll_staff")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = filteredTransactions
      .filter((tx) => tx.type === "expenses")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const salary = filteredTransactions
      .filter((tx) => tx.type === "payroll_staff")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      totalStudents: students.length,
      monthlyCollection: income,
      totalExpenses: expenses + salary,
      balance: income - expenses - salary,
    };
  }, [filteredTransactions, students]);

  function isExpense(type: string) {
    return type === "expenses" || type === "payroll_staff";
  }

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expenses: number }> = {};
    filteredTransactions.forEach((tx) => {
      const month = tx.date.substring(0, 7);
      if (!months[month]) {
        months[month] = { month, income: 0, expenses: 0 };
      }
      if (isExpense(tx.type)) {
        months[month].expenses += tx.amount;
      } else {
        months[month].income += tx.amount;
      }
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  const studentGrowthData = useMemo(() => {
    const months: Record<string, { month: string; students: number }> = {};
    const sorted = [...students].sort((a, b) => a.created_at.localeCompare(b.created_at));
    sorted.forEach((s) => {
      const month = s.created_at.substring(0, 7);
      months[month] = { month, students: (months[month]?.students || 0) + 1 };
    });
    let cumulative = 0;
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => {
        cumulative += m.students;
        return { month: m.month, students: cumulative };
      });
  }, [students]);

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [filteredTransactions]);

  const staffSalarySummary = useMemo(() => {
    return staff.map((s) => {
      const paid = filteredTransactions
        .filter((tx) => tx.type === "payroll_staff" && tx.description.includes(s.name))
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        name: s.name,
        role: s.role,
        baseSalary: s.base_salary,
        paid,
        pending: s.base_salary - paid,
      };
    });
  }, [staff, filteredTransactions]);

  function exportPDF() {
    setExporting("pdf");
    try {
      const doc = new jsPDF();
      const title = t("Masjid CRM - Reports", "ಮಸ್ಜಿದ್ CRM - ವರದಿಗಳು");
      doc.setFontSize(18);
      doc.text(title, 14, 22);

      doc.setFontSize(10);
      doc.text(`${t("Generated on", "ರಚಿಸಲಾಗಿದೆ")}: ${new Date().toLocaleDateString("en-IN")}`, 14, 30);

      (doc as any).autoTable({
        startY: 40,
        head: [[t("Summary", "ಸಾರಾಂಶ")]],
        body: [
          [t("Total Students", "ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು"), summary.totalStudents.toString()],
          [t("Monthly Collection", "ಮಾಸಿಕ ಸಂಗ್ರಹ"), `₹${summary.monthlyCollection.toLocaleString("en-IN")}`],
          [t("Total Expenses", "ಒಟ್ಟು ವೆಚ್ಚಗಳು"), `₹${summary.totalExpenses.toLocaleString("en-IN")}`],
          [t("Balance", "ಬಾಕಿ"), `₹${summary.balance.toLocaleString("en-IN")}`],
        ],
      });

      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [[t("Date", "ದಿನಾಂಕ"), t("Description", "ವಿವರಣೆ"), t("Amount", "ಮೊತ್ತ")]],
        body: recentTransactions.map((tx) => [
          tx.date,
          tx.description,
          `₹${tx.amount.toLocaleString("en-IN")}`,
        ]),
      });

      doc.save("masjid-crm-reports.pdf");
    } catch (err) {
      setError("Failed to export PDF");
    } finally {
      setExporting(null);
    }
  }

  function exportExcel() {
    setExporting("excel");
    try {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        [t("Total Students", "ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು"), summary.totalStudents],
        [t("Monthly Collection", "ಮಾಸಿಕ ಸಂಗ್ರಹ"), summary.monthlyCollection],
        [t("Total Expenses", "ಒಟ್ಟು ವೆಚ್ಚಗಳು"), summary.totalExpenses],
        [t("Balance", "ಬಾಕಿ"), summary.balance],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      const txData = [
        [t("Date", "ದಿನಾಂಕ"), t("Description", "ವಿವರಣೆ"), t("Amount", "ಮೊತ್ತ")],
        ...recentTransactions.map((tx) => [tx.date, tx.description, tx.amount]),
      ];
      const txWs = XLSX.utils.aoa_to_sheet(txData);
      XLSX.utils.book_append_sheet(wb, txWs, "Transactions");

      const salaryData = [
        [t("Name", "ಹೆಸರು"), t("Role", "ಪಾತ್ರ"), t("Base Salary", "ಮೂಲ ವೇತನ"), t("Paid", "ಪಾವತಿ"), t("Pending", "ಬಾಕಿ")],
        ...staffSalarySummary.map((s) => [s.name, s.role, s.baseSalary, s.paid, s.pending]),
      ];
      const salaryWs = XLSX.utils.aoa_to_sheet(salaryData);
      XLSX.utils.book_append_sheet(wb, salaryWs, "Salary Summary");

      XLSX.writeFile(wb, "masjid-crm-reports.xlsx");
    } catch (err) {
      setError("Failed to export Excel");
    } finally {
      setExporting(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {t("Reports", "ವರದಿಗಳು")}
            </h1>
            <p className="text-sm text-green-600 mt-1">
              {t("Analytics and insights for your masjid", "ನಿಮ್ಮ ಮಸ್ಜಿದ್‌ಗಾಗಿ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಒಳನೋಟಗಳು")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              disabled={exporting !== null}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {exporting === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {t("Export PDF", "PDF ರಫ್ತು")}
            </button>
            <button
              onClick={exportExcel}
              disabled={exporting !== null}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {exporting === "excel" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              {t("Export Excel", "Excel ರಫ್ತು")}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Filter size={16} className="text-green-500 flex-shrink-0" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-green-500 text-sm">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as typeof reportType)}
              className="px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">{t("All Reports", "ಎಲ್ಲಾ ವರದಿಗಳು")}</option>
              <option value="students">{t("Students", "ವಿದ್ಯಾರ್ಥಿಗಳು")}</option>
              <option value="finance">{t("Finance", "ಹಣಕಾಸು")}</option>
              <option value="salary">{t("Salary", "ವೇತನ")}</option>
            </select>
            {(dateRange.start || dateRange.end || reportType !== "all") && (
              <button
                onClick={() => {
                  setDateRange({ start: "", end: "" });
                  setReportType("all");
                }}
                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Total Students", "ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು")}</p>
                <p className="text-xl font-bold text-green-800">{summary.totalStudents}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Monthly Collection", "ಮಾಸಿಕ ಸಂಗ್ರಹ")}</p>
                <p className="text-xl font-bold text-green-800">₹{summary.monthlyCollection.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Wallet size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Total Expenses", "ಒಟ್ಟು ವೆಚ್ಚಗಳು")}</p>
                <p className="text-xl font-bold text-red-700">₹{summary.totalExpenses.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.balance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <TrendingUp size={20} className={summary.balance >= 0 ? "text-green-600" : "text-red-600"} />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Balance", "ಬಾಕಿ")}</p>
                <p className={`text-xl font-bold ${summary.balance >= 0 ? "text-green-800" : "text-red-700"}`}>
                  ₹{summary.balance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-green-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  {t("Income vs Expenses", "ಆದಾಯ vs ವೆಚ್ಚಗಳು")}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" name={t("Income", "ಆದಾಯ")} fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name={t("Expenses", "ವೆಚ್ಚಗಳು")} fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  {t("Student Growth", "ವಿದ್ಯಾರ್ಥಿ ಬೆಳವಣಿಗೆ")}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={studentGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" name={t("Students", "ವಿದ್ಯಾರ್ಥಿಗಳು")} stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-green-100 shadow-sm">
                <div className="px-6 py-4 border-b border-green-50">
                  <h3 className="text-lg font-semibold text-green-800">
                    {t("Recent Transactions", "ಇತ್ತೀಚಿನ ವಹಿವಾಟುಗಳು")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-green-50/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Date", "ದಿನಾಂಕ")}
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Description", "ವಿವರಣೆ")}
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Amount", "ಮೊತ್ತ")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {recentTransactions.map((tx) => {
                        const isExp = isExpense(tx.type);
                        return (
                          <tr key={tx.id} className="hover:bg-green-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-green-600">{tx.date}</td>
                            <td className="px-6 py-4 text-sm text-green-700">{tx.description}</td>
                            <td className={`px-6 py-4 text-right text-sm font-semibold ${isExp ? "text-red-600" : "text-green-700"}`}>
                              {isExp ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                      {recentTransactions.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-sm text-green-500">
                            {t("No transactions found", "ಯಾವುದೇ ವಹಿವಾಟುಗಳು ಕಂಡುಬಂದಿಲ್ಲ")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-green-100 shadow-sm">
                <div className="px-6 py-4 border-b border-green-50">
                  <h3 className="text-lg font-semibold text-green-800">
                    {t("Staff Salary Summary", "ಸಿಬ್ಬಂದಿ ವೇತನ ಸಾರಾಂಶ")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-green-50/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Name", "ಹೆಸರು")}
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Base Salary", "ಮೂಲ ವೇತನ")}
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Paid", "ಪಾವತಿ")}
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase">
                          {t("Pending", "ಬಾಕಿ")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {staffSalarySummary.map((s) => (
                        <tr key={s.name} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-green-700">{s.name}</td>
                          <td className="px-6 py-4 text-right text-sm text-green-700">₹{s.baseSalary.toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-right text-sm text-green-600">₹{s.paid.toLocaleString("en-IN")}</td>
                          <td className={`px-6 py-4 text-right text-sm font-semibold ${s.pending > 0 ? "text-red-600" : "text-green-600"}`}>
                            ₹{s.pending.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                      {staffSalarySummary.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-green-500">
                            {t("No staff records found", "ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
