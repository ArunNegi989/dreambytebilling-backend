import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "express-async-errors";

import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const PORT = Number(process.env.PORT);
const MONGO = process.env.MONGODB_SRV;
const CLIENT_URL = process.env.CLIENT_URL;

/* BODY LIMIT */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

/* CORS */
app.use(
cors({
origin: CLIENT_URL,
credentials: true,
})
);

/* ROUTES */
app.use("/api", routes);

/* HEALTH CHECK */
app.get("/", (_req, res) => {
res.json({ status: "ok" });
});

/* ERROR HANDLER */
app.use(errorHandler);

/* DATABASE CONNECTION */
mongoose
.connect(MONGO as string)
.then(() => {
console.log("✅ Connected to MongoDB");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

})
.catch((err) => {
console.error("MongoDB connection error:", err);
process.exit(1);
});
