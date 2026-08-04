const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";

export type Attachment = {
  name: string;
  mimeType: string;
  kind: "image" | "file";
  /** data URL for images, extracted text for text-like files */
  data: string;
};

type InputPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export function buildUserContent(text: string, attachments: Attachment[]): InputPart[] {
  const parts: InputPart[] = [{ type: "input_text", text }];
  for (const a of attachments) {
    if (a.kind === "image" && a.data.startsWith("data:")) {
      parts.push({ type: "input_image", image_url: a.data });
    } else {
      const excerpt = a.data.slice(0, 12000);
      parts.push({
        type: "input_text",
        text: `Archivo adjunto "${a.name}" (${a.mimeType}):\n${excerpt || "(contenido no legible como texto)"}`,
      });
    }
  }
  return parts;
}

type CallOptions = {
  instructions: string;
  content: InputPart[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
};

/**
 * Calls the Lovable AI Gateway Responses API (streaming, consumed server-side)
 * and returns the final text output.
 */
export async function callGateway({ instructions, content, jsonSchema }: CallOptions): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const body: Record<string, unknown> = {
    model: "openai/gpt-5.6-sol",
    instructions,
    input: [{ role: "user", content }],
    stream: true,
    store: false,
    reasoning: { effort: "low", summary: "auto" },
  };
  if (jsonSchema) {
    body["text"] = {
      format: {
        type: "json_schema",
        name: jsonSchema.name,
        strict: true,
        schema: jsonSchema.schema,
      },
    };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("NO_CREDITS");
    throw new Error(`AI_ERROR:${res.status}:${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          out += evt.delta;
        } else if (evt.type === "response.completed" && !out && evt.response?.output_text) {
          out = evt.response.output_text;
        }
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
  }

  return out.trim();
}
