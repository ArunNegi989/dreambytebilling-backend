import InvoiceCounter from "../models/InvoiceCounter.js";
import { getFinancialYear } from "./getFinancialYear.js";

export const generateInvoiceNumber = async (): Promise<string> => {
  const financialYear = getFinancialYear(); // eg: 2425

  const counter = await InvoiceCounter.findOneAndUpdate(
    { financialYear },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequence = String(counter.seq).padStart(3, "0");

  return `DBS-${financialYear}-${sequence}`;
};
