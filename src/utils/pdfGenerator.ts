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

/* ---------------- CONSTANTS ---------------- */
const COMPANY_NAME = "DREAMBYTE SOLUTION (OPC) PVT. LTD.";
const W = 595;
const H = 842;
const LEFT = 36;
const RIGHT = W - 36;
const MAX_ITEMS_PER_PAGE = 8; // Adjust based on your needs

/* ---------------- HELPERS ---------------- */
const formatINR = (n = 0) =>
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date: string | Date | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/* ---------------- DRAW HEADER ---------------- */
function drawHeader(
  doc: PDFKit.PDFDocument,
  invoice: any,
  isFirstPage: boolean
) {
  /* -------- BACKGROUND -------- */
  doc.rect(0, 0, W, H).fill(COLORS.bg);

  /* -------- TOP DESIGN -------- */
  doc.fillColor(COLORS.gold).polygon([420, 0], [595, 0], [595, 110]).fill();
  doc.fillColor(COLORS.darkGold).polygon([500, 0], [595, 0], [595, 65]).fill();
  doc.fillColor("#333").polygon([470, 0], [595, 0], [595, 35]).fill();

  /* -------- COMPANY NAME (ALL PAGES) -------- */
  doc
    .fillColor(COLORS.darkGold)
    .font("Helvetica-Bold")
    .fontSize(isFirstPage ? 18 : 15)
    .text(COMPANY_NAME, LEFT, 38, { width: 360 });

  doc
    .moveTo(LEFT, 66)
    .lineTo(LEFT + 360, 66)
    .stroke(COLORS.gold);

  /* =====================================================
     ❌ STOP HERE FOR NEXT PAGES
     ===================================================== */
  if (!isFirstPage) return;

  /* -------- HEADER DETAILS (FIRST PAGE ONLY) -------- */
  const headerStartY = 115;
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  const headerTexts = [
    `PAN No: ${invoice.header?.panNo || "-"}`,
    `Supplier GSTIN: ${invoice.header?.supplierGstin || "-"}`,
    `Category: ${invoice.header?.category || "-"}`,
    `CIN No: ${invoice.header?.office?.cin || "-"}`,
    `MSME No: ${invoice.header?.office?.msme || "-"}`,
    `Email: ${invoice.header?.office?.officeEmail || "-"}`,
  ];

  headerTexts.forEach((t, i) => doc.text(t, LEFT, headerStartY + i * 14));

  const maxTextWidth = Math.max(
    ...headerTexts.map((t) => doc.widthOfString(t))
  );

  doc
    .moveTo(LEFT, headerStartY + 86)
    .lineTo(LEFT + maxTextWidth, headerStartY + 86)
    .stroke(COLORS.gold);

  /* -------- LOGO (FIRST PAGE ONLY) -------- */
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoX = RIGHT - 180;

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, 10, { width: 180 });
  }

  /* -------- CONTACT DETAILS (FIRST PAGE ONLY) -------- */
  const contactStartY = 135;

  doc.text(
    `Phone: ${invoice.header?.office?.personalPhone || "-"}`,
    logoX,
    contactStartY,
    { width: 180, align: "center" }
  );

  if (invoice.header?.office?.alternatePhone) {
    doc.text(invoice.header.office.alternatePhone, logoX, contactStartY + 14, {
      width: 180,
      align: "center",
    });
  }

  doc.text(
    invoice.header?.office?.officeAddress || "-",
    logoX,
    contactStartY + 28,
    { width: 180, align: "center" }
  );

  doc
    .moveTo(logoX, contactStartY + 65)
    .lineTo(logoX + 180, contactStartY + 65)
    .stroke(COLORS.gold);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
}

