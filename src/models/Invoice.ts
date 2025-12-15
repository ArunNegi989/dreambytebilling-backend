// src/models/Invoice.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IItem {
  id: string;
  location: string;
  sacHsn: string;
  specification: string;
  city?: string;
  qty: number;
  startDate?: string;
  endDate?: string;
  rate: number;
  amount: number;
}

export interface IInvoice extends Document {
  header: any;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  gstin?: string;
  invoiceNo: string;
  dateOfInvoice?: string;
  placeOfSupply?: string;
  reverseCharge?: "Yes" | "No";
  clientOrderNo?: string;
  orderDate?: string;
  billedTo?: { name?: string; address?: string };
  shipTo?: { name?: string; address?: string };
  campaign?: { name?: string; start?: string; end?: string };
  partyPan?: string;
  receiverGstin?: string;
  items: IItem[];
  totals: { subtotal: number; igst: number; cgst: number; sgst: number; grandTotal: number };
  amountInWords?: string;
  bank?: any;
  footerAddress?: string;
  notes?: string;
  meta?: any;
  taxRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true },
    location: { type: String, default: "" },
    sacHsn: { type: String, default: "" },
    specification: { type: String, default: "" },
    city: { type: String },
    qty: { type: Number, default: 1 },
    startDate: { type: String },
    endDate: { type: String },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    header: { type: Schema.Types.Mixed, default: {} },
    irn: String,
    ackNo: String,
    ackDate: String,
    gstin: String,
    invoiceNo: { type: String, required: true, index: true },
    dateOfInvoice: String,
    placeOfSupply: String,
    reverseCharge: { type: String, enum: ["Yes", "No"], default: "No" },
    clientOrderNo: String,
    orderDate: String,
    billedTo: { name: String, address: String },
    shipTo: { name: String, address: String },
    campaign: { name: String, start: String, end: String },
    partyPan: String,
    receiverGstin: String,
    items: { type: [ItemSchema], default: [] },
    totals: {
      subtotal: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    amountInWords: String,
    bank: { type: Schema.Types.Mixed, default: {} },
    footerAddress: String,
    notes: String,
    meta: Schema.Types.Mixed,
    taxRate: Number,
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);
