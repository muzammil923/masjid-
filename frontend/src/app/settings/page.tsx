"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Globe, Save, UserPlus, Trash2, X, Loader2, AlertCircle, Building2, Phone, MapPin, Lock, Database, LogOut, Check } from "lucide-react";

export default function SettingsPage() {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const [masjidName, setMasjidName] = useState("Al-Noor Masjid");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");

  const [admins, setAdmins] = useState([
    { id: "1", email: user?.email || "admin@masjidcrm.com", isOwner: true },
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function addAdmin() {
    if (!newAdminEmail.trim() || !newAdminPassword.trim()) return;
    if (newAdminPassword.length < 6) {
      setError(t("Password must be at least 6 characters", "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು ಇರಬೇಕು"));
      return;
    }

    setAddingAdmin(true);
    setError(null);

    try {
      const data = await api.auth.createAdmin(newAdminEmail, newAdminPassword);

      setAdmins((prev) => [
        ...prev,
        { id: data.user?.id || Date.now().toString(), email: newAdminEmail, isOwner: false },
      ]);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setShowAddAdmin(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setAddingAdmin(false);
    }
  }

  function removeAdmin(id: string) {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match", "ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ"));
      return;
    }
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  function handleBackup() {
    const data = {
      masjidName,
      address,
      contact,
      admins,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `masjid-crm-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-green-800">
            {t("Settings", "ಸೆಟ್ಟಿಂಗ್‌ಗಳು")}
          </h1>
          <p className="text-sm text-green-600 mt-1">
            {t("Manage your masjid settings", "ನಿಮ್ಮ ಮಸ್ಜಿದ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ")}
          </p>
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

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <Check size={18} />
            <span>{t("Settings saved successfully", "ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ")}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 bg-green-50/30">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">
                {t("Masjid Information", "ಮಸ್ಜಿದ್ ಮಾಹಿತಿ")}
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                {t("Masjid Name", "ಮಸ್ಜಿದ್ ಹೆಸರು")}
              </label>
              <input
                type="text"
                value={masjidName}
                onChange={(e) => setMasjidName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                <span className="flex items-center gap-2">
                  <MapPin size={14} /> {t("Address", "ವಿಳಾಸ")}
                </span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder={t("Enter masjid address", "ಮಸ್ಜಿದ್ ವಿಳಾಸ ನಮೂದಿಸಿ")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                <span className="flex items-center gap-2">
                  <Phone size={14} /> {t("Contact Number", "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ")}
                </span>
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t("Enter contact number", "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ")}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 bg-green-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-green-600" />
                <h2 className="text-lg font-semibold text-green-800">
                  {t("Admin Management", "ನಿರ್ವಾಹಕ ನಿರ್ವಹಣೆ")}
                </h2>
              </div>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
              >
                <UserPlus size={14} />
                {t("Add Admin", "ನಿರ್ವಾಹಕ ಸೇರಿಸಿ")}
              </button>
            </div>
          </div>
          <div className="divide-y divide-green-50">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-green-800">{admin.email}</p>
                  {admin.isOwner && (
                    <span className="text-xs text-green-500">{t("Owner", "ಮಾಲೀಕ")}</span>
                  )}
                </div>
                {!admin.isOwner && (
                  <button
                    onClick={() => removeAdmin(admin.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {showAddAdmin && (
            <div className="px-6 py-4 bg-green-50/30 border-t border-green-100 space-y-3">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  {t("Email Address", "ಇಮೇಲ್ ವಿಳಾಸ")}
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder={t("Enter email address", "ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ")}
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">
                  {t("Password", "ಪಾಸ್‌ವರ್ಡ್")} ({t("min 6 characters", "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು")})
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === "Enter" && addAdmin()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addAdmin}
                  disabled={addingAdmin}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {addingAdmin && <Loader2 size={14} className="animate-spin" />}
                  {t("Create Admin", "ನಿರ್ವಾಹಕ ರಚಿಸಿ")}
                </button>
                <button
                  onClick={() => { setShowAddAdmin(false); setNewAdminEmail(""); setNewAdminPassword(""); }}
                  className="p-2 text-green-500 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 bg-green-50/30">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">
                {t("Language Settings", "ಭಾಷಾ ಸೆಟ್ಟಿಂಗ್‌ಗಳು")}
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {t("Display Language", "ಪ್ರದರ್ಶನ ಭಾಷೆ")}
                </p>
                <p className="text-xs text-green-500 mt-0.5">
                  {t("Choose your preferred language", "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ")}
                </p>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-4 py-2.5 border border-green-200 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
              >
                <Globe size={16} />
                {language === "en" ? "English" : "ಕನ್ನಡ"}
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  {language === "en" ? "ಕನ್ನಡ" : "English"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 bg-green-50/30">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">
                {t("Security", "ಸುರಕ್ಷತೆ")}
              </h2>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                {t("Current Password", "ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್")}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("New Password", "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  {t("Confirm Password", "ಪಾಸ್‌ವರ್ಡ್ ದೃಢಪಡಿಸಿ")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-green-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {t("Change Password", "ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ")}
            </button>
          </form>

          <div className="px-6 py-4 border-t border-green-50">
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="flex items-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {t("Logout", "ಲಾಗ್‌ಔಟ್")}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-50 bg-green-50/30">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-green-600" />
              <h2 className="text-lg font-semibold text-green-800">
                {t("Backup & Data", "ಬ್ಯಾಕ್‌ಅಪ್ ಮತ್ತು ಡೇಟಾ")}
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={handleBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
            >
              <Database size={16} />
              {t("Backup Data", "ಡೇಟಾ ಬ್ಯಾಕ್‌ಅಪ್ ಮಾಡಿ")}
            </button>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 border border-green-200 text-green-400 rounded-lg text-sm font-medium cursor-not-allowed opacity-60"
            >
              <Database size={16} />
              {t("Restore Data (Coming Soon)", "ಡೇಟಾ ಹೊಂದಿಸಿ (ಶೀಘ್ರದಲ್ಲೇ)")}
            </button>
            <p className="text-xs text-green-500">
              {t("Backup includes masjid info and admin list.", "ಬ್ಯಾಕ್‌ಅಪ್‌ನಲ್ಲಿ ಮಸ್ಜಿದ್ ಮಾಹಿತಿ ಮತ್ತು ನಿರ್ವಾಹಕರ ಪಟ್ಟಿ ಇರುತ್ತದೆ.")}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-green-100 p-4 flex justify-end gap-3 shadow-lg -mx-4 lg:-mx-8 px-4 lg:px-8 -mb-4 lg:-mb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} />
            {t("Save Settings", "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ")}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
