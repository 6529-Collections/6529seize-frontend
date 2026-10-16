import { cache } from "react";
import { getAppEnvironment } from "@/config/appEnvironment";
import { publicEnv } from "@/config/env";
import {
  FORMAL_MANIFEST_REVALIDATE_SECONDS,
  fetchFeedJson,
  isNotPublishedStatus,
  resolveVerificationSource,
} from "@/lib/tdh/verification/loadVerification.server";
import {
  formalManifestSchema,
  parseFormalManifest,
  type FormalManifest,
} from "./manifest";

/**
 * Server-side loader for the Lean proof manifest, `formal/manifest.json` on
 * the public TDH feed (the same base URL as the daily files). The formal
 * model page always has a manifest to show:
 *
 * | Feed                         | Result                             |
 * | Base set, manifest valid     | `published`, with its URL          |
 * | Base set, 403 or 404         | `bundled`, reason `unpublished`    |
 * | Base set, any other failure  | `bundled`, reason `unavailable`    |
 * | Base set, manifest invalid   | `bundled`, reason `invalid`        |
 * | Base unset or not a URL      | `bundled`, reason `unconfigured`   |
 *
 * The bundled manifest is a real one, as the feed served it at a stated
 * commit, so the page never shows a status no build produced; the page says
 * which of the two it shows.
 */

type FormalManifestLoad =
  | {
      readonly status: "published";
      readonly manifest: FormalManifest;
      readonly url: string;
      /** SHA-256 of the file's bytes as served; null when not read. */
      readonly sha256: string | null;
    }
  | {
      readonly status: "bundled";
      readonly manifest: FormalManifest;
      readonly reason:
        | "unpublished"
        | "unavailable"
        | "invalid"
        | "unconfigured";
    };

interface FormalManifestLoaderOptions {
  readonly base: string | undefined;
  readonly isProduction: boolean;
  readonly fetchImpl?: typeof fetch;
  readonly loadBundled?: () => Promise<FormalManifest>;
}

/** The bundled manifest, parsed through the same schema as the published one. */
async function loadBundledFormalManifest(): Promise<FormalManifest> {
  const bundled = await import("./bundledManifest");
  return formalManifestSchema.parse(bundled.BUNDLED_FORMAL_MANIFEST);
}

export function createFormalManifestLoader(
  options: FormalManifestLoaderOptions
) {
  const source = resolveVerificationSource(options.base, options.isProduction);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const loadBundled = options.loadBundled ?? loadBundledFormalManifest;

  return async function loadFormalManifest(): Promise<FormalManifestLoad> {
    const bundled = async (
      reason: Extract<FormalManifestLoad, { status: "bundled" }>["reason"]
    ): Promise<FormalManifestLoad> => ({
      status: "bundled",
      manifest: await loadBundled(),
      reason,
    });
    if (source.kind !== "remote") {
      return bundled("unconfigured");
    }
    const url = new URL("formal/manifest.json", source.base);
    const result = await fetchFeedJson(
      fetchImpl,
      url,
      FORMAL_MANIFEST_REVALIDATE_SECONDS
    );
    if (!result.ok) {
      return bundled(
        isNotPublishedStatus(result.status) ? "unpublished" : "unavailable"
      );
    }
    const parsed = parseFormalManifest(result.json);
    if (!parsed.success) {
      return bundled("invalid");
    }
    return {
      status: "published",
      manifest: parsed.data,
      url: url.toString(),
      sha256: result.sha256,
    };
  };
}

/** The manifest, deduplicated within one server render. */
export const loadFormalManifest = cache(
  (): Promise<FormalManifestLoad> =>
    createFormalManifestLoader({
      base: publicEnv.NEXT_PUBLIC_TDH_VERIFICATION_BASE,
      isProduction: getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction,
    })()
);
