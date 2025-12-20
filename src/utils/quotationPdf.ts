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
};

/* ---------------- CONSTANTS ---------------- */
const COMPANY_NAME = "DREAMBYTE SOLUTION (OPC) PVT. LTD.";
const W = 595;
const H = 842;
const LEFT = 36;
const RIGHT = W - 36;
const PAGE_BOTTOM = H - 70;

/* ---------------- HELPERS ---------------- */
const formatINR = (n = 0) =>
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

/* -------- NUMBER TO WORDS -------- */
function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }
  
  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertLessThanThousand(thousands) + " Thousand" + (remainder !== 0 ? " " + convertLessThanThousand(remainder) : "");
  }
  if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertLessThanThousand(lakhs) + " Lakh" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  
  const crores = Math.floor(num / 10000000);
  const remainder = num % 10000000;
  return convertLessThanThousand(crores) + " Crore" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
}

function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let words = "Rupees " + numberToWords(rupees);
  
  if (paise > 0) {
    words += " and " + numberToWords(paise) + " Paise";
  }
  
  words += " Only";
  return words;
}

/* -------- PAGE BREAK -------- */
function checkPageBreak(
  doc: PDFKit.PDFDocument,
  y: number,
  quotation: any,
  space = 40
) {
  if (y + space > PAGE_BOTTOM) {
    doc.addPage();
    drawHeader(doc, quotation, false);
    return 100;
  }
  return y;
}

/* -------- ADDRESS FORMAT -------- */
function formatAddress(address: string) {
  if (!address) return "-";
  return address
    .split(",")
    .map(p => p.trim())
    .join(",\n");
}

/* ================= HEADER ================= */
function drawHeader(
  doc: PDFKit.PDFDocument,
  quotation: any,
  isFirstPage = true
) {
  /* Background */
  doc.rect(0, 0, W, H).fill(COLORS.bg);

  /* Top Right */
  doc.fillColor(COLORS.gold).polygon([420, 0], [595, 0], [595, 110]).fill();
  doc.fillColor(COLORS.darkGold).polygon([500, 0], [595, 0], [595, 65]).fill();
  doc.fillColor("#333").polygon([470, 0], [595, 0], [595, 35]).fill();

  /* Bottom Left */
  doc.fillColor(COLORS.gold).polygon([0, H - 110], [0, H], [175, H]).fill();
  doc.fillColor(COLORS.darkGold).polygon([0, H - 65], [0, H], [120, H]).fill();
  doc.fillColor("#333").polygon([0, H - 35], [0, H], [90, H]).fill();

  /* Company Name */
  doc
    .fillColor(COLORS.darkGold)
    .font("Helvetica-Bold")
    .fontSize(isFirstPage ? 18 : 15)
    .text(COMPANY_NAME, LEFT, 38);

  doc.moveTo(LEFT, 66).lineTo(LEFT + 360, 66).stroke(COLORS.gold);

  /* ---------- LEFT HEADER DETAILS ---------- */
  if (isFirstPage) {
    const startY = 125;
    const details = [
      `PAN No : ${quotation.header?.panNo || "AAKCD5928M"}`,
      `GSTIN : ${quotation.header?.supplierGstin || "05AAKCD5928M1Z7"}`,
      `Category : ${quotation.header?.category || "MARKETING AGENCY"}`,
      `CIN No : ${quotation.header?.cinNo || "UC3122UT20240PC01C799"}`,
      `MSME No : ${quotation.header?.msmeNo || "UDYAM-UK-05-0057194"}`,
      `Email : ${quotation.header?.email || "info@dreambytesolution.com"}`,
    ];

    doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

    details.forEach((t, i) => {
      doc.text(t, LEFT, startY + i * 14, { width: 260 });
    });

    doc
      .moveTo(LEFT, startY + details.length * 14 + 4)
      .lineTo(LEFT + 160, startY + details.length * 14 + 4)
      .stroke(COLORS.gold);
  }

  /* ---------- RIGHT LOGO + CONTACT ---------- */
  if (!isFirstPage) return;

  const logoX = RIGHT - 180;
  const logoW = 180;

  const logoPath = path.join(process.cwd(), "public/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, logoX, 10, { width: logoW });
  }

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  const phoneY = 135;
  doc.text("Phone: 9846514986", logoX, phoneY, {
    width: logoW,
    align: "center",
  });
  doc.text("7984651845", logoX, phoneY + 15, {
    width: logoW,
    align: "center",
  });

  const addressText =
    "Dream Byte Solutions Pvt. Ltd 3rd Floor,above Bank of India, Sahastradhara Road,Near IT Park, Dehradun, Uttarakhand";

  const addressY = phoneY + 35;
  doc.text(addressText, logoX, addressY, {
    width: logoW,
    align: "center",
  });

  const addrHeight = doc.heightOfString(addressText, { width: logoW });
  const lineY = addressY + addrHeight + 6;

  doc
    .lineWidth(1)
    .moveTo(logoX, lineY)
    .lineTo(logoX + logoW, lineY)
    .stroke(COLORS.gold)
    .lineWidth(1);
}

