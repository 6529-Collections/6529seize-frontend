import type { Hex } from "viem";
import { derivedId } from "@/lib/chain/codec/ids";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import {
  wavesGateway,
  type ChainEntry,
  type ChainPoll,
  type ChainWave,
} from "./gateway";

/**
 * 6529.io's ids to the chain's. An object made on the chain is named by its
 * chain id, a 32-byte word. An object imported at the switch-on is named by
 * its 6529.io UUID, and its chain id derives from it (chain-tx
 * `legacy_object_id`), so this site computes it and never takes the
 * gateway's word for the mapping. Every answer must name the id asked for.
 */

/** The object kinds of imported records (chain-tx `ids::kind`). */
export const LegacyObjectKind = {
  PROFILE: 0x0101,
  GROUP: 0x0401,
  WAVE: 0x0501,
  DECISION: 0x0601,
  ENTRY: 0x0603,
  POLL: 0x060b,
} as const;

const CHAIN_ID = /^0x[0-9a-f]{64}$/i;
const UUID =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export const isChainId = (id: string): id is Hex => CHAIN_ID.test(id);

/** `DerivedId(uuid || 16 zero bytes, 0, kind)`: an imported object's id. */
export function legacyObjectId(uuid: string, kind: number): Hex {
  if (!UUID.test(uuid)) {
    throw new RangeError("not a UUID");
  }
  const bytes16 = uuid.replaceAll("-", "").toLowerCase();
  return derivedId(`0x${bytes16}${"00".repeat(16)}`, 0n, kind);
}

/** The chain id a 6529.io id names, or null when it is neither form. */
export function chainIdOf(id: string, kind: number): Hex | null {
  if (isChainId(id)) {
    return id.toLowerCase() as Hex;
  }
  return UUID.test(id) ? legacyObjectId(id, kind) : null;
}

async function lookUp<T>(
  id: string,
  kind: number,
  read: (chainId: Hex) => Promise<T | null>,
  idOf: (found: T) => Hex,
  missing: string
): Promise<T> {
  const chainId = chainIdOf(id, kind);
  const found = chainId === null ? null : await read(chainId);
  if (chainId === null || found === null) {
    throw new ChainOperationError("rejected", missing);
  }
  if (idOf(found).toLowerCase() !== chainId) {
    throw new ChainOperationError(
      "draft_mismatch",
      "The 6529 Network gateway answered for a different object. Nothing was signed."
    );
  }
  return found;
}

/** The entry a drop is on the 6529 Network. */
export const resolveEntry = (
  dropId: string,
  signal?: AbortSignal
): Promise<ChainEntry> =>
  lookUp(
    dropId,
    LegacyObjectKind.ENTRY,
    (id) => wavesGateway.getEntry(id, signal),
    (entry) => entry.entryId,
    "This entry isn't on the 6529 Network."
  );

/** The wave a 6529.io wave is on the 6529 Network. */
export const resolveWave = (
  waveId: string,
  signal?: AbortSignal
): Promise<ChainWave> =>
  lookUp(
    waveId,
    LegacyObjectKind.WAVE,
    (id) => wavesGateway.getWave(id, signal),
    (wave) => wave.waveId,
    "This wave isn't on the 6529 Network."
  );

/** The poll a drop's poll is on the 6529 Network. */
export const resolvePoll = (
  pollId: string,
  signal?: AbortSignal
): Promise<ChainPoll> =>
  lookUp(
    pollId,
    LegacyObjectKind.POLL,
    (id) => wavesGateway.getPoll(id, signal),
    (poll) => poll.pollId,
    "This poll isn't on the 6529 Network."
  );
