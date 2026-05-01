import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import type { StaffRole } from "../types/staff";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch staff" });
  }
});

router.post("/", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, role, base_salary, phone } = req.body;

    if (!name || !role || !base_salary || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("staff")
      .insert({ name, role, base_salary, phone })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create staff" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, role, base_salary, phone } = req.body;

    const { data, error } = await supabase
      .from("staff")
      .update({ name, role, base_salary, phone })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update staff" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to delete staff" });
  }
});

router.get("/:id/payroll", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from("payroll_records")
      .select("*")
      .eq("staff_id", id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch payroll" });
  }
});

router.post("/payroll", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { staff_id, month, year, base_salary, bonus, deduction, net_salary, notes } = req.body;

    if (!staff_id || !month || !year || !base_salary) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    const { data, error } = await supabase
      .from("payroll_records")
      .insert({ staff_id, month, year, base_salary, bonus: bonus || 0, deduction: deduction || 0, net_salary, notes: notes || "" })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create payroll" });
  }
});

router.patch("/payroll/:id/paid", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { finance_transaction_id } = req.body;

    const { data, error } = await supabase
      .from("payroll_records")
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        finance_transaction_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to mark payroll as paid" });
  }
});

router.delete("/payroll/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase.from("payroll_records").delete().eq("id", id);

    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to delete payroll" });
  }
});

export default router;
