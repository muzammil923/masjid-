"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { FinanceTransaction, FinanceFormData, TransactionType } from "@/types/finance";
import { Plus, Pencil, Trash2, X, Search, Loader2, AlertCircle, IndianRupee } from "lucide-react";

const emptyForm: FinanceFormData = {
  type: "daily_collection",
  amount: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

const typeLabels: Record<TransactionType, { en: string; kn: string }> = {
  daily_collection: { en: "Daily Collection", kn: "ದೈನಂದಿನ ಸಂಗ್ರಹ" },
  friday_collection: { en: "Friday Collection", kn: "ಶುಕ್ರವಾರ ಸಂಗ್ರಹ" },
  donations: { en: "Donations", kn: "ದೇಣಿಗೆಗಳು" },
  expenses: { en: "Expenses", kn: "ವೆಚ್ಚಗಳು" },
  payroll_staff: { en: "Staff Salary", kn: "ಸಿಬ್ಬಂದಿ ವೇತನ" },
};

const typeColors: Record<TransactionType, string> = {
  daily_collection: "bg-green-100 text-green-700",
  friday_collection: "bg-blue-100 text-blue-700",
  donations: "bg-gold-100 text-gold-700",
  expenses: "bg-red-100 text-red-700",
  payroll_staff: "bg-purple-100 text-purple-700",
};

export default function FinancePage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [form, setForm] = useState<FinanceFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function loadTransactions() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.finance.getAll();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  function openAddModal() {
    setEditingTx(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(tx: FinanceTransaction) {
    setEditingTx(tx);
    setForm({
      type: tx.type,
      amount: tx.amount.toString(),
      description: tx.description,
      date: tx.date,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
      };
      if (editingTx) {
        const updated = await api.finance.update(editingTx.id, payload);
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === updated.id ? updated : tx))
        );
      } else {
        const created = await api.finance.create(payload);
        setTransactions((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditingTx(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.finance.delete(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const totalIncome = transactions
    .filter((tx) => tx.type !== "expenses" && tx.type !== "payroll_staff")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.type === "expenses" || tx.type === "payroll_staff")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.amount.toString().includes(search);
    const matchesType = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {t("Finance Management", "ಹಣಕಾಸು ನಿರ್ವಹಣೆ")}
            </h1>
            <p className="text-sm text-green-600 mt-1">
              {t("Track collections, donations and expenses", "ಸಂಗ್ರಹಗಳು, ದೇಣಿಗೆಗಳು ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ")}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            {t("Add Entry", "ಎಂಟ್ರಿ ಸೇರಿಸಿ")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Total Income", "ಒಟ್ಟು ಆದಾಯ")}</p>
                <p className="text-xl font-bold text-green-800">₹{totalIncome.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Total Expenses", "ಒಟ್ಟು ವೆಚ್ಚಗಳು")}</p>
                <p className="text-xl font-bold text-red-700">₹{totalExpenses.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${balance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <IndianRupee size={20} className={balance >= 0 ? "text-green-600" : "text-red-600"} />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Balance", "ಬಾಕಿ")}</p>
                <p className={`text-xl font-bold ${balance >= 0 ? "text-green-800" : "text-red-700"}`}>
                  ₹{balance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-green-100 shadow-sm">
          <div className="p-4 border-b border-green-50 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400"
              />
              <input
                type="text"
                placeholder={t("Search transactions...", "ವಹಿವಾಟುಗಳನ್ನು ಹುಡುಕಿ...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="all">{t("All Types", "ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು")}</option>
              <option value="daily_collection">{t("Daily Collection", "ದೈನಂದಿನ ಸಂಗ್ರಹ")}</option>
              <option value="friday_collection">{t("Friday Collection", "ಶುಕ್ರವಾರ ಸಂಗ್ರಹ")}</option>
              <option value="donations">{t("Donations", "ದೇಣಿಗೆಗಳು")}</option>
              <option value="expenses">{t("Expenses", "ವೆಚ್ಚಗಳು")}</option>
              <option value="payroll_staff">{t("Staff Salary", "ಸಿಬ್ಬಂದಿ ವೇತನ")}</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-green-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-green-500 text-sm">
                {t("No transactions found", "ಯಾವುದೇ ವಹಿವಾಟುಗಳು ಕಂಡುಬಂದಿಲ್ಲ")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Date", "ದಿನಾಂಕ")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Type", "ಪ್ರಕಾರ")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Description", "ವಿವರಣೆ")}
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Amount", "ಮೊತ್ತ")}
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Actions", "ಕ್ರಿಯೆಗಳು")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-green-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-green-600">
                        {new Date(tx.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[tx.type]}`}>
                          {t(typeLabels[tx.type].en, typeLabels[tx.type].kn)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-green-700">
                        {tx.description || "—"}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${tx.type === "expenses" || tx.type === "payroll_staff" ? "text-red-600" : "text-green-700"}`}>
                        {tx.type === "expenses" || tx.type === "payroll_staff" ? "-" : "+"}₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                            title={t("Edit", "ತಿದ್ದು")}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(tx.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title={t("Delete", "ಅಳಿಸು")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-3 border-t border-green-50 text-xs text-green-500">
            {t("Total", "ಒಟ್ಟು")}: {filtered.length} / {transactions.length}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-800">
                {editingTx
                  ? t("Edit Transaction", "ವಹಿವಾಟು ತಿದ್ದು")
                  : t("Add Transaction", "ವಹಿವಾಟು ಸೇರಿಸಿ")}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-green-50 text-green-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Type", "ಪ್ರಕಾರ")}
                </label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="daily_collection">{t("Daily Collection", "ದೈನಂದಿನ ಸಂಗ್ರಹ")}</option>
                  <option value="friday_collection">{t("Friday Collection", "ಶುಕ್ರವಾರ ಸಂಗ್ರಹ")}</option>
                  <option value="donations">{t("Donations", "ದೇಣಿಗೆಗಳು")}</option>
                  <option value="expenses">{t("Expenses", "ವೆಚ್ಚಗಳು")}</option>
                  <option value="payroll_staff">{t("Staff Salary", "ಸಿಬ್ಬಂದಿ ವೇತನ")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Amount (₹)", "ಮೊತ್ತ (₹)")}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter amount", "ಮೊತ್ತ ನಮೂದಿಸಿ")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Date", "ದಿನಾಂಕ")}
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Description", "ವಿವರಣೆ")}
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Optional note", "ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  {t("Cancel", "ರದ್ದು")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingTx
                    ? t("Update", "ನವೀಕರಿಸಿ")
                    : t("Add Entry", "ಎಂಟ್ರಿ ಸೇರಿಸಿ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {t("Delete Transaction?", "ವಹಿವಾಟು ಅಳಿಸುವುದೇ?")}
            </h3>
            <p className="text-sm text-green-600 mb-6">
              {t(
                "This action cannot be undone.",
                "ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ."
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                {t("Cancel", "ರದ್ದು")}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {t("Delete", "ಅಳಿಸು")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
