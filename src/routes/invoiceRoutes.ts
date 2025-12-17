// src/routes/invoiceRoutes.ts
import { Router } from "express";
import {
  createInvoice,
  getInvoice,
  getInvoices,
  generateInvoicePdf,
  deleteInvoice,
  getNextInvoiceNumber,
} from "../controllers/invoiceController.js";

const router = Router();

router.post("/createinvoice", createInvoice);
router.get("/getallinvoice", getInvoices);
router.get("/next-invoice-number", getNextInvoiceNumber);
router.get("/:id", getInvoice);
router.get("/:id/pdf", generateInvoicePdf);
router.delete("/:id", deleteInvoice);


export default router;
