// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes.js"; // note .js

const router = Router();

router.use("/auth", authRoutes);

// add other groups here: router.use("/invoices", invoiceRoutes);

export default router;
