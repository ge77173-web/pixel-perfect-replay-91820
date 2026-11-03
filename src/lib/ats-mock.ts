export type AnalysisResult = {
  score: number;
  found: string[];
  missing: string[];
  optimizedResume: string;
};

const STOPWORDS = new Set(
  "a o e de da do das dos em para com por um uma os as no na nos nas que se ao à é ser como mais ou seu sua the and of to in for with on at by an be is are you we our your will this that from experiência vaga empresa trabalho área".split(
    " ",
  ),
);

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function extractKeywords(text: string, limit = 16): string[] {
  const counts = new Map<string, { word: string; n: number }>();
  for (const raw of text.split(/[^\p{L}\p{N}+#.]+/u)) {
    const word = raw.replace(/^\.+|\.+$/g, "");
    const key = normalize(word);
    if (key.length < 3 || STOPWORDS.has(key) || /^\d+$/.test(key)) continue;
    const cur = counts.get(key);
    if (cur) cur.n++;
    else counts.set(key, { word, n: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n || b.word.length - a.word.length)
    .slice(0, limit)
    .map((c) => c.word);
}

/** Mock analysis. Never adds skills absent from the resume — only reorganizes. */
export function analyzeMock(job: string, resume: string): AnalysisResult {
  const keywords = extractKeywords(job);
  const resumeNorm = normalize(resume);
  const found = keywords.filter((k) => resumeNorm.includes(normalize(k)));
  const missing = keywords.filter((k) => !resumeNorm.includes(normalize(k)));
  const score = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;

  const lines = resume
    .split(/\r?\n/)
    .map((l) => l.replace(/\t+/g, " ").replace(/\s{2,}/g, " ").replace(/^[•●▪*-]\s*/, "- ").trim())
    .filter((l, i, arr) => l !== "" || (arr[i - 1] ?? "") !== "");

  const summary = found.length
    ? `RESUMO PROFISSIONAL\nProfissional com experiência comprovada em ${found.slice(0, 5).join(", ")}.\n\n`
    : "";
  const skills = found.length ? `\n\nCOMPETÊNCIAS PRINCIPAIS\n${found.map((f) => `- ${f}`).join("\n")}` : "";

  return { score, found, missing, optimizedResume: `${summary}${lines.join("\n")}${skills}`.trim() };
}
