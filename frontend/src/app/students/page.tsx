"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import type { Student, StudentFormData } from "@/types/student";
import { Plus, Pencil, Trash2, X, Search, Loader2, AlertCircle } from "lucide-react";

const emptyForm: StudentFormData = {
  name: "",
  class: "",
  parent_name: "",
  phone: "",
};

export default function StudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function loadStudents() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.students.getAll();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function openAddModal() {
    setEditingStudent(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setForm({
      name: student.name,
      class: student.class,
      parent_name: student.parent_name,
      phone: student.phone,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        const updated = await api.students.update(editingStudent.id, form);
        setStudents((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      } else {
        const created = await api.students.create(form);
        setStudents((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditingStudent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.students.delete(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              {t("Students", "ವಿದ್ಯಾರ್ಥಿಗಳು")}
            </h1>
            <p className="text-sm text-green-600 mt-1">
              {t("Manage all students", "ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ")}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            {t("Add Student", "ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ")}
          </button>
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
          <div className="p-4 border-b border-green-50">
            <div className="relative max-w-sm">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400"
              />
              <input
                type="text"
                placeholder={t("Search students...", "ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಹುಡುಕಿ...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-green-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-green-500 text-sm">
                {t("No students found", "ಯಾವುದೇ ವಿದ್ಯಾರ್ಥಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Name", "ಹೆಸರು")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Class", "ತರಗತಿ")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Parent", "ಪೋಷಕರು")}
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Phone", "ಫೋನ್")}
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider">
                      {t("Actions", "ಕ್ರಿಯೆಗಳು")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {filtered.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-green-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-green-800">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {student.class}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {student.parent_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                            title={t("Edit", "ತಿದ್ದು")}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student.id)}
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
            {t("Total", "ಒಟ್ಟು")}: {filtered.length} / {students.length}
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
                {editingStudent
                  ? t("Edit Student", "ವಿದ್ಯಾರ್ಥಿ ತಿದ್ದು")
                  : t("Add Student", "ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ")}
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
                  {t("Student Name", "ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು")}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter name", "ಹೆಸರು ನಮೂದಿಸಿ")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Class", "ತರಗತಿ")}
                </label>
                <input
                  type="text"
                  required
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("e.g. Quran 101", "ಉದಾ. ಖುರ್ಆನ್ 101")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Parent Name", "ಪೋಷಕರ ಹೆಸರು")}
                </label>
                <input
                  type="text"
                  required
                  value={form.parent_name}
                  onChange={(e) =>
                    setForm({ ...form, parent_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter parent name", "ಪೋಷಕರ ಹೆಸರು ನಮೂದಿಸಿ")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Phone", "ಫೋನ್")}
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t("Enter phone number", "ಫೋನ್ ನಂಬರ್ ನಮೂದಿಸಿ")}
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
                  {editingStudent
                    ? t("Update", "ನವೀಕರಿಸಿ")
                    : t("Add Student", "ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ")}
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
              {t("Delete Student?", "ವಿದ್ಯಾರ್ಥಿ ಅಳಿಸುವುದೇ?")}
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
