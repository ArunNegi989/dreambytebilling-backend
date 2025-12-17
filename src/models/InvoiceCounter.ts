import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceCounter extends Document {
  financialYear: string;
  seq: number;
}

const InvoiceCounterSchema = new Schema<IInvoiceCounter>(
  {
    financialYear: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoiceCounter>(
  "InvoiceCounter",
  InvoiceCounterSchema
);
