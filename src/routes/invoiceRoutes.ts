// src/routes/invoiceRoutes.ts
import { Router } from "express";
import {
  createInvoice,
  getInvoice,
  getInvoices,
  generateInvoicePdf,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const router = Router();

router.post("/createinvoice", createInvoice);
router.get("/getallinvoice", getInvoices);
router.get("/:id", getInvoice);
router.get("/:id/pdf", generateInvoicePdf);
router.delete("/:id", deleteInvoice);

export default router;
