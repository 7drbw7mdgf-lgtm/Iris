import { DashboardExportRect } from "./types";

export function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return dataUrl;
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) return payload;
  const bytes = new TextEncoder().encode(decodeURIComponent(payload));
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function binaryStringToBase64(bin: string): string {
  return btoa(bin);
}

export function escapePdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function makeDashboardPdfBase64(jpegDataUrl: string, widthPx: number, heightPx: number): string {
  const jpeg = atob(dataUrlToBase64(jpegDataUrl));
  const pageW = widthPx * 0.75;
  const pageH = heightPx * 0.75;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n${jpeg}\nendstream`,
    `<< /Length ${`q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ`.length} >>\nstream\nq\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\nendstream`,
    `<< /Title (${escapePdfString("Iris dashboard export")}) /Creator (${escapePdfString("Iris")}) >>`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return binaryStringToBase64(pdf);
}

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function safeFileName(name: string, fallback: string): string {
  const clean = name.trim().replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "");
  return clean || fallback;
}

export function downloadTextFile(fileName: string, contents: string, mime = "application/octet-stream") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function imageDataUrlSize(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function captureDashboardArea(
  canvasEl: HTMLElement | null,
  rect: DashboardExportRect
): Promise<{ pngDataUrl: string; jpegDataUrl: string; width: number; height: number }> {
  if (!canvasEl) throw new Error("Dashboard canvas is not available.");
  const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  const clone = canvasEl.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(".dashboard-floating-head, .dashboard-resize-cue, .render-overlay")
    .forEach((el) => el.remove());
  clone.style.width = `${Math.max(canvasEl.scrollWidth, canvasEl.clientWidth)}px`;
  clone.style.height = `${Math.max(canvasEl.scrollHeight, canvasEl.clientHeight)}px`;
  clone.style.overflow = "visible";
  clone.style.position = "relative";
  clone.style.transform = `translate(${-rect.x}px, ${-rect.y}px)`;
  clone.style.transformOrigin = "0 0";

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.width = `${rect.w}px`;
  wrapper.style.height = `${rect.h}px`;
  wrapper.style.overflow = "hidden";
  wrapper.style.background = "#fff";
  const styleEl = document.createElement("style");
  styleEl.textContent = `${styles}
    .dashboard-floating-card { transform: none !important; }
    .dashboard-floating-head, .dashboard-resize-cue { display: none !important; }
    * { -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
  `;
  wrapper.appendChild(styleEl);
  wrapper.appendChild(clone);

  const serialized = new XMLSerializer().serializeToString(wrapper);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.w}" height="${rect.h}" viewBox="0 0 ${rect.w} ${rect.h}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render dashboard selection."));
    image.src = url;
  });
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(rect.w * scale));
  out.height = Math.max(1, Math.round(rect.h * scale));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas export is unavailable.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  return {
    pngDataUrl: out.toDataURL("image/png"),
    jpegDataUrl: out.toDataURL("image/jpeg", 0.95),
    width: out.width,
    height: out.height,
  };
}

