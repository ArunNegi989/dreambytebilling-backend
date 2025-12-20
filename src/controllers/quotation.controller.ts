import { Request, Response } from "express";
import Quotation, { IQuotation } from "../models/Quotation.js";
import { streamQuotationPdf } from "../utils/quotationPdf.js";

/* CREATE */
export const createQuotation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const quotation: IQuotation = await Quotation.create(req.body);
    return res.status(201).json(quotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/* UPDATE */
export const updateQuotation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.json(quotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/* GET BY ID */
export const getQuotationById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.json(quotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/* GET ALL */
export const getAllQuotations = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    return res.json(quotations);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

/* ✅ DELETE */
export const deleteQuotation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.json({ message: "Quotation deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const downloadQuotationPdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found" });
      return;
    }

    streamQuotationPdf(
      res,
      quotation,
      `quotation-${quotation.quotationNo}.pdf`
    );
  } catch (err) {
    res.status(500).json({ message: "PDF generation failed" });
  }
};
