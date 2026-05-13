"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Globe, ChevronDown, LogOut, Loader2 } from "lucide-react";

export default function Topbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const userName = user?.user_metadata?.name || user?.email || "";
  const userEmail = user?.email || "";
  const userInitial = (userName || userEmail).charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-green-100 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-green-800">Masjid CRM</h2>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Globe size={16} />
            {language === "en" ? "EN" : "KN"}
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-semibold">
                {userInitial}
              </div>
              <span className="text-sm text-green-800 hidden sm:block">{userEmail}</span>
              <ChevronDown size={16} className="text-green-600" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-green-100 py-2 z-20">
                  <div className="px-4 py-2 border-b border-green-50">
                    <p className="text-sm font-medium text-green-800">{userEmail}</p>
                    <p className="text-xs text-green-500">{t("User", "ಬಳಕೆದಾರ")}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    {t("Sign Out", "ಸೈನ್ ಔಟ್")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
