import { Router } from "express";
import authRoutes from "./authRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import quotationRoutes from "./quotation.routes.js";
import createBillRoutes from "./createBill.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoice", invoiceRoutes);
router.use("/quotation", quotationRoutes);
router.use("/bill", createBillRoutes); // ✅

export default router;
