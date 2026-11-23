import { z } from "zod";
import type { ApiSignedRecordsMode } from "@/generated/models/ApiSignedRecordsMode";
import { commonApiFetch } from "@/services/api/common-api";
import { getWalletAddress } from "@/services/auth/auth.utils";

/**
 * Where personal settings are written, as the API says:
 * - `legacy`: today's settings routes only;
 * - `shadow`: today's routes, then the same change as signed records, which
 *   the API checks and logs but does not apply;
 * - `primary`: signed records only.
 */
type PersonalRecordsModeName = "legacy" | "shadow" | "primary";

export interface PersonalRecordsMode {
  readonly mode: PersonalRecordsModeName;
  /** Every settings write answers 503 for a few minutes (the switch). */
  readonly frozen: boolean;
  /** The signed-in wallet's stream owner; null when signed out or the chain is unavailable. */
  readonly owner: string | null;
  /** The wallet 6529.io reads private settings as; null until configured. */
  readonly siteReader: string | null;
  /** The provider keys the private settings' sender key is wrapped to. */
  readonly providerKeys: readonly {
    readonly id: string;
    readonly publicKey: string;
  }[];
}

const OWNER = /^0x(?:[0-9a-f]{64}|[0-9a-f]{40})$/;
const WALLET = /^0x[0-9a-f]{40}$/;
const X25519_PUBLIC_KEY = /^0x[0-9a-f]{64}$/;

const modeSchema = z.object({
  mode: z.enum(["legacy", "shadow", "primary"]),
  frozen: z.boolean(),
  owner: z.string().regex(OWNER).nullable(),
  site_reader: z.string().regex(WALLET).nullable(),
  provider_keys: z.array(
    z.object({
      id: z.string().min(1).max(64),
      public_key: z.string().regex(X25519_PUBLIC_KEY),
    })
  ),
});

/** One answer serves every write for a minute; a 409 reads it again at once. */
const MODE_CACHE_MS = 60_000;

let cached: {
  readonly wallet: string;
  readonly value: PersonalRecordsMode;
  readonly at: number;
} | null = null;
let inFlight: {
  readonly wallet: string;
  readonly promise: Promise<PersonalRecordsMode>;
} | null = null;

const currentWallet = (): string => getWalletAddress()?.toLowerCase() ?? "";

async function requestMode(): Promise<PersonalRecordsMode> {
  // The generated type says what the API sends; the schema checks it,
  // since a record must never name a malformed owner or key.
  const response = modeSchema.parse(
    await commonApiFetch<ApiSignedRecordsMode>({
      endpoint: "signed-records/mode",
      cache: "no-store",
      errorMode: "structured",
    })
  );
  return {
    mode: response.mode,
    frozen: response.frozen,
    owner: response.owner,
    siteReader: response.site_reader,
    providerKeys: response.provider_keys.map((key) => ({
      id: key.id,
      publicKey: key.public_key,
    })),
  };
}

/**
 * The API's personal-records mode for the signed-in wallet, from
 * GET /signed-records/mode. `fresh` skips the cache (after a 409). The
 * answer is cached per wallet, since `owner` belongs to the session.
 */
export async function getPersonalRecordsMode({
  fresh = false,
}: { readonly fresh?: boolean } = {}): Promise<PersonalRecordsMode> {
  const wallet = currentWallet();
  const now = Date.now();
  if (
    !fresh &&
    cached?.wallet === wallet &&
    now - cached.at >= 0 &&
    now - cached.at < MODE_CACHE_MS
  ) {
    return cached.value;
  }
  if (!fresh && inFlight?.wallet === wallet) {
    return inFlight.promise;
  }
  const promise = requestMode()
    .then((value) => {
      cached = { wallet, value, at: Date.now() };
      return value;
    })
    .finally(() => {
      if (inFlight?.promise === promise) {
        inFlight = null;
      }
    });
  inFlight = { wallet, promise };
  return promise;
}
