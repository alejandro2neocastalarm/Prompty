export type ModelOption = {
  id: string;
  label: string;
  vendor: string;
  /** Prompt-engineering guidance specific to this model family */
  guidance: string;
};

export const MODELS: ModelOption[] = [
  {
    id: "gpt-5",
    label: "GPT-5",
    vendor: "OpenAI",
    guidance:
      "OpenAI GPT-5: reasoning model. Structure with clear role, objective, explicit constraints, and a defined output format. Avoid telling it to 'think step by step' (it reasons natively). Use markdown sections and numbered requirements. Mention tools/format only if relevant.",
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    vendor: "OpenAI",
    guidance:
      "OpenAI GPT-4.1: literal instruction follower. Be explicit and exhaustive, use ordered rules, provide a worked example, and state exactly what NOT to do. Place key instructions at the beginning and repeat them at the end.",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    vendor: "OpenAI",
    guidance:
      "OpenAI GPT-4o: conversational multimodal model. Use a concise role + task + context + format structure, natural language, and short bullet constraints.",
  },
  {
    id: "claude-opus",
    label: "Claude Opus 4",
    vendor: "Anthropic",
    guidance:
      "Anthropic Claude: responds best to XML-tagged sections such as <context>, <task>, <constraints>, <output_format>, and <examples>. Assign a persona, be polite and explicit, and ask for the answer inside tags when structure matters.",
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet 4",
    vendor: "Anthropic",
    guidance:
      "Anthropic Claude Sonnet: use XML-tagged sections (<context>, <task>, <constraints>, <output_format>), a clear persona, and concise reasoning guidance.",
  },
  {
    id: "gemini-pro",
    label: "Gemini 2.5 Pro",
    vendor: "Google",
    guidance:
      "Google Gemini: prefers a Persona / Task / Context / Format layout with rich context up front. Long context is fine; be specific about the desired tone and length, and reference any attached media explicitly.",
  },
  {
    id: "gemini-flash",
    label: "Gemini Flash",
    vendor: "Google",
    guidance:
      "Google Gemini Flash: keep the prompt compact and direct with Persona / Task / Format sections and minimal preamble.",
  },
  {
    id: "grok",
    label: "Grok",
    vendor: "xAI",
    guidance:
      "xAI Grok: direct, informal-friendly instructions. State the goal, the tone, the constraints and the format plainly; it rewards blunt specificity over ceremony.",
  },
  {
    id: "deepseek",
    label: "DeepSeek R1",
    vendor: "DeepSeek",
    guidance:
      "DeepSeek R1: reasoning model. Give the problem and the constraints without chain-of-thought instructions, and specify the exact final output format.",
  },
  {
    id: "llama",
    label: "Llama 4",
    vendor: "Meta",
    guidance:
      "Meta Llama: use a clear system-style role line, explicit task, bounded constraints and an output template. Keep it unambiguous and avoid implicit assumptions.",
  },
  {
    id: "mistral",
    label: "Mistral Large",
    vendor: "Mistral",
    guidance:
      "Mistral: concise, structured instructions with numbered constraints and an explicit output format work best.",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    vendor: "Midjourney",
    guidance:
      "Midjourney: output a single comma-separated image prompt — subject, action, environment, composition, lighting, style, artist/medium references — followed by parameters such as --ar 16:9 --style raw --v 7. No prose, no explanations.",
  },
  {
    id: "dalle",
    label: "DALL·E 3",
    vendor: "OpenAI",
    guidance:
      "DALL·E 3: output one rich natural-language paragraph describing subject, setting, composition, lighting, color palette and artistic style. No parameter flags, no lists.",
  },
  {
    id: "stable-diffusion",
    label: "Stable Diffusion",
    vendor: "Stability AI",
    guidance:
      "Stable Diffusion: output a weighted keyword prompt (subject, style, lighting, quality tags) plus a separate 'Negative prompt:' line.",
  },
  {
    id: "sora",
    label: "Sora / Veo",
    vendor: "Video",
    guidance:
      "Video generation: describe the shot as a cinematographer — subject, action beats, camera movement, lens, lighting, mood, duration and aspect ratio — in flowing prose.",
  },
  {
    id: "generic",
    label: "Genérico / Otro",
    vendor: "Universal",
    guidance:
      "Model-agnostic: use a clean Role / Objective / Context / Constraints / Output format structure that works on any modern LLM.",
  },
];

export const DEFAULT_MODEL = "gpt-5";

export function getModel(id: string): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[MODELS.length - 1]!;
}
