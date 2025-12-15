// src/routes/invoiceRoutes.ts
import { Router } from "express";
import {
  createInvoice,
  getInvoice,
  getInvoices,
  generateInvoicePdf
} from "../controllers/invoiceController.js";

const router = Router();

router.post("/createinvoice", createInvoice);
router.get("/getallinvoice", getInvoices);
router.get("/:id", getInvoice);
router.get("/:id/pdf", generateInvoicePdf);

export default router;
