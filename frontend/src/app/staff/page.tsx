"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { Staff, StaffRole, StaffFormData, PayrollRecord, PayrollFormData } from "@/types/staff";
import { roleLabels } from "@/types/staff";
import {
  Plus, Pencil, Trash2, X, Loader2, AlertCircle,
  Wallet, Calendar, ChevronDown, ChevronUp, CheckCircle,
  Users, IndianRupee
} from "lucide-react";

const emptyStaffForm: StaffFormData = {
  name: "",
  role: "teacher",
  base_salary: "",
  phone: "",
};

const emptyPayrollForm: PayrollFormData = {
  bonus: "0",
  deduction: "0",
  notes: "",
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const monthLabels: Record<string, { en: string; kn: string }> = {
  January: { en: "January", kn: "ಜನವರಿ" },
  February: { en: "February", kn: "ಫೆಬ್ರವರಿ" },
  March: { en: "March", kn: "ಮಾರ್ಚ್" },
  April: { en: "April", kn: "ಏಪ್ರಿಲ್" },
  May: { en: "May", kn: "ಮೇ" },
  June: { en: "June", kn: "ಜೂನ್" },
  July: { en: "July", kn: "ಜುಲೈ" },
  August: { en: "August", kn: "ಆಗಸ್ಟ್" },
  September: { en: "September", kn: "ಸೆಪ್ಟೆಂಬರ್" },
  October: { en: "October", kn: "ಅಕ್ಟೋಬರ್" },
  November: { en: "November", kn: "ನವೆಂಬರ್" },
  December: { en: "December", kn: "ಡಿಸೆಂಬರ್" },
};

export default function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState<StaffFormData>(emptyStaffForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<Record<string, PayrollRecord[]>>({});
  const [payrollLoading, setPayrollLoading] = useState<Record<string, boolean>>({});
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [selectedStaffForPayroll, setSelectedStaffForPayroll] = useState<Staff | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollFormData>(emptyPayrollForm);
  const [payrollSubmitting, setPayrollSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.staff.getAll();
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  async function loadPayroll(staffId: string) {
    try {
      setPayrollLoading((prev) => ({ ...prev, [staffId]: true }));
      const data = await api.staff.getPayroll(staffId);
      setPayrollRecords((prev) => ({ ...prev, [staffId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payroll");
    } finally {
      setPayrollLoading((prev) => ({ ...prev, [staffId]: false }));
    }
  }

  function toggleExpand(id: string) {
    if (expandedStaff === id) {
      setExpandedStaff(null);
    } else {
      setExpandedStaff(id);
      if (!payrollRecords[id]) {
        loadPayroll(id);
      }
    }
  }

  function openAddStaff() {
    setEditingStaff(null);
    setStaffForm(emptyStaffForm);
    setStaffModalOpen(true);
  }

  function openEditStaff(s: Staff) {
    setEditingStaff(s);
    setStaffForm({
      name: s.name,
      role: s.role,
      base_salary: s.base_salary.toString(),
      phone: s.phone,
    });
    setStaffModalOpen(true);
  }

  async function handleStaffSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: staffForm.name,
        role: staffForm.role,
        base_salary: parseFloat(staffForm.base_salary),
        phone: staffForm.phone,
      };
      if (editingStaff) {
        const updated = await api.staff.update(editingStaff.id, payload);
        setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await api.staff.create(payload);
        setStaff((prev) => [created, ...prev]);
      }
      setStaffModalOpen(false);
      setStaffForm(emptyStaffForm);
      setEditingStaff(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStaff(id: string) {
    try {
      await api.staff.delete(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function openPayrollModal(s: Staff) {
    setSelectedStaffForPayroll(s);
    setPayrollForm(emptyPayrollForm);
    setPayrollModalOpen(true);
  }

  const now = new Date();
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();

  async function handlePayrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaffForPayroll) return;
    setPayrollSubmitting(true);
    try {
      const bonus = parseFloat(payrollForm.bonus) || 0;
      const deduction = parseFloat(payrollForm.deduction) || 0;
      const baseSalary = selectedStaffForPayroll.base_salary;
      const netSalary = baseSalary + bonus - deduction;

      const record = await api.staff.createPayroll({
        staff_id: selectedStaffForPayroll.id,
        month: currentMonth,
        year: currentYear,
        base_salary: baseSalary,
        bonus,
        deduction,
        net_salary: netSalary,
        notes: payrollForm.notes,
      });

      await api.finance.create({
        type: "payroll_staff",
        amount: netSalary,
        description: `Salary: ${selectedStaffForPayroll.name} - ${currentMonth} ${currentYear}`,
        date: new Date().toISOString().split("T")[0],
      });

      await api.staff.markPayrollPaid(record.id, record.id);

      const updated = { ...record, is_paid: true, paid_at: new Date().toISOString(), finance_transaction_id: record.id };
      setPayrollRecords((prev) => {
        const existing = prev[record.staff_id] || [];
        return { ...prev, [record.staff_id]: [updated, ...existing] };
      });

      setPayrollModalOpen(false);
      setPayrollForm(emptyPayrollForm);
      setSelectedStaffForPayroll(null);
    } catch (err) {
      if (err instanceof Error && err.message.includes("unique constraint")) {
        setError(`Payroll for ${currentMonth} ${currentYear} already exists`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to process payroll");
      }
    } finally {
      setPayrollSubmitting(false);
    }
  }

  async function handleMarkPaid(record: PayrollRecord, staffName: string) {
    try {
      if (record.is_paid) return;

      let financeTxId = record.finance_transaction_id;

      if (!financeTxId) {
        const financeTx = await api.finance.create({
          type: "payroll_staff",
          amount: record.net_salary,
          description: `Salary: ${staffName} - ${record.month} ${record.year}`,
          date: new Date().toISOString().split("T")[0],
        });
        financeTxId = financeTx.id;
      }

      const updated = await api.staff.markPayrollPaid(record.id, financeTxId);
      setPayrollRecords((prev) => {
        const existing = prev[record.staff_id] || [];
        return { ...prev, [record.staff_id]: existing.map((r) => (r.id === updated.id ? updated : r)) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  }

  async function handleDeletePayroll(record: PayrollRecord) {
    try {
      await api.staff.deletePayroll(record.id);
      setPayrollRecords((prev) => {
        const existing = prev[record.staff_id] || [];
        return { ...prev, [record.staff_id]: existing.filter((r) => r.id !== record.id) };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const totalMonthlyPayroll = staff.reduce((sum, s) => sum + s.base_salary, 0);
  const totalPaidThisMonth = Object.values(payrollRecords)
    .flat()
    .filter((r) => r.month === currentMonth && r.year === currentYear && r.is_paid)
    .reduce((sum, r) => sum + r.net_salary, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {t("Staff & Payroll", "ಸಿಬ್ಬಂದಿ ಮತ್ತು ಪೇರೋಲ್")}
            </h1>
            <p className="text-sm text-green-600 mt-1">
              {t("Manage staff and monthly payroll", "ಸಿಬ್ಬಂದಿ ಮತ್ತು ಮಾಸಿಕ ವೇತನ ನಿರ್ವಹಿಸಿ")}
            </p>
          </div>
          <button
            onClick={openAddStaff}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            {t("Add Staff", "ಸಿಬ್ಬಂದಿ ಸೇರಿಸಿ")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Total Staff", "ಒಟ್ಟು ಸಿಬ್ಬಂದಿ")}</p>
                <p className="text-xl font-bold text-green-800">{staff.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center">
                <IndianRupee size={20} className="text-gold-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Monthly Payroll", "ಮಾಸಿಕ ವೇತನ")}</p>
                <p className="text-xl font-bold text-green-800">₹{totalMonthlyPayroll.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">{t("Paid This Month", "ಈ ತಿಂಗಳ ಪಾವತಿ")}</p>
                <p className="text-xl font-bold text-green-800">₹{totalPaidThisMonth.toLocaleString("en-IN")}</p>
              </div>
            </div>
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

        <div className="bg-white rounded-xl border border-green-100 shadow-sm">
          <div className="px-6 py-4 border-b border-green-50">
            <h2 className="text-lg font-semibold text-green-800">
              {t("Staff Directory", "ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ")}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-green-600" />
            </div>
          ) : staff.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={40} className="text-green-300 mx-auto mb-3" />
              <p className="text-green-500 text-sm">
                {t("No staff members yet. Add your first staff member.", "ಇನ್ನೂ ಯಾವುದೇ ಸಿಬ್ಬಂದಿ ಇಲ್ಲ. ನಿಮ್ಮ ಮೊದಲ ಸಿಬ್ಬಂದಿಯನ್ನು ಸೇರಿಸಿ.")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-green-50">
              {staff.map((s) => {
                const isExpanded = expandedStaff === s.id;
                const records = payrollRecords[s.id] || [];
                const isLoading = payrollLoading[s.id];

                return (
                  <div key={s.id}>
                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-green-50/30 transition-colors">
                      <button
                        onClick={() => toggleExpand(s.id)}
                        className="text-green-400 hover:text-green-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-700 font-semibold text-sm">{s.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-green-800 truncate">{s.name}</p>
                            <p className="text-xs text-green-500">{t(roleLabels[s.role].en, roleLabels[s.role].kn)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-green-700">₹{s.base_salary.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-green-500">{t("base salary", "ಮೂಲ ವೇತನ")}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openPayrollModal(s)}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                          title={t("Process Payroll", "ವೇತನ ಪ್ರಕ್ರಿಯೆ")}
                        >
                          <Wallet size={16} />
                        </button>
                        <button
                          onClick={() => openEditStaff(s)}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                          title={t("Edit", "ತಿದ್ದು")}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title={t("Delete", "ಅಳಿಸು")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-4 pl-16 bg-green-50/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar size={16} className="text-green-500" />
                          <h3 className="text-sm font-medium text-green-700">
                            {t("Payroll History", "ವೇತನ ಇತಿಹಾಸ")}
                          </h3>
                        </div>

                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={20} className="animate-spin text-green-500" />
                          </div>
                        ) : records.length === 0 ? (
                          <p className="text-sm text-green-500 py-4">
                            {t("No payroll records yet", "ಇನ್ನೂ ಯಾವುದೇ ವೇತನ ದಾಖಲೆಗಳಿಲ್ಲ")}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {records.map((r) => (
                              <div
                                key={r.id}
                                className="bg-white rounded-lg p-3 border border-green-100 flex items-center gap-4"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-800">
                                    {t(monthLabels[r.month].en, monthLabels[r.month].kn)} {r.year}
                                  </p>
                                  {r.notes && (
                                    <p className="text-xs text-green-500 mt-0.5">{r.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-green-700">₹{r.net_salary.toLocaleString("en-IN")}</p>
                                  {r.bonus > 0 && (
                                    <p className="text-xs text-green-500">+₹{r.bonus} bonus</p>
                                  )}
                                  {r.deduction > 0 && (
                                    <p className="text-xs text-red-500">-₹{r.deduction} deduction</p>
                                  )}
                                </div>
                                {r.is_paid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <CheckCircle size={12} />
                                    {t("Paid", "ಪಾವತಿಸಲಾಗಿದೆ")}
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleMarkPaid(r, s.name)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gold-100 text-gold-700 hover:bg-gold-200 transition-colors"
                                    >
                                      {t("Mark Paid", "ಪಾವತಿ ಗುರುತಿಸು")}
                                    </button>
                                    <button
                                      onClick={() => handleDeletePayroll(r)}
                                      className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStaffModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-800">
                {editingStaff ? t("Edit Staff", "ಸಿಬ್ಬಂದಿ ತಿದ್ದು") : t("Add Staff Member", "ಸಿಬ್ಬಂದಿ ಸದಸ್ಯ ಸೇರಿಸಿ")}
              </h2>
              <button onClick={() => setStaffModalOpen(false)} className="p-1 rounded-lg hover:bg-green-50 text-green-500">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Full Name", "ಪೂರ್ಣ ಹೆಸರು")}
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter name", "ಹೆಸರು ನಮೂದಿಸಿ")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Role", "ಪಾತ್ರ")}
                </label>
                <select
                  required
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as StaffRole })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{t(label.en, label.kn)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Base Salary (₹)", "ಮೂಲ ವೇತನ (₹)")}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={staffForm.base_salary}
                  onChange={(e) => setStaffForm({ ...staffForm, base_salary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter base salary", "ಮೂಲ ವೇತನ ನಮೂದಿಸಿ")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Phone", "ಫೋನ್")}
                </label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Optional", "ಐಚ್ಛಿಕ")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
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
                  {editingStaff ? t("Update", "ನವೀಕರಿಸಿ") : t("Add Staff", "ಸಿಬ್ಬಂದಿ ಸೇರಿಸಿ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payrollModalOpen && selectedStaffForPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPayrollModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-800">
                {t("Process Payroll", "ವೇತನ ಪ್ರಕ್ರಿಯೆ")}
              </h2>
              <button onClick={() => setPayrollModalOpen(false)} className="p-1 rounded-lg hover:bg-green-50 text-green-500">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-3 bg-green-50 border-b border-green-100">
              <p className="text-sm font-medium text-green-800">{selectedStaffForPayroll.name}</p>
              <p className="text-xs text-green-600">{t(monthLabels[currentMonth].en, monthLabels[currentMonth].kn)} {currentYear}</p>
            </div>
            <form onSubmit={handlePayrollSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600">{t("Base Salary", "ಮೂಲ ವೇತನ")}</p>
                <p className="text-lg font-bold text-green-800">₹{selectedStaffForPayroll.base_salary.toLocaleString("en-IN")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    {t("Bonus (₹)", "ಬೋನಸ್ (₹)")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollForm.bonus}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    {t("Deduction (₹)", "ಕಡಿತ (₹)")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payrollForm.deduction}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deduction: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="p-3 bg-gold-50 rounded-lg border border-gold-100">
                <p className="text-xs text-gold-600">{t("Net Salary", "ನಿವ್ವಳ ವೇತನ")}</p>
                <p className="text-lg font-bold text-gold-800">
                  ₹{(selectedStaffForPayroll.base_salary + (parseFloat(payrollForm.bonus) || 0) - (parseFloat(payrollForm.deduction) || 0)).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Notes", "ಟಿಪ್ಪಣಿಗಳು")}
                </label>
                <input
                  type="text"
                  value={payrollForm.notes}
                  onChange={(e) => setPayrollForm({ ...payrollForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Optional note", "ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayrollModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  {t("Cancel", "ರದ್ದು")}
                </button>
                <button
                  type="submit"
                  disabled={payrollSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payrollSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {t("Process & Pay", "ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಪಾವತಿ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {t("Delete Staff Member?", "ಸಿಬ್ಬಂದಿ ಸದಸ್ಯ ಅಳಿಸುವುದೇ?")}
            </h3>
            <p className="text-sm text-green-600 mb-6">
              {t("This will also delete all payroll records for this staff member.", "ಇದು ಈ ಸಿಬ್ಬಂದಿಯ ಎಲ್ಲಾ ವೇತನ ದಾಖಲೆಗಳನ್ನೂ ಅಳಿಸುತ್ತದೆ.")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                {t("Cancel", "ರದ್ದು")}
              </button>
              <button
                onClick={() => handleDeleteStaff(deleteConfirm)}
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
