import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import regularUrl from "../assets/fonts/NotoSans_400Regular.ttf?url";
import boldUrl from "../assets/fonts/NotoSans_700Bold.ttf?url";
import { APP_TITLE, APP_TITLE_ML, CREDIT } from "./constants.js";
import { formatNumber, sumAmounts } from "./format.js";

// jsPDF cannot shape Malayalam (conjuncts / chillus come out broken), so any
// Malayalam text is drawn by the browser onto a canvas - which shapes it
// correctly with Noto Sans Malayalam - and placed in the PDF as a sharp image.
// Everything else (including the ₹ sign) uses an embedded Noto Sans TTF.

const MALAYALAM_RE = /[ഀ-ൿ]/;
const PX_PER_MM = 12; // ~300 dpi
const GREEN = [22, 101, 52];
const MARGIN = 15;

let fontsPromise;
function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([toBase64(regularUrl), toBase64(boldUrl)]).catch((err) => {
      fontsPromise = undefined; // allow a retry
      throw err;
    });
  }
  return fontsPromise;
}

async function toBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the PDF font");
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function wrapLines(ctx, text, maxPx) {
  const lines = [];
  let line = "";
  const push = () => {
    if (line) lines.push(line);
    line = "";
  };
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxPx) {
      line = trial;
      continue;
    }
    push();
    if (ctx.measureText(word).width <= maxPx) {
      line = word;
    } else {
      // A single very long word: break it by characters.
      for (const ch of Array.from(word)) {
        if (ctx.measureText(line + ch).width > maxPx) push();
        line += ch;
      }
    }
  }
  push();
  return lines.length ? lines : [""];
}

async function renderTextImage(text, { weight = 400, sizeMm, color = "#0f172a", maxWidthMm }) {
  const px = Math.round(sizeMm * PX_PER_MM);
  const font = `${weight} ${px}px "Noto Sans Malayalam"`;
  await document.fonts.load(font, text);
  if (!document.fonts.check(font, text)) {
    throw new Error("The Malayalam font could not be loaded, so the PDF was not created.");
  }

  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const lines = wrapLines(measure, text, maxWidthMm ? maxWidthMm * PX_PER_MM : Infinity);
  const widest = Math.max(...lines.map((l) => measure.measureText(l).width));

  const lineH = Math.round(px * 1.75); // Malayalam needs generous vertical room
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(widest) + 4;
  canvas.height = lineH * lines.length;
  const ctx = canvas.getContext("2d");
  ctx.font = font; // resizing a canvas resets its state
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  lines.forEach((l, i) => ctx.fillText(l, 2, lineH * i + lineH / 2));

  return {
    dataUrl: canvas.toDataURL("image/png"),
    wMm: canvas.width / PX_PER_MM,
    hMm: canvas.height / PX_PER_MM,
  };
}

