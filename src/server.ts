import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "express-async-errors";

import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const MONGO = process.env.MONGODB_SRV || "mongodb://localhost:27017/dreambyte_billing";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/** 🔥 BODY SIZE FIX 🔥 */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use(cors({ origin: CLIENT_URL, credentials: true }));

app.use("/api", routes);

app.get("/", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

mongoose
  .connect(MONGO)
  .then(() => {
    console.log(" ✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(` ✅ Server listening on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
