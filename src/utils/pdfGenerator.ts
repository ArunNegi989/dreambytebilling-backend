import PDFDocument from "pdfkit";
import { Response } from "express";
import fs from "fs";
import path from "path";

/* ---------------- COLORS ---------------- */
const COLORS = {
  bg: "#FBF1DE",
  gold: "#B08A4A",
  darkGold: "#8C6A32",
  text: "#000000",
  muted: "#444444",
};

/* ---------------- HELPERS ---------------- */
const formatINR = (n = 0) =>
  `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function numberToWordsIndian(n: number) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const two = (num: number) =>
    num < 20 ? a[num] : b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");

  const three = (num: number) =>
    Math.floor(num / 100)
      ? a[Math.floor(num / 100)] + " Hundred " + two(num % 100)
      : two(num);

  let str = "";
  if (Math.floor(n / 10000000)) str += three(Math.floor(n / 10000000)) + " Crore ";
  if (Math.floor((n / 100000) % 100)) str += three(Math.floor((n / 100000) % 100)) + " Lakh ";
  if (Math.floor((n / 1000) % 100)) str += three(Math.floor((n / 1000) % 100)) + " Thousand ";
  if (n % 1000) str += three(n % 1000);

  return str.trim();
}

function resolveImage(p?: string) {
  if (!p) return undefined;
  if (fs.existsSync(p)) return p;
  const full = path.join(process.cwd(), p);
  if (fs.existsSync(full)) return full;
  return undefined;
}

/* ---------------- MAIN PDF ---------------- */
export function streamInvoicePdf(
  res: Response,
  invoice: any,
  filename = "invoice.pdf"
) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  doc.pipe(res);

  const W = 595;
  const H = 842;
  const left = 36;
  const right = W - 36;

  /* -------- BACKGROUND -------- */
  doc.rect(0, 0, W, H).fill(COLORS.bg);

  /* -------- TOP DESIGN -------- */
  doc.fillColor(COLORS.gold).polygon([420, 0], [595, 0], [595, 110]).fill();
  doc.fillColor(COLORS.darkGold).polygon([500, 0], [595, 0], [595, 65]).fill();
  doc.fillColor("#333").polygon([470, 0], [595, 0], [595, 35]).fill();

  /* -------- HEADER -------- */
  doc
    .fillColor(COLORS.darkGold)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("DREAMBYTE SOLUTION (OPC) PVT. LTD.", left, 38);

  doc.moveTo(left, 66).lineTo(left + 420, 66).stroke(COLORS.gold);

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
  doc.text(
    "Near Siddhartha Group of Institutions Danda Khudanewala, Sahastradhara Road, Dehradun, Uttarakhand - 248001",
    left,
    78,
    { width: 380 }
  );

  doc.text(`PAN No: ${invoice.header?.panNo || "-"}`, left, 110);
  doc.text(`Supplier GSTIN: ${invoice.header?.supplierGstin || "-"}`, left, 124);
  doc.text(`Category: ${invoice.header?.category || "-"}`, left, 138);

  /* -------- LOGO -------- */
/* -------- LOGO + CONTACT -------- */
const logoPath = resolveImage(invoice.header?.logoPath);

const logoX = right - 220;
const logoY = 20;
const logoWidth = 200;

if (logoPath) {
  doc.image(logoPath, logoX, logoY, {
    width: logoWidth,
  });

  // Phone & Email below logo
  const contactY = logoY + 110;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(
      `📞 ${invoice.header?.phone || "+91-XXXXXXXXXX"}`,
      logoX,
      contactY,
      { width: logoWidth, align: "center" }
    );

  doc.text(
    `✉️ ${invoice.header?.email || "info@dreambytesolution.com"}`,
    logoX,
    contactY + 12,
    { width: logoWidth, align: "center" }
  );
}

  /* -------- INVOICE BAR -------- */
  doc.rect(left, 165, right - left, 32).fill(COLORS.gold);

  doc.fillColor("#fff").fontSize(11);
  doc.text("Invoice No:", left + 12, 174);
  doc.text("Invoice Date:", right - 200, 174);

  doc.font("Helvetica-Bold");
  doc.text(invoice.office?.invoiceNo || "-", left + 90, 174);
  doc.text(invoice.office?.dateOfInvoice || "-", right - 80, 174, { align: "right" });

  /* -------- META INFO -------- */
  let y = 215;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  doc.text(`IRN: ${invoice.office?.irn || "-"}`, left, y);
  doc.text(`Ack No: ${invoice.office?.ackNo || "-"}`, left, y + 14);
  doc.text(`Ack Date: ${invoice.office?.ackDate || "-"}`, left, y + 28);

  doc.text(`Place of Supply: ${invoice.office?.placeOfSupply || "-"}`, right - 260, y);
  doc.text(`Reverse Charge: ${invoice.office?.reverseCharge || "-"}`, right - 260, y + 14);
  doc.text(`Client Order No: ${invoice.office?.clientOrderNo || "-"}`, right - 260, y + 28);
  doc.text(`Order Date: ${invoice.office?.orderDate || "-"}`, right - 260, y + 42);

  /* -------- BILL & SHIP -------- */
  y += 70;
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("BILL TO", left, y);
  doc.text("SHIP TO", right - 200, y);

  y += 16;
  doc.font("Helvetica").fontSize(10);
  doc.text(invoice.billedTo?.name || "-", left, y);
  doc.text(invoice.billedTo?.address || "-", left, y + 14, { width: 220 });

  doc.text(invoice.shipTo?.name || "-", right - 200, y);
  doc.text(invoice.shipTo?.address || "-", right - 200, y + 14, { width: 200 });

  /* -------- CAMPAIGN -------- */
  y += 60;
  doc.font("Helvetica-Bold").text("Campaign Details", left, y);
  y += 14;
  doc.font("Helvetica").fontSize(9);
  doc.text(`Name: ${invoice.campaign?.name || "-"}`, left, y);
  doc.text(
    `Period: ${invoice.campaign?.start || "-"} to ${invoice.campaign?.end || "-"}`,
    left,
    y + 14
  );
  doc.text(`Party PAN: ${invoice.partyPan || "-"}`, right - 260, y);
  doc.text(`Receiver GSTIN: ${invoice.receiverGstin || "-"}`, right - 260, y + 14);

  /* -------- ITEMS TABLE -------- */
  y += 50;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Description", left, y);
  doc.text("Qty", left + 240, y);
  doc.text("Rate", left + 300, y);
  doc.text("Amount", right - 80, y, { align: "right" });

  y += 10;
  doc.moveTo(left, y).lineTo(right, y).stroke(COLORS.gold);
  y += 8;

  doc.font("Helvetica").fontSize(9);
  (invoice.items || []).forEach((item: any) => {
    doc.text(item.specification || "-", left, y, { width: 220 });
    doc.text(item.qty || 0, left + 240, y);
    doc.text(formatINR(item.rate), left + 300, y);
    doc.text(formatINR(item.amount), right - 80, y, { align: "right" });
    y += 18;
  });

  /* -------- TOTALS -------- */
  y += 10;
  doc.font("Helvetica").fontSize(10);
  doc.text("Sub Total", right - 200, y);
  doc.text(formatINR(invoice.totals?.subtotal), right - 80, y, { align: "right" });

  y += 14;
  doc.text("CGST", right - 200, y);
  doc.text(formatINR(invoice.totals?.cgst), right - 80, y, { align: "right" });

  y += 14;
  doc.text("SGST", right - 200, y);
  doc.text(formatINR(invoice.totals?.sgst), right - 80, y, { align: "right" });

  y += 18;
  doc.font("Helvetica-Bold");
  doc.text("Grand Total", right - 200, y);
  doc.text(formatINR(invoice.totals?.grandTotal), right - 80, y, { align: "right" });

  /* -------- AMOUNT IN WORDS -------- */
  y += 20;
  doc.font("Helvetica").fontSize(9);
  doc.text(
    `Amount in Words: ${
      invoice.totals?.amountInWords ||
      numberToWordsIndian(invoice.totals?.grandTotal)
    }`,
    left,
    y,
    { width: 380 }
  );

  /* -------- BANK DETAILS -------- */
  y += 40;
  doc.font("Helvetica-Bold").text("Bank Details", left, y);
  y += 14;
  doc.font("Helvetica").fontSize(9);
  doc.text(`Bank Name: ${invoice.bank?.bankName || "-"}`, left, y);
  doc.text(`Account No: ${invoice.bank?.accountNo || "-"}`, left, y + 14);
  doc.text(`IFSC: ${invoice.bank?.ifsc || "-"}`, left, y + 28);
  doc.text(`Branch: ${invoice.bank?.branch || "-"}`, left, y + 42);

  /* -------- FOOTER -------- */
  doc.fontSize(8).fillColor(COLORS.muted);
  doc.text(invoice.footerAddress || "", left, H - 80, { width: 350 });
  doc.text(`Notes: ${invoice.notes || ""}`, left, H - 50, { width: 350 });

  doc.end();
}
