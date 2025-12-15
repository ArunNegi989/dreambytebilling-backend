// src/controllers/invoiceController.ts
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import Invoice from "../models/Invoice.js";
import { streamInvoicePdf } from "../utils/pdfGenerator.js";

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.invoiceNo) return res.status(400).json({ error: "invoiceNo required" });

    const items = Array.isArray(payload.items) ? payload.items : [];
    const totals = payload.totals || { subtotal: 0, igst: 0, cgst: 0, sgst: 0, grandTotal: 0 };

    const invoice = new Invoice({
      header: payload.header || {},
      irn: payload.irn,
      ackNo: payload.ackNo,
      ackDate: payload.ackDate,
      gstin: payload.gstin,
      invoiceNo: payload.invoiceNo,
      dateOfInvoice: payload.dateOfInvoice,
      placeOfSupply: payload.placeOfSupply,
      reverseCharge: payload.reverseCharge,
      clientOrderNo: payload.clientOrderNo,
      orderDate: payload.orderDate,
      billedTo: payload.billedTo,
      shipTo: payload.shipTo,
      campaign: payload.campaign,
      partyPan: payload.partyPan,
      receiverGstin: payload.receiverGstin,
      items: items.map((it: any) => ({
        id: it.id,
        location: it.location,
        sacHsn: it.sacHsn,
        specification: it.specification,
        city: it.city,
        qty: Number(it.qty || 0),
        startDate: it.startDate,
        endDate: it.endDate,
        rate: Number(it.rate || 0),
        amount: Number(it.amount || 0),
      })),
      totals,
      amountInWords: payload.amountInWords,
      bank: payload.bank,
      footerAddress: payload.footerAddress,
      notes: payload.notes,
      meta: payload.meta || {},
      taxRate: payload.taxRate || 18,
    });

    const saved = await invoice.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error("createInvoice error:", err);
    return res.status(500).json({ error: "Failed to save invoice" });
  }
};

export const getInvoices = async (_req: Request, res: Response) => {
  try {
    const list = await Invoice.find().sort({ createdAt: -1 }).limit(500).lean();
    res.json(list);
  } catch (err) {
    console.error("getInvoices error:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).lean();
    if (!inv) return res.status(404).json({ error: "Invoice not found" });
    res.json(inv);
  } catch (err) {
    console.error("getInvoice error:", err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const generateInvoicePdf = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id).lean();
    if (!inv) return res.status(404).json({ error: "Invoice not found" });

    // Ensure header exists
    inv.header = inv.header || {};

    // 1) Set local logo path (project-root/public/logo.png)
    //    Make sure you placed your logo at <project-root>/public/logo.png
    const logoRelPath = path.join("public", "logo.png"); // relative
    const logoAbsPath = path.join(process.cwd(), logoRelPath);

    if (fs.existsSync(logoAbsPath)) {
      // pdfGenerator supports invoice.header.logoPath (string) OR invoice.header.logoBuffer (Buffer)
      inv.header.logoPath = logoAbsPath;
      try {
        inv.header.logoBuffer = fs.readFileSync(logoAbsPath);
      } catch (readErr) {
        // if buffer read fails, continue — generator will use logoPath
        console.warn("Could not read logo to buffer, will use path:", readErr);
      }
    } else {
      console.warn(`Logo not found at ${logoAbsPath}. PDF will use text placeholder.`);
    }

    // OPTIONAL: If you store a QR URL in invoice.qrUrl and want to fetch it into a buffer:
    // if (inv.qrUrl && inv.qrUrl.startsWith("http")) {
    //   try {
    //     const axios = (await import("axios")).default;
    //     const resp = await axios.get(inv.qrUrl, { responseType: "arraybuffer" });
    //     inv.qrBuffer = Buffer.from(resp.data, "binary");
    //   } catch (e) {
    //     console.warn("Failed to fetch QR image:", e);
    //   }
    // }

    const filename = `invoice-${inv.invoiceNo || id}.pdf`;
    return streamInvoicePdf(res, inv, filename);
  } catch (err) {
    console.error("generateInvoicePdf error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate PDF" });
  }
};
