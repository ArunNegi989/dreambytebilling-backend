import { Router } from "express";
import authRoutes from "./authRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import quotationRoutes from "./quotation.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoice", invoiceRoutes);
router.use("/quotation", quotationRoutes); // ✅

export default router;
