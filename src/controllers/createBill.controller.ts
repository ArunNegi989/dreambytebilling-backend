import { streamBillWithoutGSTPdf } from "../utils/genratewithoutgst.js"; // 👈 Different file
import { Request, Response } from "express";
import CreateBill from "../models/CreateBill.js";

/* CREATE BILL */
export const createBill = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.create(req.body);
    res.status(201).json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create bill" });
  }
};

/* GET ALL BILLS */
export const getAllBills = async (_: Request, res: Response) => {
  try {
    const bills = await CreateBill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch bills" });
  }
};

/* GET SINGLE BILL */
export const getBillById = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch bill" });
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

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update bill" });
  }
};

/* DELETE BILL */
export const deleteBill = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete bill" });
  }
};

/* DOWNLOAD BILL WITH GST */
export const downloadBillPdf = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    streamBillWithoutGSTPdf(
      res,
      bill,
      `bill-with-gst-${bill.billNo}.pdf`
    );

  } catch (err: any) {
    console.error("Bill PDF Error:", err);
    res.status(500).json({ message: "Failed to generate bill PDF" });
  }
};

/* DOWNLOAD BILL WITHOUT GST */
export const downloadBillWithoutGSTPdf = async (req: Request, res: Response) => {
  try {
    const bill = await CreateBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    streamBillWithoutGSTPdf(
      res,
      bill,
      `bill-without-gst-${bill.billNo}.pdf`
    );

  } catch (err: any) {
    console.error("Bill PDF Error:", err);
    res.status(500).json({ message: "Failed to generate bill PDF" });
  }
};