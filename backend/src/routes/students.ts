import { Router } from "express";
import { getSupabase } from "../lib/supabase";
import type { Student } from "../types/student";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch students" });
  }
});

router.post("/", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, class: studentClass, parent_name, phone } = req.body;

    if (!name || !studentClass || !parent_name || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await supabase
      .from("students")
      .insert({ name, class: studentClass, parent_name, phone })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create student" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, class: studentClass, parent_name, phone } = req.body;

    const { data, error } = await supabase
      .from("students")
      .update({ name, class: studentClass, parent_name, phone })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to update student" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase.from("students").delete().eq("id", id);

    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to delete student" });
  }
});

export default router;
