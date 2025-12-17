import PDFDocument from "pdfkit";
import { Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";


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
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  doc
    .moveTo(left, headerStartY + 86)
    .lineTo(left + maxTextWidth, headerStartY + 86)
    .stroke(COLORS.gold);

  /* -------- LOGO -------- */
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoX = right - 180;
  const logoY = 10;
  const logoWidth = 180;

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, logoY, { width: logoWidth });
  }

  /* -------- CONTACT DETAILS -------- */
  const contactStartY = logoY + 125;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  doc.text(
    `Phone: ${invoice.header?.office?.personalPhone || "-"}`,
    logoX,
    contactStartY,
    { width: logoWidth, align: "center" }
  );

  if (invoice.header?.office?.alternatePhone) {
    doc.text(
      `Phone: ${invoice.header.office.alternatePhone}`,
      logoX,
      contactStartY + 14,
      { width: logoWidth, align: "center" }
    );
  }

  doc.text(
    invoice.header?.office?.officeAddress || "-",
    logoX,
    contactStartY + 28,
    { width: logoWidth, align: "center" }
  );

  doc
    .moveTo(logoX, contactStartY + 45)
    .lineTo(logoX + logoWidth, contactStartY + 45)
    .stroke(COLORS.gold);

  /* ================= MAIN TABLE ================= */

  const tableX = left;
  const tableY = 190;
  const tableWidth = right - left;
  const colWidth = tableWidth / 2 - 16;

  const row1Height = 28;
  const row2Height = 38;

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("TAX INVOICE", tableX, tableY + 7, {
    width: tableWidth,
    align: "center",
  });

  let row2Y = tableY + row1Height + 8;
  doc.font("Helvetica").fontSize(9);

  doc.text(`Invoice No : ${invoice.invoiceNo || "-"}`, tableX + 8, row2Y);
  doc.text(
    `Date of Invoice : ${invoice.dateOfInvoice || "-"}`,
    tableX + tableWidth / 2 + 8,
    row2Y
  );
  doc.text(
    `Place of Supply : ${invoice.placeOfSupply || "-"}`,
    tableX + 8,
    row2Y + 14
  );

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

  doc.text(invoice.shipTo?.name || "-", tableX + tableWidth / 2 + 8, shipY, { width: colWidth });
  shipY += doc.heightOfString(invoice.shipTo?.name || "-", { width: colWidth });
  doc.text(invoice.shipTo?.address || "-", tableX + tableWidth / 2 + 8, shipY, { width: colWidth });

  const infoStartY = Math.max(billY, shipY) + 14;
  doc.text(
    `Receiver GSTIN: ${invoice.receiverGstin || "-"}`,
    tableX + 8,
    infoStartY,
    { width: tableWidth - 16 }
  );

  let currentY =
    infoStartY +
    doc.heightOfString(`Receiver GSTIN: ${invoice.receiverGstin || "-"}`, {
      width: tableWidth - 16,
    }) +
    20;

  /* ================= ITEMS TABLE ================= */

  const columns = [
    { label: "S.N.", w: 0.05 },
    { label: "Location", w: 0.18 },
    { label: "SAC/HSN", w: 0.14 },
    { label: "Qty", w: 0.08 },
    { label: "Note", w: 0.25 },
    { label: "Rate (PM/SQFT)", w: 0.15 },
    { label: "Amount", w: 0.15 },
  ].map(c => ({ ...c, w: c.w * tableWidth }));

  doc.font("Helvetica-Bold").fontSize(9);
  let x = tableX;

  columns.forEach(c => {
    doc.rect(x, currentY, c.w, 24).stroke(COLORS.muted);
    doc.text(c.label, x + 4, currentY + 7, {
      width: c.w - 8,
      align: "center",
    });
    x += c.w;
  });

  currentY += 24;
  doc.font("Helvetica").fontSize(9);

  (invoice.items || []).forEach((item: any, i: number) => {
    const values = [
      i + 1,
      item.location || "-",
      item.sacHsn || "-",
      item.qty || "-",
      item.note || "",
      formatINR(Number(item.rate) || 0),
      formatINR(Number(item.amount) || 0),
    ];

    let rowHeight = 0;
    values.forEach((v, idx) => {
      rowHeight = Math.max(
        rowHeight,
        doc.heightOfString(String(v), {
          width: columns[idx].w - 8,
        })
      );
    });

    rowHeight += 12;

    let cx = tableX;
    values.forEach((v, idx) => {
      doc.rect(cx, currentY, columns[idx].w, rowHeight).stroke(COLORS.muted);
      doc.text(String(v), cx + 4, currentY + 6, {
        width: columns[idx].w - 8,
      });
      cx += columns[idx].w;
    });

    currentY += rowHeight;
  });

  /* ================= TOTALS ================= */

  currentY += 14;

  const labelX = tableX + tableWidth - 220;
  const valueX = tableX + tableWidth - 90;

  doc.font("Helvetica").fontSize(9);

  [
    ["Total Taxable Value:", invoice.totals?.subtotal],
    ["IGST:", invoice.totals?.igst],
    ["CGST:", invoice.totals?.cgst],
    ["SGST:", invoice.totals?.sgst],
  ].forEach(r => {
    doc.text(r[0], labelX, currentY);
    doc.text(formatINR(r[1] || 0), valueX, currentY, {
      width: 80,
      align: "right",
    });
    currentY += 14;
  });

  doc.font("Helvetica-Bold");
  doc
    .moveTo(labelX, currentY + 2)
    .lineTo(tableX + tableWidth - 8, currentY + 2)
    .stroke(COLORS.muted);

  currentY += 6;
  doc.text("Grand Total", labelX, currentY);
  doc.text(
    formatINR(invoice.totals?.grandTotal || 0),
    valueX,
    currentY,
    { width: 80, align: "right" }
  );

  currentY += 18;

  /* -------- RUPEES IN WORDS (MOVED BELOW TOTALS) -------- */

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Rupees in words:", tableX + 8, currentY);

  doc.font("Helvetica").fontSize(9);
  doc.text(
    invoice.amountInWords || "-",
    tableX + 120,
    currentY,
    { width: tableWidth - 130 }
  );

  currentY +=
    doc.heightOfString(invoice.amountInWords || "-", {
      width: tableWidth - 130,
    }) + 10;

