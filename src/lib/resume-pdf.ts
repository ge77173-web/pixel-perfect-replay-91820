// Generates a clean, ATS-friendly single-column PDF (real selectable text).
export async function downloadResumePdf(text: string, filename = "curriculo-otimizado.pdf") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const maxW = W - M * 2;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const isHeading = (l: string) =>
    l.length > 2 && l.length < 60 && l === l.toUpperCase() && /\p{L}/u.test(l) && !l.startsWith("- ");

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  let first = true;

  for (const line of lines) {
    if (!line) {
      y += 6;
      continue;
    }
    if (isHeading(line)) {
      y += first ? 0 : 10;
      ensure(30);
      doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(20);
      doc.text(line, M, y);
      y += 6;
      doc.setDrawColor(170).setLineWidth(0.6).line(M, y, W - M, y);
      y += 15;
    } else if (line.startsWith("- ")) {
      doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(40);
      const wrapped = doc.splitTextToSize(line.slice(2), maxW - 14) as string[];
      for (let i = 0; i < wrapped.length; i++) {
        ensure(15);
        if (i === 0) doc.text("•", M + 2, y);
        doc.text(wrapped[i] ?? "", M + 14, y);
        y += 14.5;
      }
    } else if (first) {
      doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(10);
      doc.text(doc.splitTextToSize(line, maxW) as string[], M, y);
      y += 24;
    } else {
      doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(40);
      for (const w of doc.splitTextToSize(line, maxW) as string[]) {
        ensure(15);
        doc.text(w, M, y);
        y += 14.5;
      }
    }
    first = false;
  }

  doc.save(filename);
}
