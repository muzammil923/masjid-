const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  students: {
    getAll: () => request<import("@/types/student").Student[]>("/api/students"),
    create: (data: { name: string; class: string; parent_name: string; phone: string }) =>
      request<import("@/types/student").Student>("/api/students", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name: string; class: string; parent_name: string; phone: string }) =>
      request<import("@/types/student").Student>(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/students/${id}`, { method: "DELETE" }),
  },
  finance: {
    getAll: () => request<import("@/types/finance").FinanceTransaction[]>("/api/finance"),
    create: (data: { type: string; amount: number; description: string; date: string }) =>
      request<import("@/types/finance").FinanceTransaction>("/api/finance", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { type: string; amount: number; description: string; date: string }) =>
      request<import("@/types/finance").FinanceTransaction>(`/api/finance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/finance/${id}`, { method: "DELETE" }),
  },
  staff: {
    getAll: () => request<import("@/types/staff").Staff[]>("/api/staff"),
    create: (data: { name: string; role: string; base_salary: number; phone: string }) =>
      request<import("@/types/staff").Staff>("/api/staff", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name: string; role: string; base_salary: number; phone: string }) =>
      request<import("@/types/staff").Staff>(`/api/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/staff/${id}`, { method: "DELETE" }),
    getPayroll: (staffId: string) => request<import("@/types/staff").PayrollRecord[]>(`/api/staff/${staffId}/payroll`),
    createPayroll: (data: { staff_id: string; month: string; year: number; base_salary: number; bonus: number; deduction: number; net_salary: number; notes: string }) =>
      request<import("@/types/staff").PayrollRecord>("/api/staff/payroll", { method: "POST", body: JSON.stringify(data) }),
    markPayrollPaid: (id: string, financeTransactionId: string) =>
      request<import("@/types/staff").PayrollRecord>(`/api/staff/payroll/${id}/paid`, { method: "PATCH", body: JSON.stringify({ finance_transaction_id: financeTransactionId }) }),
    deletePayroll: (id: string) => request<void>(`/api/staff/payroll/${id}`, { method: "DELETE" }),
  },
  auth: {
    login: (email: string, password: string) =>
      request<{ user: any; session: any }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: (accessToken?: string) =>
      request("/api/auth/logout", { method: "POST", body: JSON.stringify({ accessToken }) }),
    createAdmin: (email: string, password: string) =>
      request<{ user: { id: string; email: string }; session: any }>("/api/auth/create-admin", { method: "POST", body: JSON.stringify({ email, password }) }),
    getSession: (token: string) =>
      request("/api/auth/session", { headers: { Authorization: `Bearer ${token}` } }),
  },
};
