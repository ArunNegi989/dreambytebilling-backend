import { Request, Response } from "express";
import CreateBill from "../models/CreateBill.js";

/* CREATE BILL */
export const createBill = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.create(req.body);
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL BILLS */
export const getAllBills = async (_: Request, res: Response) => {
  try {
    const bills = await CreateBill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* GET SINGLE BILL */
export const getBillById = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findById(req.params.id);
    if (!bill)
      return res.status(404).json({ message: "Bill not found" });

    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE BILL */
export const updateBill = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE BILL */
export const deleteBill = async (req: Request, res: Response) => {
  try {
    await CreateBill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
