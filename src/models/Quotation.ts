import mongoose, { Schema, Document } from "mongoose";

/* ---------- TYPES ---------- */
export interface IItem {
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
const ItemSchema = new Schema<IItem>({
  service: { type: String, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
});

/* ---------- QUOTATION SCHEMA ---------- */
const QuotationSchema = new Schema<IQuotation>(
  {
    quotationNo: { type: String, required: true },
    quotationDate: Date,
    clientName: { type: String, required: true },
    contactNumber: String,
    email: String,
    billToAddress: { type: String, required: true },
    items: { type: [ItemSchema], required: true },
    totals: {
      totalAmount: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IQuotation>("Quotation", QuotationSchema);
