import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import Invoice from "../models/Invoice.js";
import { streamInvoicePdf } from "../utils/pdfGenerator.js";

/* ---------------- CREATE INVOICE ---------------- */
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload?.invoiceNo) {
      return res.status(400).json({ error: "invoiceNo required" });
    }

    const invoice = new Invoice({
      header: payload.header || {},

      irn: payload.irn,
      ackNo: payload.ackNo,
      ackDate: payload.ackDate,
      gstin: payload.gstin,

      invoiceNo: payload.invoiceNo,
      dateOfInvoice: payload.dateOfInvoice,
      placeOfSupply: payload.placeOfSupply,

      billedTo: payload.billedTo,
      shipTo: payload.shipTo,

      partyPan: payload.partyPan,
      receiverGstin: payload.receiverGstin,

      items: payload.items || [],

      totals: payload.totals,
      amountInWords: payload.amountInWords,

      bank: payload.bank,
    });

    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error("Create Invoice Error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

/* ---------------- GET ALL INVOICES ---------------- */
export const getInvoices = async (_req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(invoices);
  } catch (error) {
    console.error("Get Invoices Error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

/* ---------------- GET SINGLE INVOICE ---------------- */
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Get Invoice Error:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

/* ---------------- GENERATE PDF ---------------- */
export const generateInvoicePdf = async (req: Request, res: Response) => {
  try {
    const invoiceDoc = await Invoice.findById(req.params.id);
    if (!invoiceDoc) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Convert mongoose doc → plain object
    const invoice = invoiceDoc.toObject();

    invoice.header = invoice.header || {};

    

    const filename = `invoice-${invoice.invoiceNo}.pdf`;
    return streamInvoicePdf(res, invoice, filename);
  } catch (error) {
    console.error("Generate PDF Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
};
