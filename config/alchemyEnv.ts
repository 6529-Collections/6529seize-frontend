import { z } from "zod";

const alchemyEnvSchema = z.object({
  ALCHEMY_API_KEY: z
    .string()
    .min(1, "ALCHEMY_API_KEY is required and must be a non-empty string"),
});

let cachedApiKey: string | null = null;

export function getAlchemyApiKey(): string {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const parsed = alchemyEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issue =
      parsed.error.issues[0]?.message ?? "ALCHEMY_API_KEY is missing";
    throw new Error(issue);
  }

  cachedApiKey = parsed.data.ALCHEMY_API_KEY;
  return cachedApiKey;
}
