import mongoose, { Schema, Document } from "mongoose";

/* ---------- TYPES ---------- */
export interface IItem {
  id: string;
  service: string;
  rate: number;
  amount: number;
}

export interface IQuotation extends Document {
  quotationNo: string;
  quotationDate?: Date;
  clientName: string;
  contactNumber?: string;
  email?: string;
  billToAddress: string;
  items: IItem[];
  totals: {
    totalAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/* ---------- ITEM SCHEMA ---------- */
const ItemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true },
    service: { type: String, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

/* ---------- QUOTATION SCHEMA ---------- */
const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNo: { type: String, required: true },
    quotationDate: { type: Date },
    clientName: { type: String, required: true },
    contactNumber: { type: String },
    email: { type: String },
    billToAddress: { type: String, required: true },
    items: { type: [ItemSchema], required: true },
    totals: {
      totalAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IQuotation>(
  "Quotation",
  QuotationSchema
);
