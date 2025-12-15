import mongoose, { Document, Schema } from "mongoose";

/* ---------------- ITEM TYPE ---------------- */
export interface IItem {
  id: string;
  location: string;
  sacHsn: string;
  specification: string;
  qty: number;
  rate: number;
  amount: number;
}

/* ---------------- INVOICE TYPE ---------------- */
export interface IInvoice extends Document {
  header?: {
    panNo?: string;
    supplierGstin?: string;
    category?: string;
    office?: {
      personalPhone?: string;
      alternatePhone?: string;
      officeEmail?: string;
      cin?: string;
      msme?: string;
      officeAddress?: string;
    };
  };

  irn?: string;
  ackNo?: string;
  ackDate?: string;
  gstin?: string;

  invoiceNo: string;
  dateOfInvoice?: string;
  placeOfSupply?: string;

  billedTo?: {
    name?: string;
    address?: string;
  };

  shipTo?: {
    name?: string;
    address?: string;
  };

  partyPan?: string;
  receiverGstin?: string;

  items: IItem[];

  totals: {
    subtotal: number;
    igst: number;
    cgst: number;
    sgst: number;
    grandTotal: number;
  };

  amountInWords?: string;

  bank?: {
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    branch?: string;
    sector?: string;
    pincode?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

/* ---------------- ITEM SCHEMA ---------------- */
const ItemSchema = new Schema<IItem>(
  {
    id: { type: String, required: true },
    location: { type: String, default: "" },
    sacHsn: { type: String, default: "" },
    specification: { type: String, default: "" },
    qty: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ---------------- INVOICE SCHEMA ---------------- */
const InvoiceSchema = new Schema<IInvoice>(
  {
    header: {
      type: Schema.Types.Mixed,
      default: {},
    },

    irn: String,
    ackNo: String,
    ackDate: String,
    gstin: String,

    invoiceNo: { type: String, required: true, index: true },
    dateOfInvoice: String,
    placeOfSupply: String,

    billedTo: {
      name: String,
      address: String,
    },

    shipTo: {
      name: String,
      address: String,
    },

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

    bank: {
      bankName: String,
      accountNo: String,
      ifsc: String,
      branch: String,
      sector: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);
