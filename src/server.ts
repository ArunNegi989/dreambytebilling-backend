import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "express-async-errors";

import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const MONGO =
  process.env.MONGODB_SRV || "mongodb://localhost:27017/dreambyte_billing";

/* 🔥 IMPORTANT: allow BOTH localhost + network IP */
const CLIENT_URLS = [
  "http://localhost:5173",
  "http://172.20.10.7:5173", // 👈 PHONE ACCESS
];

/* BODY LIMIT */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

/* ✅ CORS FIX */
app.use(
  cors({
    origin: CLIENT_URLS,
    credentials: true,
  })
);

app.use("/api", routes);

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

/* ✅ NETWORK LISTEN FIX */
mongoose
  .connect(MONGO)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on network`);
      console.log(`👉 Local   : http://localhost:${PORT}`);
      console.log(`👉 Network : http://172.20.10.7:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
