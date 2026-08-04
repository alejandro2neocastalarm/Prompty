import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildUserContent, callGateway, type Attachment } from "./ai.server";
import { getModel } from "./models";
import { LANG_NAMES } from "./i18n";

const attachmentSchema = z.object({
  name: z.string().max(200),
  mimeType: z.string().max(120),
  kind: z.enum(["image", "file"]),
  data: z.string().max(3_000_000),
});

const baseSchema = z.object({
  idea: z.string().trim().min(1).max(2000),
  model: z.string().max(60),
  lang: z.enum(["es", "en", "fr", "pt", "de"]),
  attachments: z.array(attachmentSchema).max(5).default([]),
});

const questionsSchema = baseSchema;

const finalSchema = baseSchema.extend({
  answers: z
    .array(z.object({ question: z.string().max(400), answer: z.string().max(600) }))
    .max(8)
    .default([]),
});

function describeAttachments(attachments: Attachment[]) {
  if (!attachments.length) return "";
  return `\n\nEl usuario ha adjuntado: ${attachments
    .map((a) => `${a.name} (${a.kind})`)
    .join(", ")}.`;
}

export const getClarifyingQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => questionsSchema.parse(input))
  .handler(async ({ data }) => {
    const model = getModel(data.model);
    const language = LANG_NAMES[data.lang];

    const instructions = `You are Prompty, an expert prompt engineer.
The user wants a prompt for ${model.vendor} ${model.label}.
Your job right now is ONLY to ask 3 to 5 short clarifying questions that would most improve the final prompt (style, tone, audience, format, length, colors, constraints, technical details, etc.).
Rules:
- Write every question in ${language}.
- Each question must be short (max 15 words) and answerable in one line.
- Ask about what is genuinely missing from the user's request, never about things they already specified.
- For each question, provide 2 to 4 short suggested example answers in ${language}.
Return only the structured JSON.`;

    const content = buildUserContent(
      `Petición del usuario: ${data.idea}${describeAttachments(data.attachments)}`,
      data.attachments,
    );

    const raw = await callGateway({
      instructions,
      content,
      jsonSchema: {
        name: "clarifying_questions",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  question: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } },
                },
                required: ["question", "suggestions"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    try {
      const parsed = JSON.parse(raw) as {
        questions?: { question: string; suggestions?: string[] }[];
      };
      return {
        questions: (parsed.questions ?? []).slice(0, 5).map((q) => ({
          question: String(q.question),
          suggestions: (q.suggestions ?? []).slice(0, 4).map(String),
        })),
      };
    } catch {
      return { questions: [] as { question: string; suggestions: string[] }[] };
    }
  });

export const generateFinalPrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => finalSchema.parse(input))
  .handler(async ({ data }) => {
    const model = getModel(data.model);
    const language = LANG_NAMES[data.lang];

    const instructions = `You are Prompty, a world-class prompt engineer.
Write ONE final, ready-to-paste prompt optimised for ${model.vendor} ${model.label}.

Model-specific guidance: ${model.guidance}

Rules:
- Output ONLY the prompt itself. No preamble, no explanation, no surrounding code fences, no commentary.
- Write the prompt in ${language}.
- Follow the model-specific structure described above exactly.
- Incorporate every detail the user gave, including their answers to the clarifying questions.
- Be specific and self-contained: the prompt must work without any extra context.
- Never invent facts the user did not provide; when a detail is unknown, phrase it as an instruction the target model can fulfil.`;

    const answersBlock = data.answers
      .filter((a) => a.answer.trim().length > 0)
      .map((a) => `- ${a.question} → ${a.answer}`)
      .join("\n");

    const userText = [
      `Petición original: ${data.idea}`,
      answersBlock ? `Detalles adicionales:\n${answersBlock}` : "",
      describeAttachments(data.attachments),
    ]
      .filter(Boolean)
      .join("\n\n");

    const text = await callGateway({
      instructions,
      content: buildUserContent(userText, data.attachments),
    });

    return { prompt: text || "" };
  });
