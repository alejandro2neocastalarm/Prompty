import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { transcribeWav } from "./stt.server";

const schema = z.object({
  audio: z.string().min(100).max(12_000_000),
  lang: z.enum(["es", "en", "fr", "pt", "de"]),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => ({ text: await transcribeWav(data.audio, data.lang) }));