/* -------- BANK DETAILS (ONE BOX ROW - BIGGER FONT) -------- */

const bankText = [
  `Bank Name: ${invoice.bank?.bankName || "-"}`,
  `A/C No: ${invoice.bank?.accountNo || "-"}`,
  `IFSC: ${invoice.bank?.ifsc || "-"}`,
  `Branch: ${invoice.bank?.branch || "-"}`,
  `Pincode: ${invoice.bank?.pincode || "-"}`,
].join("   |   ");

// increased font size
doc.font("Helvetica-Bold").fontSize(9.5);

// calculate height safely
const bankHeight =
  doc.heightOfString(bankText, {
    width: tableWidth - 16,
  }) + 12;

// draw box
doc.rect(tableX, currentY, tableWidth, bankHeight)
   .stroke(COLORS.muted);

// text inside box
doc.text(
  bankText,
  tableX + 8,
  currentY + 6,
  { width: tableWidth - 16 }
);

currentY += bankHeight + 6;

/* ================= TERMS & SIGNATURE (BOX STYLE LIKE IMAGE) ================= */

currentY += 8;

const boxHeight = 120;
const leftWidth = tableWidth * 0.6;
const rightWidth = tableWidth - leftWidth;
const midX = tableX + leftWidth;

/* -------- OUTER BOX -------- */
doc.rect(tableX, currentY, tableWidth, boxHeight).stroke(COLORS.muted);

/* -------- VERTICAL DIVIDER -------- */
doc
  .moveTo(midX, currentY)
  .lineTo(midX, currentY + boxHeight)
  .stroke(COLORS.muted);

/* -------- LEFT : TERMS & CONDITIONS -------- */
doc.font("Helvetica-Bold").fontSize(9);
doc.text("Terms & Conditions", tableX + 6, currentY + 6);

doc.font("Helvetica").fontSize(8.5);

const terms = [
  "1. All payments to be made by Payee A/c Cheque/Draft in favour of",
  "   Media 24x7 Advertising Pvt. Ltd.",
  "2. No dispute of any nature whatsoever will be valid unless brought to our notice within",
  "   7 days of submission of the bill.",
  "3. Interest @18% p.a. will be charged if the payment is not made within the stipulated time.",
  "4. All disputes are subject to Delhi Jurisdiction only.",
].join("\n");

doc.text(
  terms,
  tableX + 6,
  currentY + 20,
  { width: leftWidth - 12 }
);

const signLineY = currentY + 46; // gap after text

doc
  .moveTo(tableX + leftWidth + 210, signLineY)
  .lineTo(midX - 0, signLineY)
  .stroke(COLORS.muted);

/* -------- RIGHT : RECEIVER SIGNATURE -------- */
doc.font("Helvetica-Bold").fontSize(9);
doc.text(
  "Receiver's Signature:",
  midX + 6,
  currentY + 6
);

/* -------- COMPANY NAME -------- */
doc.font("Helvetica-Bold").fontSize(9);
doc.text(
  "DREAMBYTE SOLUTION (OPC) PVT. LTD.",
  midX + 6,
  currentY + 52,
  { width: rightWidth - 12, align: "center" }
);

/* -------- AUTHORISED SIGN IMAGE (FROM PUBLIC FOLDER) -------- */
const signPath = path.join(process.cwd(), "public", "sign.png");

if (fs.existsSync(signPath)) {
  const signWidth = 140;     // 🔼 size increased
  const signHeight = 60;     // 🔼 force height (important)

  const signX = midX + (rightWidth - signWidth) / 2;
  const signY = currentY + 55; // 🔼 thoda upar laaya

  doc.image(signPath, signX, signY, {
    width: signWidth,
    height: signHeight,
  });
}

/* -------- AUTHORISED SIGN TEXT -------- */
doc.font("Helvetica").fontSize(8.5);
doc.text(
  "Authorised Signatory",
  midX + 6,
  currentY + boxHeight - 12,
  { width: rightWidth - 12, align: "center" }
);


/* -------- MOVE Y FOR FINAL BORDER -------- */
currentY += boxHeight + 10;



  /* -------- FINAL BORDER (AUTO-FIT) -------- */
  const tableHeight = currentY - tableY + 10;

  doc.rect(tableX, tableY, tableWidth, tableHeight).stroke(COLORS.muted);

  doc.moveTo(tableX, tableY + row1Height)
     .lineTo(tableX + tableWidth, tableY + row1Height)
     .stroke(COLORS.muted);

  doc.moveTo(tableX, tableY + row1Height + row2Height)
     .lineTo(tableX + tableWidth, tableY + row1Height + row2Height)
     .stroke(COLORS.muted);

  doc.end();
}
