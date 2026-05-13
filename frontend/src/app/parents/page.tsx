"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/context/LanguageContext";
import { Clock } from "lucide-react";

export default function ParentsPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Clock size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-3">
          {t("Parents Section", "ಪೋಷಕರ ವಿಭಾಗ")}
        </h1>
        <p className="text-green-600 text-lg mb-2">
          {t("Coming Soon", "ಶೀಘ್ರದಲ್ಲೇ")}
        </p>
        <p className="text-green-500 text-sm max-w-md">
          {t("We are working on this section. It will be available soon.", "ನಾವು ಈ ವಿಭಾಗದಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದ್ದೇವೆ. ಇದು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಿರುತ್ತದೆ.")}
        </p>
      </div>
    </DashboardLayout>
  );
}
