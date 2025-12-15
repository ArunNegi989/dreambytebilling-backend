// src/utils/pdfGenerator.ts
import PDFDocument from "pdfkit";
import { Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Streams an invoice PDF closely matching the uploaded invoice layout.
 *
 * Supports:
 * - invoice.header.logoBuffer (Buffer) OR invoice.header.logoPath (local filesystem path string)
 * - invoice.qrBuffer (Buffer) for QR image (optional)
 * - invoice.items: array of { location, sacHsn, specification, qty, startDate, endDate, rate, amount }
 * - invoice.totals: { subtotal, igst, cgst, sgst, grandTotal }
 * - invoice.bank: { bankName, accountNo, ifsc, branch }
 *
 * Usage: streamInvoicePdf(res, invoice, `invoice-${invoice.invoiceNo}.pdf`)
 */
const formatINR = (n?: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function numberToWordsIndian(n: number) {
  if (!n) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function two(num: number) {
    if (num < 20) return a[num];
    const tens = Math.floor(num / 10),
      ones = num % 10;
    return b[tens] + (ones ? " " + a[ones] : "");
  }
  function three(num: number) {
    const h = Math.floor(num / 100),
      rem = num % 100;
    return (h ? a[h] + " Hundred" + (rem ? " " : "") : "") + (rem ? two(rem) : "");
  }

  const crore = Math.floor(n / 10000000);
  n = n % 10000000;
  const lakh = Math.floor(n / 100000);
  n = n % 100000;
  const thousand = Math.floor(n / 1000);
  n = n % 1000;
  const hund = n;
  const parts: string[] = [];
  if (crore) parts.push(three(crore) + " Crore");
  if (lakh) parts.push(three(lakh) + " Lakh");
  if (thousand) parts.push(three(thousand) + " Thousand");
  if (hund) parts.push(three(hund));
  return parts.join(" ");
}

/**
 * Helper to resolve a local path or Buffer into something pdfkit.image can accept.
 * If `logoPath` is provided and is relative, resolve from process.cwd()
 */
function resolveLocalImageMaybe(logoPath?: string) {
  if (!logoPath) return undefined;
  if (fs.existsSync(logoPath)) return logoPath;
  const p = path.join(process.cwd(), logoPath);
  if (fs.existsSync(p)) return p;
  return undefined;
}

export function streamInvoicePdf(res: Response, invoice: any, filename = "invoice.pdf") {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 36 });
  doc.pipe(res);

  // Fonts (default built-ins)
  const base = "Helvetica";
  const bold = "Helvetica-Bold";
  doc.font(base);

  const left = 36;
  const right = 595 - 36; // A4 usable right edge
  const contentWidth = right - left;
  let y = 36;

  // ---------------- Header: top-left metadata ----------------
  doc.font(bold).fontSize(8);
  const panY = y;
  doc.text(`PAN NO. : ${invoice.header?.panNo || ""}`, left, panY);
  const gstY = panY + 11;
  doc.text(`GSTIN : ${invoice.header?.supplierGstin || invoice.gstin || ""}`, left, gstY);
  const catY = panY + 22;
  const categoryText = `${invoice.header?.category || ""}`;
  doc.text(`CATEGORY : ${categoryText}`, left, catY);

  // measure category text height so logo can be placed immediately below it
  const catTextHeight = doc.heightOfString(`CATEGORY : ${categoryText}`, { width: contentWidth / 2 });
  const logoTopGap = 0; // gap between category text and logo

  // ---------------- Top-right contact block & QR (keep aligned to top band)
  const rightBlockX = 400;
  doc.font(base).fontSize(9);
  const office = invoice.header?.office || invoice.office || {};
  const rightY = panY;
  if (office.telephone) doc.text(`TEL. : ${office.telephone}`, rightBlockX, rightY, { align: "left" });
  if (office.mobile) doc.text(`${office.mobile ? office.mobile : ""}`, rightBlockX, rightY + 10, { align: "left" });
  if (office.officeEmail) doc.text(`E-mail : ${office.officeEmail}`, rightBlockX, rightY + 20);
  if (office.cin) doc.text(`CIN : ${office.cin}`, rightBlockX, rightY + 32);
  if (office.msme) doc.text(`MSME : ${office.msme}`, rightBlockX, rightY + 44);
  if (office.officeAddress) {
    doc.fontSize(8).text(office.officeAddress, rightBlockX, rightY + 56, { width: 160 });
  }
  doc.fontSize(9);

  // QR on top-right (if provided)
  if (invoice.qrBuffer) {
    try {
      doc.image(invoice.qrBuffer, right - 100, panY + 6, { fit: [84, 84] });
    } catch {
      // ignore if QR fails
    }
  }

  // ---------------- Logo: place DIRECTLY UNDER the CATEGORY text (left-aligned)
  // Increased width and height as requested
  const logoW = 420; // increased width
  const logoH = 84;  // increased height
  const logoX = left; // left-aligned under CATEGORY
  const logoY = catY + catTextHeight + logoTopGap;

  const logoBuffer = invoice.header?.logoBuffer as Buffer | undefined;
  const logoPathRaw = invoice.header?.logoPath as string | undefined;
  const logoPathResolved = resolveLocalImageMaybe(logoPathRaw);

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, logoX, logoY, { fit: [logoW, logoH] });
    } catch {
      doc.font(bold).fontSize(14).text(invoice.header?.companyName || "Dream Byte Solution.", logoX, logoY + 6, {
        width: logoW,
        align: "left",
      });
    }
  } else if (logoPathResolved) {
    try {
      doc.image(logoPathResolved, logoX, logoY, { fit: [logoW, logoH] });
    } catch {
      doc.font(bold).fontSize(14).text(invoice.header?.companyName || "Media 24x7 Advertising Pvt. Ltd.", logoX, logoY + 6, {
        width: logoW,
        align: "left",
      });
    }
  } else {
    // if no image, print company name where logo would appear (left-aligned)
    doc.font(bold).fontSize(14).text(invoice.header?.companyName || "Media 24x7 Advertising Pvt. Ltd.", logoX, logoY + 6, {
      width: logoW,
      align: "left",
    });
  }

  // Advance y to below the logo area for subsequent content
  y = logoY + logoH + 12;

  // thin separator
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor("#000000").stroke();
  y += 8;

  // ---------------- Top meta row (GSTIN label and TAX INVOICE) ----------------
  doc.font(bold).fontSize(10);
  const gstRowH = 18;
  doc.rect(left, y, right - left, gstRowH).strokeColor("#666").lineWidth(0.6).stroke();
  doc.font(bold).fontSize(9).text(`GSTIN : ${invoice.gstin || invoice.header?.supplierGstin || ""}`, left + 6, y + 4);
  doc.font(bold).fontSize(12).text("TAX INVOICE", left + 120, y + 2, { align: "center", width: 340 });
  y += gstRowH + 8;

  // ---------------- Invoice meta details ----------------
  doc.font(base).fontSize(9);
  doc.text(`Invoice No : ${invoice.invoiceNo || "-"}`, left, y);
  doc.text(`Reverse Charge : ${invoice.reverseCharge ?? "No"}`, left + 300, y);
  y += 14;
  doc.text(`Dated of Invoice : ${invoice.dateOfInvoice || "-"}`, left, y);
  doc.text(`Client Order No : ${invoice.clientOrderNo || "-"}`, left + 300, y);
  y += 14;
  doc.text(`Place of Supply : ${invoice.placeOfSupply || "-"}`, left, y);
  doc.text(`Order Date : ${invoice.orderDate || "-"}`, left + 300, y);
  y += 18;

  // ---------------- Billed to / Campaign ----------------
  const leftColW = 340;
  doc.font(bold).fontSize(9).text("Billed to:", left, y);
  doc.font(bold).fontSize(9).text("Campaign:", left + leftColW + 8, y);
  y += 14;
  doc.font(base).fontSize(9).text(invoice.billedTo?.name || "-", left, y, { width: leftColW });
  doc.font(base).fontSize(9).text(invoice.campaign?.name || "-", left + leftColW + 8, y);
  y += doc.heightOfString(invoice.billedTo?.name || "-", { width: leftColW }) + 6;
  doc.fontSize(8).text(invoice.billedTo?.address || "-", left, y, { width: leftColW });
  doc.fontSize(8).text(invoice.campaign?.start && invoice.campaign?.end ? `${invoice.campaign.start} to ${invoice.campaign.end}` : "-", left + leftColW + 8, y);
  y += Math.max(doc.heightOfString(invoice.billedTo?.address || "-", { width: leftColW }), 12) + 10;

  // ---------------- Items table header ----------------
  const tableX = left;
  const cols = {
    sn: tableX,
    location: tableX + 36,
    sac: tableX + 270,
    spec: tableX + 335,
    qty: tableX + 420,
    period: tableX + 452,
    rate: tableX + 498,
    amount: tableX + 536,
  };

  doc.font(bold).fontSize(9);
  doc.text("S.N.", cols.sn, y);
  doc.text("Location", cols.location, y);
  doc.text("SAC/HSN", cols.sac, y);
  doc.text("Specification", cols.spec, y);
  doc.text("Qty.", cols.qty, y);
  doc.text("Period", cols.period, y);
  doc.text("Rate (PM/SQFT)", cols.rate, y);
  doc.text("Amount", cols.amount, y, { align: "right" });
  y += 12;
  doc.moveTo(tableX, y).lineTo(right, y).strokeColor("#000000").lineWidth(0.6).stroke();
  y += 8;

  // ---------------- Items rows ----------------
  doc.font(base).fontSize(9);
  const items: any[] = Array.isArray(invoice.items) ? invoice.items : [];
  const rowHeight = 18;
  const bottomLimit = 720;

  items.forEach((it, i) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = 40;
    }
    doc.text(String(i + 1), cols.sn, y);
    doc.text(it.location || "-", cols.location, y, { width: 220 });
    doc.text(it.sacHsn || "-", cols.sac, y);
    doc.text(it.specification || "-", cols.spec, y, { width: 80 });
    doc.text(String(it.qty ?? "-"), cols.qty, y);
    const period = (it.startDate ? it.startDate : "") + (it.endDate ? ` - ${it.endDate}` : "");
    doc.text(period || "-", cols.period, y, { width: 40 });
    doc.text(Number(it.rate ?? 0).toFixed(2), cols.rate, y, { width: 36, align: "right" });
    doc.text(Number(it.amount ?? 0).toFixed(2), cols.amount, y, { width: 44, align: "right" });
    y += rowHeight;
  });

  const afterTableY = y + 8;
  doc.moveTo(tableX, afterTableY).lineTo(right, afterTableY).strokeColor("#ddd").lineWidth(0.5).stroke();

  // ---------------- Totals box (shaded) on right ----------------
  const totalsW = 220;
  const totalsX = right - totalsW;
  const totalsY = afterTableY + 6;
  const totalsH = 120;

  doc.save();
  doc.roundedRect(totalsX - 6, totalsY - 6, totalsW + 12, totalsH + 8, 4).fillOpacity(0.06).fill("#000000").restore();

  const subtotal = invoice.totals?.subtotal ?? items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const igst = invoice.totals?.igst ?? 0;
  const cgst = invoice.totals?.cgst ?? +(subtotal * 0.09).toFixed(2);
  const sgst = invoice.totals?.sgst ?? +(subtotal * 0.09).toFixed(2);
  const grand = invoice.totals?.grandTotal ?? +(subtotal + igst + cgst + sgst).toFixed(2);

  doc.font(base).fontSize(9);
  let ty = totalsY;
  doc.text("Total Taxable Value", totalsX - 4, ty);
  doc.text(formatINR(subtotal), totalsX + 140, ty, { width: 76, align: "right" });
  ty += 16;
  doc.text("IGST @18%", totalsX - 4, ty);
  doc.text(formatINR(igst), totalsX + 140, ty, { width: 76, align: "right" });
  ty += 16;
  doc.text("CGST @9%", totalsX - 4, ty);
  doc.text(formatINR(cgst), totalsX + 140, ty, { width: 76, align: "right" });
  ty += 16;
  doc.text("SGST @9%", totalsX - 4, ty);
  doc.text(formatINR(sgst), totalsX + 140, ty, { width: 76, align: "right" });
  ty += 18;
  doc.moveTo(totalsX - 4, ty).lineTo(totalsX + totalsW + 4, ty).strokeColor("#000").lineWidth(0.6).stroke();
  ty += 6;
  doc.font(bold).fontSize(10).text("Grand Total", totalsX - 4, ty);
  doc.text(formatINR(grand), totalsX + 140, ty, { width: 76, align: "right" });

  // ---------------- Amount in words & Bank row ----------------
  const wordsY = totalsY + totalsH + 18;
  doc.font(base).fontSize(9).text("Rupees " + (invoice.amountInWords || (numberToWordsIndian(Math.floor(grand)) + " Only")), left, wordsY);

  const bank = invoice.bank || {};
  const bankRowY = wordsY + 26;
  doc.moveTo(left, bankRowY - 6).lineTo(right, bankRowY - 6).strokeColor("#000").lineWidth(0.5).stroke();
  doc.font(bold).fontSize(9).text("Our Bank Name:", left, bankRowY);
  doc.font(base).fontSize(9).text(
    `${bank.bankName || "ICICI Ltd"}   A/C No.${bank.accountNo || "025051000008"}   IFSC:${bank.ifsc || "ICIC0000250"}   Branch:${bank.branch || "Sector-5 Dwarka New Delhi-110075"}`,
    left + 110,
    bankRowY,
    { width: right - left - 120 }
  );

  // ---------------- Terms & Signature ----------------
  const termsY = bankRowY + 20;
  doc.font(bold).fontSize(9).text("Terms & Conditions", left, termsY);
  doc.font(base).fontSize(8).text(
    invoice.terms ||
      `1. All payments to be made by Payee A/c Cheque/Draft in favour of ${invoice.header?.companyName || "Media 24x7 Advertising Pvt. Ltd."}\n2. No dispute shall be valid unless brought to our notice within 7 days of submission of the bill.\n3. Interest @18% p.a. will be charged if the payment is not made within the stipulated time.\n4. All disputes are subject to Delhi Jurisdiction only.`,
    left,
    termsY + 12,
    { width: 360 }
  );

  const sigBoxX = totalsX;
  const sigBoxY = termsY;
  doc.rect(sigBoxX, sigBoxY, totalsW, 72).strokeColor("#000").lineWidth(0.6).stroke();
  doc.font(bold).fontSize(9).text(`For ${invoice.header?.companyName || "MEDIA 24x7 ADVERTISING PVT. LTD."}`, sigBoxX + 8, sigBoxY + 8);
  doc.moveTo(sigBoxX + 40, sigBoxY + 46).lineTo(sigBoxX + totalsW - 40, sigBoxY + 46).stroke();
  doc.font(base).fontSize(8).text("Authorised Signatory", sigBoxX + 50, sigBoxY + 50);

  // bottom footer line & footer address center
  doc.moveTo(left, 785).lineTo(right, 785).strokeColor("#000").lineWidth(0.8).stroke();
  doc.font(base).fontSize(8).text(invoice.footerAddress || office.officeAddress || "", left, 788, { width: right - left, align: "center" });

  doc.end();
}
