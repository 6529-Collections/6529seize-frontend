import { z } from "zod";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import { resolveVerificationSource } from "./loadVerification.server";

/**
 * The optional manifest the Lean build publishes at `{base}/formal/manifest.json`
 * (plan §11.5). Without it the Formal model page lists its planned statements;
 * with it the page lists only what the manifest states, so nothing can show as
 * proved that the build did not prove.
 */
const statement = z.object({
  id: z.string().regex(/^[a-z][a-zA-Z0-9-]{0,47}$/),
  title: z.string().min(1).max(120),
  plain: z.string().min(1).max(600),
  p26: z.string().min(1).max(60),
  lean: z.string().min(1).max(4_000),
  status: z.enum(["stated", "proved", "gap"]),
});

export const formalManifestSchema = z.object({
  leanVersion: z.string().min(1).max(40),
  builtAt: z.string().min(1).max(40),
  vectorsPassed: z.number().int().nonnegative().max(1_000),
  vectorsTotal: z.number().int().positive().max(1_000),
  statements: z.array(statement).max(200),
});

export type FormalManifest = z.infer<typeof formalManifestSchema>;
export type FormalStatement = FormalManifest["statements"][number];

export async function loadFormalManifest(
  fetchImpl: typeof fetch = globalThis.fetch,
  base: string | undefined = publicEnv.NEXT_PUBLIC_TDH_VERIFICATION_BASE,
  isProduction: boolean = getAppEnvironment(publicEnv.BASE_ENDPOINT)
    .isProduction
): Promise<FormalManifest | null> {
  const source = resolveVerificationSource(base, isProduction);
  if (source.kind !== "remote") {
    return null;
  }
  try {
    const response = await fetchImpl(
      new URL("formal/manifest.json", source.base).toString(),
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
        next: { revalidate: 3_600 },
      } as RequestInit
    );
    if (!response.ok) {
      return null;
    }
    const parsed = formalManifestSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
