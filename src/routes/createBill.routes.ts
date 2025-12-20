import { Router } from "express";
import {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill
} from "../controllers/createBill.controller.js";

const router = Router();

router.post("/createbill", createBill);
router.get("/getallbills", getAllBills);
router.get("/getbillbyid/:id", getBillById);
router.put("/updatebill/:id", updateBill);
router.delete("/deletebill/:id", deleteBill);

export default router;
