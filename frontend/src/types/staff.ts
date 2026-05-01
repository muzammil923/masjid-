export type StaffRole = "imam" | "muezzin" | "teacher" | "cleaner" | "security" | "admin" | "other";

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  base_salary: number;
  phone: string;
  created_at: string;
};

export type PayrollRecord = {
  id: string;
  staff_id: string;
  month: string;
  year: number;
  base_salary: number;
  bonus: number;
  deduction: number;
  net_salary: number;
  is_paid: boolean;
  paid_at: string | null;
  finance_transaction_id: string | null;
  notes: string;
  created_at: string;
};

export const roleLabels: Record<StaffRole, { en: string; kn: string }> = {
  imam: { en: "Imam", kn: "ಇಮಾಮ್" },
  muezzin: { en: "Muezzin", kn: "ಮುಅಝಿನ್" },
  teacher: { en: "Teacher", kn: "ಶಿಕ್ಷಕ" },
  cleaner: { en: "Cleaner", kn: "ಸ್ವಚ್ಛತಾ ಕಾರ್ಮಿಕ" },
  security: { en: "Security", kn: "ಭದ್ರತಾ" },
  admin: { en: "Admin", kn: "ಆಡಳಿತ" },
  other: { en: "Other", kn: "ಇತರ" },
};

export type PayrollFormData = {
  bonus: string;
  deduction: string;
  notes: string;
};

export type StaffFormData = {
  name: string;
  role: StaffRole;
  base_salary: string;
  phone: string;
};
