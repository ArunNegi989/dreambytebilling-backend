import { Router } from "express";
import {
  createQuotation,
  updateQuotation,
  getQuotationById,
  getAllQuotations,
  deleteQuotation,
  downloadQuotationPdf,
} from "../controllers/quotation.controller.js";

const router = Router();

// REST routes
router.post("/createquotation", createQuotation); // POST   /api/quotation
router.get("/getallquotation", getAllQuotations); // GET    /api/quotation
router.get("/getquotationbyid/:id", getQuotationById); // GET    /api/quotation/:id
router.put("/updatequtation/:id", updateQuotation); // PUT    /api/quotation/:id
router.delete("/deletequitation/:id", deleteQuotation); // ✅ DELETE /api/quotation/:id
router.get("/:id/pdf", downloadQuotationPdf);

export default router;
