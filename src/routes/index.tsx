import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, FileDown, Loader2, Paperclip, ShieldCheck, Sparkles } from "lucide-react";
import { downloadResumePdf } from "@/lib/resume-pdf";
import { ACCEPTED_FILES, extractTextFromFile } from "@/lib/file-extract";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { analyzeMock, type AnalysisResult } from "@/lib/ats-mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Analista.me — Otimize seu currículo para ATS" },
      { name: "description", content: "Compare seu currículo com a vaga, veja palavras-chave e gere uma versão otimizada para ATS." },
      { property: "og:title", content: "Analista.me — Otimize seu currículo para ATS" },
      { property: "og:description", content: "Vença a barreira do ATS. Currículos lidos, entrevistas marcadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function AttachButton({ onText }: { onText: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text) throw new Error("vazio");
      onText(text);
      toast.success(`Texto extraído de ${file.name}`);
    } catch {
      toast.error("Não foi possível ler este arquivo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="outline" size="sm" asChild disabled={busy}>
      <label className="cursor-pointer">
        {busy ? <Loader2 className="animate-spin" /> : <Paperclip />}
        {busy ? "Lendo arquivo..." : "Anexar arquivo"}
        <input type="file" accept={ACCEPTED_FILES} className="hidden" disabled={busy}
          onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
    </Button>
  );
}

function Index() {
  const [job, setJob] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = () => {
    if (!job.trim() || !resume.trim()) {
      toast.error("Preencha a vaga e o currículo.");
      return;
    }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(analyzeMock(job, resume));
      setLoading(false);
    }, 1800);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.optimizedResume);
    toast.success("Texto copiado!");
  };

  const exportPdf = async () => {
    if (!result) return;
    await downloadResumePdf(result.optimizedResume);
    toast.success("PDF baixado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-8">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Analista<span className="text-metal">.me</span>
          </h1>
          <p className="text-muted-foreground">Vença a barreira do ATS. Currículos lidos, entrevistas marcadas.</p>
        </header>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-metal" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Compromisso ético:</strong> reorganizamos e destacamos seus pontos
            fortes, mas nunca inventamos habilidades, ferramentas ou experiências que você não possui.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Descrição da vaga</CardTitle>
                <CardDescription>Cole o texto ou anexe PDF, Word, TXT ou foto</CardDescription>
              </div>
              <AttachButton onText={setJob} />
            </CardHeader>
            <CardContent>
              <Textarea value={job} onChange={(e) => setJob(e.target.value)} placeholder="Cole a descrição da vaga aqui..." className="min-h-72" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div className="space-y-1.5">
                <CardTitle>Seu currículo</CardTitle>
                <CardDescription>Cole o texto ou anexe PDF, Word, TXT ou foto</CardDescription>
              </div>
              <AttachButton onText={setResume} />
            </CardHeader>
            <CardContent>
              <Textarea value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Cole o seu currículo atual aqui..." className="min-h-72" />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={analyze} disabled={loading} className="px-8 shadow-metal">
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Analisar e Otimizar Currículo
          </Button>
        </div>

        {loading && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">Processando match e estruturando formato ATS...</p>
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-40 md:col-span-2" />
            </div>
            <Skeleton className="h-80" />
          </div>
        )}

        {result && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Score de Match</CardTitle>
                  <CardDescription>Compatibilidade com a vaga</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-5xl font-bold text-foreground">{result.score}%</div>
                  <Progress value={result.score} />
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Raio-X das Palavras-chave</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Palavras-chave Encontradas ({result.found.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.found.length ? result.found.map((k) => <Badge key={k}>{k}</Badge>) : <span className="text-sm text-muted-foreground">Nenhuma</span>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Palavras-chave Faltando ({result.missing.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missing.length ? result.missing.map((k) => <Badge key={k} variant="outline">{k}</Badge>) : <span className="text-sm text-muted-foreground">Nenhuma</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <CardTitle>Currículo Otimizado</CardTitle>
                  <CardDescription>Formato limpo, pronto para leitura por ATS</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copy}><Copy /> Copiar Texto</Button>
                  <Button variant="outline" onClick={exportPdf}><FileDown /> Exportar para PDF</Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-6 font-sans text-sm leading-relaxed text-foreground">
                  {result.optimizedResume}
                </pre>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