/* ================= QUOTATION INFO ================= */
function drawQuotationInfo(doc: PDFKit.PDFDocument, q: any) {
  let y = 245;

  const boxX = LEFT;
  const boxY = 235;
  const boxWidth = RIGHT - LEFT;
  const contentWidth = boxWidth - 20;

  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("QUOTATION", boxX, y, { width: boxWidth, align: "center" });

  y += 22;
  doc.moveTo(boxX, y).lineTo(RIGHT, y).stroke();

  y += 15;
  doc.font("Helvetica").fontSize(9);

  // Quotation No (LEFT)
  doc.text(`Quotation No : ${q.quotationNo || "-"}`, boxX + 10, y);

  // Date (RIGHT)
  doc.text(`Date : ${formatDate(q.quotationDate)}`, boxX + boxWidth - 180, y);

  // ✅ Client Mobile (RIGHT, below Date)
  doc.text(
    `Client Mobile : ${q.contactNumber || "-"}`,
    boxX + boxWidth - 180,
    y + 14
  );

  y += 15;

  // Client Name
  doc.text(`Client Name : ${q.clientName || "-"}`, boxX + 10, y, {
    width: contentWidth,
  });

  y += 16;

  /* ---------- ADDRESS ---------- */
  const addressLabel = "Address :";
  const formattedAddress = formatAddress(q.billToAddress || "-");

  doc.text(addressLabel, boxX + 10, y);

  const labelWidth = doc.widthOfString(addressLabel) + 6;
  const valueX = boxX + 10 + labelWidth;
  const usableWidth = contentWidth - labelWidth;

  const addressHeight = doc.heightOfString(formattedAddress, {
    width: usableWidth,
  });

  if (y + addressHeight > PAGE_BOTTOM) {
    doc.addPage();
    drawHeader(doc, q, false);
    y = 100;
    doc.text(addressLabel, boxX + 10, y);
  }

  doc.text(formattedAddress, valueX, y, {
    width: usableWidth,
    lineGap: 2,
  });

  y += addressHeight + 12;

  doc.rect(boxX, boxY, boxWidth, y - boxY).stroke(COLORS.gold);

  return y + 30;
}


/* ================= ITEMS TABLE ================= */
function drawItemsHeader(doc: PDFKit.PDFDocument, y: number) {
  const cols = [
    { t: "Sno.", w: 40 },
    { t: "Service", w: 282 },
    { t: "Rate", w: 100 },
    { t: "Amount", w: 100 },
  ];

  let x = LEFT;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text);

  cols.forEach(c => {
    doc.rect(x, y, c.w, 22).stroke();
    doc.text(c.t, x + 4, y + 6, {
      width: c.w - 8,
      align: "center",
    });
    x += c.w;
  });
}

function drawItemRow(doc: PDFKit.PDFDocument, it: any, i: number, y: number, quotation: any) {
  const widths = [40, 282, 100, 100];
  const values = [
    String(i + 1),
    it.service || "",
    formatINR(it.rate),
    formatINR(it.amount),
  ];

  // Set font to normal (not bold) before calculating height
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
  
  // Calculate the height needed for the service text
  const serviceTextHeight = doc.heightOfString(values[1], {
    width: widths[1] - 8,
    lineGap: 2
  });
  
  // Minimum row height is 20, but can be more if service text is long
  const rowHeight = Math.max(20, serviceTextHeight + 12);

  // Check if we need a page break
  if (y + rowHeight > PAGE_BOTTOM) {
    doc.addPage();
    drawHeader(doc, quotation, false);
    y = 100;
    drawItemsHeader(doc, y);
    y += 22;
  }

  let x = LEFT;

  // Ensure font is normal (not bold) for all row content
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);

  values.forEach((v, idx) => {
    // Draw the box
    doc.rect(x, y, widths[idx], rowHeight).stroke();
    
    // Draw the text with proper wrapping
    if (idx === 1) {
      // Service column - allow text wrapping (left aligned)
      doc.text(v, x + 4, y + 6, {
        width: widths[idx] - 8,
        lineGap: 2
      });
    } else {
      // Other columns - center both horizontally and vertically
      const textY = y + (rowHeight - 9) / 2;
      doc.text(v, x + 4, textY, {
        width: widths[idx] - 8,
        align: "center"
      });
    }
    
    x += widths[idx];
  });

  return y + rowHeight;
}

