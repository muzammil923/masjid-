export type TransactionType = "daily_collection" | "friday_collection" | "donations" | "expenses" | "payroll_staff";

export type FinanceTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  created_at: string;
};

export type FinanceFormData = {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
};
