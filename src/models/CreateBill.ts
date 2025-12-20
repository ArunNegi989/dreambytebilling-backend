import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  Services: String,
  sacHsn: String,
  specification: String,
  qty: Number,
  rate: Number,
  amount: Number
});

const CreateBillSchema = new mongoose.Schema(
  {
    billNo: { type: String, unique: true },

    header: {
      panNo: String,
      supplierGstin: String,
      category: String,
      office: {
        officeEmail: String,
        personalPhone: String,
        alternatePhone: String,
        cin: String,
        msme: String,
        officeAddress: String
      }
    },

    gstin: String,

    billedTo: {
      name: String,
      address: String
    },

    shipTo: {
      name: String,
      address: String
    },

    receiverGstin: String,

    items: [ItemSchema],

    totals: {
      subtotal: Number
    },

    amountInWords: String,

    bank: {
      bankName: String,
      accountNo: String,
      ifsc: String,
      branch: String,
      pincode: String
    }
  },
  { timestamps: true }
);

/* 🔥 AUTO BILL NUMBER */
CreateBillSchema.pre("save", async function (next) {
  if (this.billNo) return next();

  const count = await mongoose.model("CreateBill").countDocuments();
  this.billNo = `BILL-${String(count + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("CreateBill", CreateBillSchema);
