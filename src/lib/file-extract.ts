// Browser-only text extraction. All heavy libs are loaded lazily.
export const ACCEPTED_FILES = ".pdf,.docx,.txt,.md,.rtf,.png,.jpg,.jpeg,.webp";

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      let line = "";
      const lines: string[] = [];
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        line += item.str ?? "";
        if (item.hasEOL) {
          lines.push(line);
          line = "";
        }
      }
      if (line) lines.push(line);
      pages.push(lines.join("\n"));
    }
    return pages.join("\n\n").trim();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value.trim();
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) {
    const { default: Tesseract } = await import("tesseract.js");
    const { data } = await Tesseract.recognize(file, "por+eng");
    return data.text.trim();
  }

  return (await file.text()).trim();
}
