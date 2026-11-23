import { publicEnv } from "@/config/env";
import { canonicalJson } from "@/lib/device-signing/canonical-json";
import {
  encodeSignedRecordsHeader,
  SIGNED_RECORDS_HEADER,
} from "@/lib/signed-records/record-event";
import { recordDraft, signRecords } from "@/lib/signed-records/sign-records";

/**
 * Admin writes to the minting tables (distributions, claims, claim actions)
 * carry a signed `mint.admin` record: a kind 9 RECORD in the admin's own
 * public stream, signed by this browser's device key, so there is no wallet
 * prompt. The record names the action and the sha256 of the request, and the
 * API logs it beside the change. A user's own collaboration invites and
 * replies carry the same record with type `mint.user`. The route strings and
 * the request hash must match the API's (`src/mint-log/mint-log-http.ts` and
 * `mint-log-intent.ts`).
 */

const MINT_ADMIN_RECORD_TYPE = "mint.admin";
const MINT_USER_RECORD_TYPE = "mint.user";

export const MINT_ADMIN_ROUTES = {
  distPhase:
    "GET /subscriptions/allowlists/:contract/:token_id/:allowlist_id/:phase_id",
  distReset:
    "POST /subscriptions/allowlists/:contract/:token_id/:allowlist_id/reset",
  distNormalize: "POST /distributions/:contract/:id/normalize",
  distArtistAirdrops: "POST /distributions/:contract/:id/artist-airdrops",
  distTeamAirdrops: "POST /distributions/:contract/:id/team-airdrops",
  distGithubUpload: "POST /distributions/:contract/:id/github-upload",
  distPhotos: "POST /distribution_photos/:contract/:nft_id/complete",
  claimEdit: "PATCH /minting-claims/:contract/claims/:claim_id",
  claimMediaRequest:
    "POST /minting-claims/:contract/claims/:claim_id/arweave-upload",
  claimAction: "POST /minting-claims/actions/:contract/:claim_id",
} as const;

type MintAdminRoute =
  (typeof MINT_ADMIN_ROUTES)[keyof typeof MINT_ADMIN_ROUTES];

export const MINT_USER_ROUTES = {
  collabInvite: "POST /drops/:drop_id/collaborations",
  collabRespond: "POST /drops/:drop_id/collaborations/:invitation_id/response",
} as const;

type MintUserRoute = (typeof MINT_USER_ROUTES)[keyof typeof MINT_USER_ROUTES];

type MintLogAction =
  | "dist.phase"
  | "dist.public"
  | "dist.reset"
  | "dist.airdrops"
  | "dist.normalize"
  | "dist.photos"
  | "card.published"
  | "claim.edit"
  | "claim.media-request"
  | "claim.action";

type MintUserAction = "collab.invite" | "collab.respond";

interface MintAdminRequest {
  readonly action: MintLogAction;
  readonly route: MintAdminRoute;
  /** The route's path parameters, exactly as they appear in the URL. */
  readonly params: Readonly<Record<string, string>>;
  /** The JSON body as sent; omit it for a GET. */
  readonly body?: unknown;
}

interface MintUserRequest {
  readonly action: MintUserAction;
  readonly route: MintUserRoute;
  readonly params: Readonly<Record<string, string>>;
  readonly body: unknown;
}

interface MintRecordRequest {
  readonly action: MintLogAction | MintUserAction;
  readonly route: MintAdminRoute | MintUserRoute;
  readonly params: Readonly<Record<string, string>>;
  readonly body?: unknown;
}

/** What signing needs besides the device key: the stream owner and an anchor. */
interface MintRecordContext {
  /** The signed-in wallet's principal: `0x` + 64 lowercase hex. */
  readonly principal: string;
  /** A finalized chain height. */
  readonly anchor: number;
}

type MintRecordContextSource = () => Promise<MintRecordContext | null>;

let contextSource: MintRecordContextSource = () => Promise.resolve(null);

/**
 * Binds where the principal and anchor come from: the signed-records
 * module's sources, once it has them. Until then no header is sent.
 * @api
 */
export function setMintRecordContextSource(
  source: MintRecordContextSource
): void {
  contextSource = source;
}

/** Signed admin writes are staged behind a build-time flag. */
export const isMintSignedWritesEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_MINT_SIGNED_WRITES === "true";

/**
 * The body the API hashes: the JSON as sent, with no body and an empty
 * object both counting as null.
 */
function mintIntentBody(body: unknown): unknown {
  if (body === undefined || body === null) return null;
  const wire: unknown = JSON.parse(JSON.stringify(body));
  if (
    typeof wire === "object" &&
    wire !== null &&
    !Array.isArray(wire) &&
    Object.keys(wire).length === 0
  ) {
    return null;
  }
  return wire;
}

function toHex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

/** sha256 (hex) of a file's bytes. */
export async function sha256Hex(file: Blob): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}

/** sha256 (hex) of the request's canonical JSON, as the API computes it. */
async function mintIntentSha256(
  request: Pick<MintRecordRequest, "route" | "params" | "body">
): Promise<string> {
  const canonical = canonicalJson({
    body: mintIntentBody(request.body),
    params: request.params,
    route: request.route,
  });
  return toHex(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
  );
}

function newRecordKey(): string {
  return crypto.randomUUID();
}

/**
 * The `x-6529-signed-records` header for an admin write, or no header when
 * signing is off or not possible on this device. The API decides whether a
 * write needs one; when it does and none came, it answers with a message
 * that asks to turn on signing.
 */
export function mintAdminRecordHeaders(
  request: MintAdminRequest
): Promise<Record<string, string>> {
  return mintRecordHeaders(MINT_ADMIN_RECORD_TYPE, request);
}

/** The same header for a user's own collaboration invite or reply. */
export function mintUserRecordHeaders(
  request: MintUserRequest
): Promise<Record<string, string>> {
  return mintRecordHeaders(MINT_USER_RECORD_TYPE, request);
}

/**
 * Signing never blocks a write: on any failure (no anchor, a device key
 * error) the write goes without the header, and the API decides. It takes
 * unsigned writes until its PRIMARY switch.
 */
async function mintRecordHeaders(
  type: string,
  request: MintRecordRequest
): Promise<Record<string, string>> {
  if (!isMintSignedWritesEnabled()) return {};
  try {
    return await signedRecordHeaders(type, request);
  } catch {
    return {};
  }
}

async function signedRecordHeaders(
  type: string,
  request: MintRecordRequest
): Promise<Record<string, string>> {
  const context = await contextSource();
  if (!context) return {};
  const draft = recordDraft("ps", context.principal, type, newRecordKey(), {
    action: request.action,
    route: request.route,
    params: request.params,
    request_sha256: await mintIntentSha256(request),
  });
  const result = await signRecords([draft], { anchor: context.anchor });
  if (result.status !== "signed") return {};
  return { [SIGNED_RECORDS_HEADER]: encodeSignedRecordsHeader(result.events) };
}