export async function generateReport(participants) {
  const list = Array.isArray(participants) ? participants : [];
  const totalCollected = sumAmounts(list.map((p) => p.amount_paid));
  const rupees = (n) => `₹${formatNumber(n)}`;

  const [[regularB64, boldB64], titleImg] = await Promise.all([
    loadFonts(),
    renderTextImage(APP_TITLE_ML, { weight: 600, sizeMm: 6.2, color: "#14532d" }),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", regularB64);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", boldB64);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;

  // ---- Header ----
  doc.setFont("NotoSans", "bold").setFontSize(18).setTextColor(...GREEN);
  doc.text(APP_TITLE, pageW / 2, 20, { align: "center" });
  doc.addImage(titleImg.dataUrl, "PNG", (pageW - titleImg.wMm) / 2, 23, titleImg.wMm, titleImg.hMm);

  const dateText = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("NotoSans", "normal").setFontSize(10).setTextColor(100, 116, 139);
  doc.text(`Report generated: ${dateText}`, pageW / 2, 23 + titleImg.hMm + 5, { align: "center" });
  const tableStartY = 23 + titleImg.hMm + 11;

  // ---- Participant table ----
  const NO_W = 16;
  const AMT_W = 44;
  const NAME_W = contentW - NO_W - AMT_W;
  const CELL_PAD = 3;

  // Names containing Malayalam are drawn as images (see note at top).
  const nameImages = new Map();
  await Promise.all(
    list.map(async (p, i) => {
      if (MALAYALAM_RE.test(p.name)) {
        nameImages.set(
          i,
          await renderTextImage(p.name, { sizeMm: 3.6, maxWidthMm: NAME_W - CELL_PAD * 2 })
        );
      }
    })
  );

  const body = list.length
    ? list.map((p, i) => [
        String(i + 1),
        nameImages.has(i) ? "" : p.name,
        formatNumber(p.amount_paid),
      ])
    : [[{ content: "No participants added yet.", colSpan: 3, styles: { halign: "center", textColor: [100, 116, 139] } }]];

  autoTable(doc, {
    startY: tableStartY,
    head: [["No.", "Participant Name", "Amount Paid (₹)"]],
    body,
    margin: { top: 20, bottom: 26, left: MARGIN, right: MARGIN },
    theme: "grid",
    rowPageBreak: "avoid",
    showHead: "everyPage",
    styles: {
      font: "NotoSans",
      fontSize: 10,
      cellPadding: CELL_PAD,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
      valign: "middle",
      overflow: "linebreak",
    },
    headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 250, 247] },
    columnStyles: {
      0: { cellWidth: NO_W, halign: "center" },
      1: { cellWidth: NAME_W },
      2: { cellWidth: AMT_W, halign: "right" },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 1 && nameImages.has(data.row.index)) {
        data.cell.styles.minCellHeight = nameImages.get(data.row.index).hMm + CELL_PAD * 2;
      }
    },
    didDrawCell(data) {
      if (data.section === "body" && data.column.index === 1 && nameImages.has(data.row.index)) {
        const img = nameImages.get(data.row.index);
        doc.addImage(
          img.dataUrl,
          "PNG",
          data.cell.x + CELL_PAD,
          data.cell.y + (data.cell.height - img.hMm) / 2,
          img.wMm,
          img.hMm
        );
      }
    },
  });

  // ---- Summary ----
  const SUMMARY_W = 100;
  const SUMMARY_H = 24;
  let summaryY = (doc.lastAutoTable?.finalY ?? tableStartY) + 8;
  if (summaryY + SUMMARY_H > pageH - 26) {
    doc.addPage();
    summaryY = 20;
  }
  autoTable(doc, {
    startY: summaryY,
    body: [
      ["Total Participants", String(list.length)],
      ["Total Amount Collected", rupees(totalCollected)],
    ],
    margin: { left: pageW - MARGIN - SUMMARY_W, right: MARGIN, bottom: 26 },
    tableWidth: SUMMARY_W,
    theme: "grid",
    rowPageBreak: "avoid",
    styles: {
      font: "NotoSans",
      fontSize: 11,
      cellPadding: 3.5,
      lineColor: [187, 215, 196],
      lineWidth: 0.2,
      fillColor: [236, 247, 239],
      textColor: [20, 83, 45],
      fontStyle: "bold",
    },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40, halign: "right" } },
  });

  // ---- Footer + page numbers on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225).setLineWidth(0.2);
    doc.line(MARGIN, pageH - 17, pageW - MARGIN, pageH - 17);
    doc.setFont("NotoSans", "normal").setFontSize(9).setTextColor(100, 116, 139);
    doc.text(CREDIT, pageW / 2, pageH - 10, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, pageW - MARGIN, pageH - 10, { align: "right" });
  }

  const fileDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  doc.save(`Noorul-Islam-Masjid-Tour-Report-${fileDate}.pdf`);

  return { count: list.length, total: totalCollected };
}
