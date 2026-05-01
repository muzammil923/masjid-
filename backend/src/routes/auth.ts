import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase";

const router = Router();

const ADMIN_EMAILS = ["admin@masjidcrm.com"];

router.post("/login", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { accessToken } = req.body;

    if (accessToken) {
      await supabaseAdmin.auth.signOut(accessToken);
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to logout" });
  }
});

router.post("/create-admin", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Admin created successfully", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin" });
  }
});

router.get("/session", async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.json({ user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Failed to validate session" });
  }
});

export default router;
