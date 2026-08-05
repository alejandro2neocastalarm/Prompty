const STT_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";

/** Transcribes a base64-encoded WAV recording through the Lovable AI Gateway. */
export async function transcribeWav(base64: string, lang: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("MISSING_KEY");

  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const form = new FormData();
  form.append("model", "openai/gpt-4o-transcribe");
  form.append("file", new Blob([binary], { type: "audio/wav" }), "recording.wav");
  if (lang) form.append("language", lang);

  const res = await fetch(STT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("NO_CREDITS");
    throw new Error(`STT_FAILED_${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}