/* ---------------- DRAW INVOICE INFO TABLE ---------------- */
function drawInvoiceInfo(doc: PDFKit.PDFDocument, invoice: any) {
  const tableX = LEFT;
  const tableY = 215;
  const tableWidth = RIGHT - LEFT;

  const padding = 8;

  // ---- TITLE ----
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("TAX INVOICE", tableX, tableY + 8, {
    width: tableWidth,
    align: "center",
  });
  // ---- line below TAX INVOICE ----
  doc
    .moveTo(tableX, tableY + 26)
    .lineTo(tableX + tableWidth, tableY + 26)
    .stroke(COLORS.muted);

  let y = tableY + 30;

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  // ---- ROW 1 ----
  doc.text(`Invoice No : ${invoice.invoiceNo || "-"}`, tableX + padding, y);
  doc.text(
    `Date of Invoice : ${formatDate(invoice.dateOfInvoice)}`,
    tableX + tableWidth / 2,
    y
  );

  y += 16;

  doc.text(
    `Place of Supply : ${invoice.placeOfSupply || "-"}`,
    tableX + padding,
    y
  );
  y += 12;

  // ---- line below Place of Supply ----
  doc
    .moveTo(tableX, y)
    .lineTo(tableX + tableWidth, y)
    .stroke(COLORS.muted);

  y += 10;

  y += 22;

  // ---- BILLED / SHIP HEADERS ----
  doc.font("Helvetica-Bold");
  doc.text("BILLED TO:", tableX + padding, y);
  doc.text("SHIP TO:", tableX + tableWidth / 2, y);

  y += 14;
  doc.font("Helvetica");

  // ---- BILLED TO ----
  const billedText =
    `${invoice.billedTo?.name || "-"}\n` +
    `${invoice.billedTo?.address || "-"}`;

  const billedHeight = doc.heightOfString(billedText, {
    width: tableWidth / 2 - padding * 2,
  });

  doc.text(billedText, tableX + padding, y, {
    width: tableWidth / 2 - padding * 2,
  });

  // ---- SHIP TO ----
  const shipText =
    `${invoice.shipTo?.name || "-"}\n` + `${invoice.shipTo?.address || "-"}`;

  const shipHeight = doc.heightOfString(shipText, {
    width: tableWidth / 2 - padding * 2,
  });

  doc.text(shipText, tableX + tableWidth / 2, y, {
    width: tableWidth / 2 - padding * 2,
  });

  const sectionHeight = Math.max(billedHeight, shipHeight);

  y += sectionHeight + 16;

  // ---- RECEIVER GST ----
  doc.text(
    `Receiver GSTIN: ${invoice.receiverGstin || "-"}`,
    tableX + padding,
    y,
    { width: tableWidth - padding * 2 }
  );

  y +=
    doc.heightOfString(`Receiver GSTIN: ${invoice.receiverGstin || "-"}`, {
      width: tableWidth - padding * 2,
    }) + 10;

  // ---- 🔥 OUTER BORDER (THIS WAS MISSING) ----
  doc.rect(tableX, tableY, tableWidth, y - tableY + 6).stroke(COLORS.muted);

  return y + 12;
}

/* ---------------- DRAW ITEMS TABLE HEADER ---------------- */
function drawItemsTableHeader(doc: PDFKit.PDFDocument, startY: number) {
  const tableX = LEFT;
  const tableWidth = RIGHT - LEFT;

  const columns = [
    { label: "S.N.", w: 0.05 },
    { label: "Services", w: 0.18 },
    { label: "SAC/HSN", w: 0.14 },
    { label: "Qty", w: 0.08 },
    { label: "Note", w: 0.25 },
    { label: "Rate (PM/SQFT)", w: 0.15 },
    { label: "Amount", w: 0.15 },
  ].map((c) => ({ ...c, w: c.w * tableWidth }));

  doc.font("Helvetica-Bold").fontSize(9);
  let x = tableX;

  columns.forEach((c) => {
    doc.rect(x, startY, c.w, 24).stroke(COLORS.muted);
    doc.text(c.label, x + 4, startY + 7, {
      width: c.w - 8,
      align: "center",
    });
    x += c.w;
  });

  return { columns, headerHeight: 24 };
}

