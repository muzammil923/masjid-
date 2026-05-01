import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import type { TransactionType } from "../types/finance";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("finance_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { type, amount, description, date } = req.body;

    if (!type || !amount || !description || !date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("finance_transactions")
      .insert({ type, amount, description, date })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create transaction" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { type, amount, description, date } = req.body;

    const { data, error } = await supabase
      .from("finance_transactions")
      .update({ type, amount, description, date })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase.from("finance_transactions").delete().eq("id", id);

    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to delete transaction" });
  }
});

export default router;
