import { sha256 } from "js-sha256";
import { getWalletSignatureAudience } from "./structured-wallet-signatures";

/** Matches the native server signing domain. Undefined object fields are omitted. */
export function canonicalCompetitionJson(value: unknown): string {
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol"
  )
    throw new Error("Invalid signature payload");
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalCompetitionJson(item)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => {
        if (a < b) return -1;
        return a > b ? 1 : 0;
      })
      .map(
        ([key, item]) =>
          `${JSON.stringify(key)}:${canonicalCompetitionJson(item)}`
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildCompetitionSignatureMessage({
  action,
  audience = getWalletSignatureAudience(),
  actorProfileId,
  actorWallet,
  waveId,
  competitionId,
  entryId,
  dropId,
  configVersion,
  payload,
  nonce,
  issuedAt,
}: {
  readonly action: "ENTRY_CREATE" | "VOTE_SET";
  readonly audience?: string;
  readonly actorProfileId: string;
  readonly actorWallet: string;
  readonly waveId: string;
  readonly competitionId: string;
  readonly entryId: string | null;
  readonly dropId: string | null;
  readonly configVersion: number;
  readonly payload: unknown;
  readonly nonce: string;
  readonly issuedAt: number;
}) {
  return canonicalCompetitionJson({
    domain: "6529-competition-v1",
    audience,
    chain_id: 1,
    action,
    actor_profile_id: actorProfileId,
    actor_wallet: actorWallet.toLowerCase(),
    wave_id: waveId,
    competition_id: competitionId,
    competition_entry_id: entryId,
    drop_id: dropId,
    config_version: configVersion,
    payload_hash: sha256(canonicalCompetitionJson(payload)),
    nonce,
    issued_at: issuedAt,
    expires_at: issuedAt + 300_000,
  });
}
