import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  Loader2,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";

import logoAsset from "@/assets/prompty-mark.png.asset.json";
import { DICTS, LANGUAGES, type LangCode } from "@/lib/i18n";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";
import { generateFinalPrompt, getClarifyingQuestions } from "@/lib/prompty.functions";

export const Route = createFileRoute("/")({
  component: PromptyScreen,
  head: () => ({
    meta: [
      { title: "Prompty — Convierte tu idea en el prompt perfecto" },
      {
        name: "description",
        content:
          "Escribe tu idea, adjunta imágenes o archivos y Prompty genera el prompt ideal para GPT-5, Claude, Gemini, Grok y más.",
      },
      { property: "og:title", content: "Prompty — El prompt perfecto para cada modelo de IA" },
      {
        property: "og:description",
        content: "Generador de prompts multimodelo con preguntas guiadas, modo oscuro e idiomas.",
      },
    ],
  }),
});

type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  kind: "image" | "file";
  data: string;
  preview?: string;
};

type QA = { question: string; suggestions: string[]; answer: string };
type HistoryItem = { id: string; idea: string; model: string; prompt: string; at: number };

const MAX_FILES = 5;
const MAX_BYTES = 4 * 1024 * 1024;
const TEXTUAL = /^(text\/|application\/(json|xml|csv|javascript|x-yaml))/;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read_error"));
    r.readAsDataURL(file);
  });

const readAsText = (file: File) =>
  new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).slice(0, 12000));
    r.onerror = () => resolve("");
    r.readAsText(file);
  });

