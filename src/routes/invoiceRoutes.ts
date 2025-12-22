// src/routes/invoiceRoutes.ts
import { Router } from "express";
import {
  createInvoice,
  getInvoice,
  getInvoices,
  generateInvoicePdf,
  deleteInvoice,
  getNextInvoiceNumber,
  updateInvoice, // ✅ ADD
} from "../controllers/invoiceController.js";

const router = Router();

router.post("/createinvoice", createInvoice);
router.get("/getallinvoice", getInvoices);
router.get("/next-invoice-number", getNextInvoiceNumber);

// READ
router.get("/:id", getInvoice);

// UPDATE ✅
router.put("/:id", updateInvoice);

// PDF
router.get("/:id/pdf", generateInvoicePdf);

// DELETE
router.delete("/:id", deleteInvoice);

export default router;
