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

/* ---------------- MAIN PDF ---------------- */
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
  doc.fillColor(COLORS.gold).polygon([420,0],[595,0],[595,110]).fill();
  doc.fillColor(COLORS.darkGold).polygon([500,0],[595,0],[595,65]).fill();
  doc.fillColor("#333").polygon([470,0],[595,0],[595,35]).fill();

  /* -------- HEADER -------- */
  doc.fillColor(COLORS.darkGold)
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("DREAMBYTE SOLUTION (OPC) PVT. LTD.", left, 38, { width: 360 });

  doc.moveTo(left, 66).lineTo(left + 360, 66).stroke(COLORS.gold);

  /* -------- HEADER DETAILS -------- */
  const headerStartY = 95;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  const headerTexts = [
    `PAN No: ${invoice.header?.panNo || "-"}`,
    `Supplier GSTIN: ${invoice.header?.supplierGstin || "-"}`,
    `Category: ${invoice.header?.category || "-"}`,
    `CIN No: ${invoice.header?.office?.cin || "-"}`,
    `MSME No: ${invoice.header?.office?.msme || "-"}`,
    `Email: ${invoice.header?.office?.officeEmail || "-"}`,
  ];

  headerTexts.forEach((t, i) =>
    doc.text(t, left, headerStartY + i * 14)
  );

  const maxTextWidth = Math.max(...headerTexts.map(t => doc.widthOfString(t)));
  doc.moveTo(left, headerStartY + 86)
     .lineTo(left + maxTextWidth, headerStartY + 86)
     .stroke(COLORS.gold);

  /* -------- LOGO + CONTACT -------- */
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoX = right - 180;
  const logoY = 10;
  const logoWidth = 180;

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, logoY, { width: logoWidth });
  }

  const contactStartY = logoY + 125;

  doc.text(`Phone: ${invoice.header?.office?.personalPhone || "-"}`,
    logoX, contactStartY, { width: logoWidth, align: "center" });

  if (invoice.header?.office?.alternatePhone) {
    doc.text(`Phone: ${invoice.header.office.alternatePhone}`,
      logoX, contactStartY + 14, { width: logoWidth, align: "center" });
  }

  doc.text(invoice.header?.office?.officeAddress || "-",
    logoX, contactStartY + 28, { width: logoWidth, align: "center" });

  doc.moveTo(logoX, contactStartY + 45)
     .lineTo(logoX + logoWidth, contactStartY + 45)
     .stroke(COLORS.gold);

  /* ================= TABLE ================= */

  const tableX = left;
  const tableY = 190;
  const tableWidth = right - left;
  const colWidth = tableWidth / 2 - 16;

  const row1Height = 28;
  const row2Height = 38;

  /* -------- ROW 1 -------- */
  doc.font("Helvetica-Bold").fontSize(10);
 

  doc.fontSize(11);
  doc.text("TAX INVOICE", tableX, tableY + 7, {
    width: tableWidth,
    align: "center",
  });

  /* -------- ROW 2 -------- */
  let row2Y = tableY + row1Height + 8;
  doc.font("Helvetica").fontSize(9);

  doc.text(`Invoice No : ${invoice.invoiceNo || "-"}`, tableX + 8, row2Y);
  doc.text(`Date of Invoice : ${invoice.dateOfInvoice || "-"}`,
    tableX + tableWidth / 2 + 8, row2Y);

  doc.text(`Place of Supply : ${invoice.placeOfSupply || "-"}`,
    tableX + 8, row2Y + 14);

  /* -------- ROW 3 -------- */
  let row3Y = tableY + row1Height + row2Height + 10;

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("BILLED TO:", tableX + 8, row3Y);
  doc.text("SHIP TO:", tableX + tableWidth / 2 + 8, row3Y);

  doc.font("Helvetica").fontSize(9);

  let billY = row3Y + 16;
  let shipY = row3Y + 16;

  doc.text(invoice.billedTo?.name || "-", tableX + 8, billY, { width: colWidth });
  billY += doc.heightOfString(invoice.billedTo?.name || "-", { width: colWidth });
  doc.text(invoice.billedTo?.address || "-", tableX + 8, billY, { width: colWidth });
  billY += doc.heightOfString(invoice.billedTo?.address || "-", { width: colWidth });

  doc.text(invoice.shipTo?.name || "-", tableX + tableWidth / 2 + 8, shipY, { width: colWidth });
  shipY += doc.heightOfString(invoice.shipTo?.name || "-", { width: colWidth });
  doc.text(invoice.shipTo?.address || "-", tableX + tableWidth / 2 + 8, shipY, { width: colWidth });
  shipY += doc.heightOfString(invoice.shipTo?.address || "-", { width: colWidth });

  /* -------- PLACE / GSTIN (SMALL GAP) -------- */
  const infoStartY = Math.max(billY, shipY) + 14;

  let infoY = infoStartY;

  doc.text(`Receiver GSTIN: ${invoice.receiverGstin || "-"}`,
    tableX + 8, infoY, { width: tableWidth - 16 });

  /* -------- TABLE HEIGHT -------- */
  const infoHeight =
   
    doc.heightOfString(`Receiver GSTIN: ${invoice.receiverGstin || "-"}`, { width: tableWidth - 16 });

  const row3Height =
    infoStartY - row3Y +
    infoHeight +
    12;

  const tableHeight = row1Height + row2Height + row3Height;

  /* -------- TABLE BORDER -------- */
  doc.rect(tableX, tableY, tableWidth, tableHeight).stroke(COLORS.muted);

  doc.moveTo(tableX, tableY + row1Height)
     .lineTo(tableX + tableWidth, tableY + row1Height)
     .stroke(COLORS.muted);

  doc.moveTo(tableX, tableY + row1Height + row2Height)
     .lineTo(tableX + tableWidth, tableY + row1Height + row2Height)
     .stroke(COLORS.muted);

  doc.end();
}