function PromptyScreen() {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState<LangCode>("es");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [idea, setIdea] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [questions, setQuestions] = useState<QA[] | null>(null);
  const [result, setResult] = useState("");
  const [stage, setStage] = useState<"idle" | "asking" | "writing">("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const askQuestions = useServerFn(getClarifyingQuestions);
  const writePrompt = useServerFn(generateFinalPrompt);

  const t = DICTS[lang];

  // Theme + persisted preferences
  useEffect(() => {
    const storedTheme = localStorage.getItem("prompty:theme");
    const storedLang = localStorage.getItem("prompty:lang") as LangCode | null;
    const storedModel = localStorage.getItem("prompty:model");
    const storedHistory = localStorage.getItem("prompty:history");
    if (storedTheme) setDark(storedTheme === "dark");
    if (storedLang && LANGUAGES.some((l) => l.code === storedLang)) setLang(storedLang);
    if (storedModel && MODELS.some((m) => m.id === storedModel)) setModel(storedModel);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory) as HistoryItem[]);
      } catch {
        /* ignore corrupt storage */
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("prompty:theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    localStorage.setItem("prompty:lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("prompty:model", model);
  }, [model]);

  const persistHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("prompty:history", JSON.stringify(items.slice(0, 10)));
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files).slice(0, MAX_FILES);
      const next: Attachment[] = [];
      for (const file of incoming) {
        if (file.size > MAX_BYTES) continue;
        const isImage = file.type.startsWith("image/");
        if (isImage) {
          const dataUrl = await readAsDataUrl(file);
          next.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type,
            kind: "image",
            data: dataUrl,
            preview: dataUrl,
          });
        } else {
          const text = TEXTUAL.test(file.type) ? await readAsText(file) : "";
          next.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            kind: "file",
            data: text,
          });
        }
      }
      setAttachments((prev) => [...prev, ...next].slice(0, MAX_FILES));
    },
    [],
  );

  const payload = useMemo(
    () => ({
      idea: idea.trim(),
      model,
      lang,
      attachments: attachments.map(({ name, mimeType, kind, data }) => ({
        name,
        mimeType,
        kind,
        data,
      })),
    }),
    [idea, model, lang, attachments],
  );

  const mapError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("RATE_LIMIT")) return t.errorRate;
    if (msg.includes("NO_CREDITS")) return t.errorCredits;
    return t.errorGeneric;
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError(t.errorEmpty);
      return;
    }
    setError("");
    setResult("");
    setQuestions(null);
    setStage("asking");
    try {
      const res = await askQuestions({ data: payload });
      if (res.questions.length) {
        setQuestions(res.questions.map((q) => ({ ...q, answer: "" })));
        setStage("idle");
      } else {
        await createPrompt([]);
      }
    } catch (e) {
      setError(mapError(e));
      setStage("idle");
    }
  };

  const createPrompt = async (answers: { question: string; answer: string }[]) => {
    setStage("writing");
    setError("");
    try {
      const res = await writePrompt({ data: { ...payload, answers } });
      setResult(res.prompt);
      if (res.prompt) {
        persistHistory([
          {
            id: crypto.randomUUID(),
            idea: idea.trim(),
            model,
            prompt: res.prompt,
            at: Date.now(),
          },
          ...history,
        ]);
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setError(mapError(e));
    } finally {
      setStage("idle");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const reset = () => {
    setIdea("");
    setAttachments([]);
    setQuestions(null);
    setResult("");
    setError("");
  };

  const busy = stage !== "idle";

  // Confetti when a prompt is ready
  const celebrated = useRef("");
  useEffect(() => {
    if (!result || celebrated.current === result) return;
    celebrated.current = result;
    let cancelled = false;
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ["#8b5cf6", "#6366f1", "#3b82f6", "#a78bfa"];
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors, scalar: 0.9 });
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            spread: 100,
            startVelocity: 35,
            origin: { y: 0.6 },
            colors,
            scalar: 0.8,
          }),
        220,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [result]);

  return (
    <div
      className="relative min-h-screen"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
      }}
    >
      <div className="halo pointer-events-none absolute inset-x-0 top-0 h-[520px]" aria-hidden />

      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src={logoAsset.url}
              alt="Prompty"
              className="h-9 w-9 object-contain"
              width={36}
              height={36}
            />
            <span className="text-lg font-semibold tracking-tight">Prompty</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-label={t.history}
              className="glass flex h-11 w-11 items-center justify-center rounded-2xl transition-colors hover:bg-accent"
            >
              <History className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              aria-label="theme"
              className="glass flex h-11 w-11 items-center justify-center rounded-2xl transition-colors hover:bg-accent"
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <div className="glass flex h-11 items-center gap-1.5 rounded-2xl px-3">
              <Globe className="h-[18px] w-[18px] text-muted-foreground" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LangCode)}
                aria-label={t.langName}
                className="cursor-pointer appearance-none bg-transparent pr-1 text-sm font-medium outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-popover text-popover-foreground">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt=""
            aria-hidden
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-[40px]">
            {t.tagline1} <span className="brand-text">{t.taglineHighlight}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{t.subtitle}</p>
        </div>

        {showHistory && (
          <section className="glass animate-rise mt-8 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t.history}</h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => persistHistory([])}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t.clear}
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t.historyEmpty}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setResult(h.prompt);
                        setIdea(h.idea);
                        setShowHistory(false);
                      }}
                      className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span className="line-clamp-1">{h.idea}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {MODELS.find((m) => m.id === h.model)?.label ?? h.model}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Composer */}
        <section className="glass mt-8 rounded-3xl p-4 sm:p-5">
          <label htmlFor="idea" className="text-sm font-medium">
            {t.inputLabel}
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 2000))}
            placeholder={t.placeholder}
            rows={5}
            className="mt-3 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />

          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="animate-rise group relative flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/50 py-1.5 pl-1.5 pr-7 text-xs"
                >
                  {a.preview ? (
                    <img src={a.preview} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                      <FileText className="h-4 w-4" />
                    </span>
                  )}
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => imageInput.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <ImageIcon className="h-4 w-4" /> {t.image}
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <FileText className="h-4 w-4" /> {t.file}
              </button>
            </div>
            <span className="text-xs text-muted-foreground">{idea.length}/2000</span>
          </div>

          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && void addFiles(e.target.files)}
          />
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.rtf"
            multiple
            hidden
            onChange={(e) => e.target.files && void addFiles(e.target.files)}
          />
        </section>

        {/* Model selector */}
        <div className="mt-6">
          <label htmlFor="model" className="text-sm font-medium">
            {t.model}
          </label>
          <div className="glass mt-2 rounded-2xl px-4">
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-14 w-full cursor-pointer appearance-none bg-transparent text-[15px] font-medium outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-popover text-popover-foreground">
                  {m.label} · {m.vendor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={busy}
          className="brand-gradient mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              {stage === "asking" ? t.thinking : t.generating}
            </>
          ) : (
            <>
              {t.generate} <Sparkles className="h-4.5 w-4.5" />
            </>
          )}
        </button>

        {error && (
          <p className="animate-rise mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Clarifying questions */}
        {questions && questions.length > 0 && (
          <section className="glass animate-rise mt-6 rounded-3xl p-5">
            <h2 className="text-base font-semibold">{t.questionsTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.questionsHint}</p>
            <div className="mt-4 space-y-4">
              {questions.map((q, i) => (
                <div key={q.question + i}>
                  <p className="text-sm font-medium">{q.question}</p>
                  {q.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setQuestions((prev) =>
                              prev!.map((x, xi) => (xi === i ? { ...x, answer: s } : x)),
                            )
                          }
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    value={q.answer}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev!.map((x, xi) => (xi === i ? { ...x, answer: e.target.value } : x)),
                      )
                    }
                    placeholder={t.answerPlaceholder}
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void createPrompt(
                    questions.map((q) => ({ question: q.question, answer: q.answer })),
                  )
                }
                className="brand-gradient flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
              >
                {stage === "writing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {t.continueBtn}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createPrompt([])}
                className="h-12 rounded-xl border border-border px-4 text-sm transition-colors hover:bg-accent sm:w-auto"
              >
                {t.skip}
              </button>
            </div>
          </section>
        )}

        {/* Result */}
        {result && (
          <section ref={resultRef} className="glass animate-rise mt-6 rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{t.resultTitle}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  aria-label={t.reset}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors hover:bg-accent"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="brand-gradient flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words rounded-2xl bg-secondary/40 p-4 text-[14px] leading-relaxed">
              {result}
            </pre>
          </section>
        )}
      </main>

      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="rounded-3xl border-2 border-dashed border-primary px-10 py-8 text-center text-sm font-medium">
            {t.dropHere}
          </div>
        </div>
      )}
    </div>
  );
}
