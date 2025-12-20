import { Router } from "express";
import {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  downloadBillPdf
} from "../controllers/createBill.controller.js";

const router = Router();

router.post("/createbill", createBill);
router.get("/getallbills", getAllBills);
router.get("/getbillbyid/:id", getBillById);
router.put("/updatebill/:id", updateBill);
router.delete("/deletebill/:id", deleteBill);
router.get("/:id/pdf", downloadBillPdf);
export default router;
