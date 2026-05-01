import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import studentsRouter from "./routes/students";
import financeRouter from "./routes/finance";
import staffRouter from "./routes/staff";
import authRouter from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3001;

console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "loaded" : "MISSING");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/students", studentsRouter);
app.use("/api/finance", financeRouter);
app.use("/api/staff", staffRouter);
app.use("/api/auth", authRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Masjid CRM Backend running on http://localhost:${PORT}`);
});