/* ================= TOTAL ================= */
function drawTotals(doc: PDFKit.PDFDocument, q: any, y: number) {
  y = checkPageBreak(doc, y, q, 150);

  const totalAmount = q.totals?.totalAmount || 0;
  const amountInWords = amountToWords(totalAmount);

  const boxX = LEFT;
  const boxWidth = RIGHT - LEFT;
  const boxStartY = y;

  // Calculate box height
  const wordsHeight = doc.heightOfString(amountInWords, {
    width: boxWidth - 20,
    lineGap: 2
  });
  const boxHeight = 70 + wordsHeight;

  // Draw outer box
  doc.rect(boxX, boxStartY, boxWidth, boxHeight).stroke(COLORS.gold);

  y += 15;

  // Grand Total line
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text);
  doc.text("Grand Total :", RIGHT - 200, y);
  doc.text(formatINR(totalAmount), RIGHT - 80, y);
  
  y += 20;
  
  // Horizontal line after Grand Total (full width touching box)
  doc.moveTo(boxX, y).lineTo(boxX + boxWidth, y).stroke(COLORS.gold);
  
  y += 15;
  
  // Amount in words
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Amount in Words:", boxX + 10, y);
  
  y += 15;
  
  doc.font("Helvetica").fontSize(9);
  doc.text(amountInWords, boxX + 10, y, {
    width: boxWidth - 20,
    lineGap: 2
  });
  
  return boxStartY + boxHeight + 20;
}

/* ================= NOTE & SIGNATURE BOX ================= */
function drawNoteAndSignature(doc: PDFKit.PDFDocument, y: number, quotation: any) {
  y = checkPageBreak(doc, y, quotation, 150);

  const boxX = LEFT;
  const boxWidth = RIGHT - LEFT;
  const boxHeight = 140;
  const dividerX = boxX + boxWidth / 2;

  // Draw outer box
  doc.rect(boxX, y, boxWidth, boxHeight).stroke(COLORS.gold);

  // Draw vertical divider
  doc.moveTo(dividerX, y).lineTo(dividerX, y + boxHeight).stroke(COLORS.gold);

  // LEFT SIDE - Note (Blank)
  const leftPadding = 10;
  let textY = y + 10;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
  doc.text("Note:", boxX + leftPadding, textY, {
    width: boxWidth / 2 - leftPadding - 10,
  });

  // Note area is left blank for manual writing

  // RIGHT SIDE - Receiver's Signature
  const rightPadding = 10;
textY = y + 10;

doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.text);
doc.text("Receiver's Signature:", dividerX + rightPadding, textY, {
  width: boxWidth / 2 - rightPadding - 10,
  align: "center",
});

textY += 15;

// Horizontal signature line
const lineY = textY + 20;
doc.moveTo(dividerX, lineY)
   .lineTo(boxX + boxWidth, lineY)
   .stroke(COLORS.text);

textY = lineY + 15;

// Company name (BLACK only)
doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
doc.text("DREAMBYTE SOLUTION (OPC) PVT. LTD.", dividerX + rightPadding, textY, {
  width: boxWidth / 2 - rightPadding - 10,
  align: "center",
});

textY += 10;

/* -------- BIG SIGN / STAMP -------- */
const signPath = path.join(process.cwd(), "public/sign.png");

if (fs.existsSync(signPath)) {
  const signWidth = 110; // 🔥 bigger size
  const signX = dividerX + (boxWidth / 2 - signWidth) / 2;

  doc.image(signPath, signX, textY, {
    width: signWidth,
  });

  textY += 50; // spacing after sign
} else {
  textY += 10;
}


doc.font("Helvetica-Bold").fontSize(8);
doc.text("Authorised Signatory", dividerX + rightPadding, textY, {
  width: boxWidth / 2 - rightPadding - 10,
  align: "center",
});

  return y + boxHeight;
}

/* ================= MAIN ================= */
export function streamQuotationPdf(
  res: Response,
  quotation: any,
  filename = "quotation.pdf"
) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  doc.pipe(res);

  drawHeader(doc, quotation, true);

  let y = drawQuotationInfo(doc, quotation);

  drawItemsHeader(doc, y);
  y += 22;

  quotation.items?.forEach((it: any, i: number) => {
    y = drawItemRow(doc, it, i, y, quotation);
  });

  y = drawTotals(doc, quotation, y + 10);

  drawNoteAndSignature(doc, y, quotation);

  doc.end();
}