/* ---------------- DRAW ITEM ROW ---------------- */
function drawItemRow(
  doc: PDFKit.PDFDocument,
  item: any,
  index: number,
  startY: number,
  columns: any[]
) {
  const tableX = LEFT;

  const values = [
    index + 1,
    item.Services || "-",
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
  doc.font("Helvetica").fontSize(9);

  values.forEach((v, idx) => {
    doc.rect(cx, startY, columns[idx].w, rowHeight).stroke(COLORS.muted);
    doc.text(String(v), cx + 4, startY + 6, {
      width: columns[idx].w - 8,
    });
    cx += columns[idx].w;
  });

  return rowHeight;
}

/* ---------------- DRAW TOTALS ---------------- */
function drawTotals(doc: PDFKit.PDFDocument, invoice: any, startY: number) {
  const tableX = LEFT;
  const tableWidth = RIGHT - LEFT;

  const labelWidth = 140;
  const valueWidth = 80;

  const labelX = tableX + tableWidth - (labelWidth + valueWidth + 20);
  const valueX = tableX + tableWidth - valueWidth - 10;

  let y = startY + 10;
  const rowGap = 14;

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  const rows = [
    ["Total Taxable Value:", invoice.totals?.subtotal],
    ["IGST:", invoice.totals?.igst],
    ["CGST:", invoice.totals?.cgst],
    ["SGST:", invoice.totals?.sgst],
  ];

  // -------- TOTAL ROWS --------
  rows.forEach(([label, value]) => {
    doc.text(label, labelX, y, {
      width: labelWidth,
      align: "left",
    });

    doc.text(formatINR(value || 0), valueX, y, {
      width: valueWidth,
      align: "right",
    });

    y += rowGap;
  });

  // -------- DIVIDER --------
  doc
    .moveTo(labelX, y)
    .lineTo(tableX + tableWidth, y)
    .stroke(COLORS.muted);

  y += 6;

  // -------- GRAND TOTAL --------
  doc.font("Helvetica-Bold");

  doc.text("Grand Total", labelX, y, {
    width: labelWidth,
    align: "left",
  });

  doc.text(formatINR(invoice.totals?.grandTotal || 0), valueX, y, {
    width: valueWidth,
    align: "right",
  });

  y += rowGap + 8;

  // -------- RUPEES IN WORDS (ONLY HERE) --------
  doc.font("Helvetica-Bold");
  doc.text("Rupees in words:", tableX + 8, y);

  doc.font("Helvetica");
  const words = invoice.amountInWords || "-";

  const wordsHeight = doc.heightOfString(words, {
    width: tableWidth - 130,
  });

  doc.text(words, tableX + 120, y, {
    width: tableWidth - 130,
  });

  const boxHeight = y + wordsHeight + 10 - startY;

  // -------- OUTER BOX --------
  doc.rect(tableX, startY, tableWidth, boxHeight).stroke(COLORS.muted);

  return startY + boxHeight + 10;
}

function getItemRowHeight(doc: PDFKit.PDFDocument, item: any, columns: any[]) {
  const values = [
    String(item.Services || "-"),
    String(item.sacHsn || "-"),
    String(item.qty || "-"),
    String(item.note || ""),
    formatINR(Number(item.rate) || 0),
    formatINR(Number(item.amount) || 0),
  ];

  let height = 0;

  values.forEach((v, i) => {
    height = Math.max(
      height,
      doc.heightOfString(v, {
        width: columns[i + 1].w - 8, // skip S.N.
      })
    );
  });

  return height + 12;
}

/* ---------------- DRAW FOOTER (BANK, TERMS, SIGNATURE) ---------------- */
function drawFooter(doc: PDFKit.PDFDocument, invoice: any, startY: number) {
  const tableX = LEFT;
  const tableWidth = RIGHT - LEFT;

  let currentY = startY;

  currentY +=
    doc.heightOfString(invoice.amountInWords || "-", {
      width: tableWidth - 130,
    }) + 0;

  /* -------- BANK DETAILS -------- */
  const bankText = [
    `Bank Name: ${invoice.bank?.bankName || "-"}`,
    `A/C No: ${invoice.bank?.accountNo || "-"}`,
    `IFSC: ${invoice.bank?.ifsc || "-"}`,
    `Branch: ${invoice.bank?.branch || "-"}`,
    `Pincode: ${invoice.bank?.pincode || "-"}`,
  ].join("   |   ");

  doc.font("Helvetica-Bold").fontSize(9.5);

  const bankHeight =
    doc.heightOfString(bankText, {
      width: tableWidth - 16,
    }) + 12;

  doc.rect(tableX, currentY, tableWidth, bankHeight).stroke(COLORS.muted);

  doc.text(bankText, tableX + 8, currentY + 6, { width: tableWidth - 16 });

  currentY += bankHeight + 0;

  /* -------- TERMS & SIGNATURE BOX -------- */
  const boxHeight = 120;
  const leftWidth = tableWidth * 0.6;
  const rightWidth = tableWidth - leftWidth;
  const midX = tableX + leftWidth;

  doc.rect(tableX, currentY, tableWidth, boxHeight).stroke(COLORS.muted);

  doc
    .moveTo(midX, currentY)
    .lineTo(midX, currentY + boxHeight)
    .stroke(COLORS.muted);

  /* -------- LEFT : TERMS -------- */
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Terms & Conditions", tableX + 6, currentY + 6);

  doc.font("Helvetica").fontSize(8);

  const terms = [
    "1. Payments via Cheque/Draft to Media 24x7 Advertising Pvt. Ltd.",
    "2. Disputes valid within 7 days of bill submission.",
    "3. 18% p.a. interest on delayed payments.",
    "4. Delhi Jurisdiction applies.",
  ].join("\n");

  doc.text(terms, tableX + 6, currentY + 20, { width: leftWidth - 12 });

  /* -------- RIGHT : SIGNATURE -------- */
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Receiver's Signature:", midX + 6, currentY + 6);

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text(COMPANY_NAME, midX + 6, currentY + 52, {
    width: rightWidth - 12,
    align: "center",
  });

  const signPath = path.join(process.cwd(), "public", "sign.png");

  if (fs.existsSync(signPath)) {
    const signWidth = 140;
    const signHeight = 60;
    const signX = midX + (rightWidth - signWidth) / 2;
    const signY = currentY + 55;

    doc.image(signPath, signX, signY, {
      width: signWidth,
      height: signHeight,
    });
  }

  doc.font("Helvetica").fontSize(8.5);
  doc.text("Authorised Signatory", midX + 6, currentY + boxHeight - 12, {
    width: rightWidth - 12,
    align: "center",
  });

  return currentY + boxHeight;
}

/* ---------------- MAIN PDF GENERATION ---------------- */
export function streamInvoicePdf(
  res: Response,
  invoice: any,
  filename = "invoice.pdf"
) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  doc.pipe(res);

  const items = invoice.items || [];
  let itemIndex = 0;
  let isFirstPage = true;

  const PAGE_BOTTOM = H - 70; // 🔥 SAFE bottom limit

  while (itemIndex < items.length || isFirstPage) {
    if (!isFirstPage) {
      doc.addPage({ size: "A4", margin: 0 });
    }

    /* ---------- HEADER ALWAYS ---------- */
    drawHeader(doc, invoice, isFirstPage);

    let currentY: number;

    /* ---------- INVOICE INFO ONLY FIRST PAGE ---------- */
    if (isFirstPage) {
      currentY = drawInvoiceInfo(doc, invoice);
    } else {
      currentY = 100;
    }

    /* ---------- ITEMS HEADER ---------- */
    const { columns, headerHeight } = drawItemsTableHeader(doc, currentY);
    currentY += headerHeight;

    /* ---------- ITEMS LOOP ---------- */
    while (itemIndex < items.length) {
      const item = items[itemIndex];
      const rowHeight = getItemRowHeight(doc, item, columns);

      // ❌ page overflow → next page
      if (currentY + rowHeight > PAGE_BOTTOM) break;

      drawItemRow(doc, item, itemIndex, currentY, columns);
      currentY += rowHeight;
      itemIndex++;
    }

    /* ---------- TOTALS + FOOTER ONLY LAST PAGE ---------- */
    if (itemIndex >= items.length) {
      // 🔥 space check before totals
      if (currentY + 220 > PAGE_BOTTOM) {
        doc.addPage({ size: "A4", margin: 0 });
        drawHeader(doc, invoice, false);
        currentY = 100;
      }

      currentY = drawTotals(doc, invoice, currentY);
      drawFooter(doc, invoice, currentY);
    }

    isFirstPage = false;
  }

  doc.end();
}

