// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./authRoutes.js"; // note .js
import invoiceRoutes from "./invoiceRoutes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoice" ,invoiceRoutes )

// add other groups here: router.use("/invoices", invoiceRoutes);

export default router;
