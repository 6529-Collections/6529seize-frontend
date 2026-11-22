import { signEventId } from "@/lib/device-signing/ed25519";
import { readUsableDeviceGrant } from "@/lib/device-signing/device-key-store";
import type { E2eeApiClient } from "@/lib/e2ee/api";
import type { ApiE2eeMe } from "@/lib/e2ee/api-types";
import type { CrpOpener, RelayAuth, RelayGrantProof } from "./crp-client";
import { E2eeRelayReader } from "./relay-reader";

/** How long relay settings from `GET e2ee/me` are trusted before a re-read. */
const SETTINGS_TTL_MS = 5 * 60 * 1000;

interface E2eeRelaySettings {
  readonly urls: readonly string[];
  readonly net: string;
  readonly ordererKey: string;
  readonly grantProofs: readonly RelayGrantProof[];
}

const HEX_32 = /^0x[0-9a-f]{64}$/u;

/**
 * The relay block of `GET e2ee/me`, when clients should read from the
 * relays: only in `primary` mode, with WebSocket URLs, a network tag and
 * the pinned orderer key. Anything else means "read from 6529.io".
 */
export function relaySettingsOf(me: ApiE2eeMe): E2eeRelaySettings | null {
  const relay = (me as { relay?: unknown }).relay as
    | Record<string, unknown>
    | undefined;
  if (relay?.["mode"] !== "primary") return null;
  const urls = relay["urls"];
  const net = relay["net"];
  const ordererKey = relay["orderer_key"];
  const proofs = relay["grant_proofs"];
  if (
    !Array.isArray(urls) ||
    !urls.length ||
    !urls.every((url) => typeof url === "string" && /^wss?:\/\//u.test(url)) ||
    typeof net !== "string" ||
    !net ||
    typeof ordererKey !== "string" ||
    !HEX_32.test(ordererKey.toLowerCase()) ||
    !Array.isArray(proofs)
  ) {
    return null;
  }
  return {
    urls: urls as string[],
    net,
    ordererKey: ordererKey.toLowerCase(),
    grantProofs: proofs as RelayGrantProof[],
  };
}

/** The relay AUTH for this browser: its device key and that key's grant. */
async function deviceAuth(
  wallet: string,
  proofs: readonly RelayGrantProof[]
): Promise<RelayAuth | null> {
  const usable = await readUsableDeviceGrant(wallet, Date.now());
  if (!usable) return null;
  const proof = proofs.find(
    (candidate) =>
      candidate.id.toLowerCase() === usable.grant.id.toLowerCase() &&
      candidate.device_key.toLowerCase() ===
        usable.record.publicKeyHex.toLowerCase()
  );
  if (!proof) return null;
  const privateKey = usable.record.keyPair.privateKey;
  return {
    grant: proof,
    sign: (digest) => signEventId(privateKey, digest as `0x${string}`),
  };
}

/**
 * Reads ciphertext from the relays where it can, and from 6529.io where it
 * must. Welcomes, log pages and attachment chunks are read from the relays
 * while `GET e2ee/me` says the relays are primary; any relay failure, any
 * record that is not the orderer's or breaks its stream's hash chain, and
 * any relay behind 6529.io makes that one call read from 6529.io instead.
 * Every write still goes to 6529.io, the orderer.
 */
export function withE2eeRelayReads(
  base: E2eeApiClient,
  options: {
    readonly wallet: string;
    readonly open?: CrpOpener;
    readonly now?: () => number;
    readonly onFallback?: (call: string, error: unknown) => void;
  }
): E2eeApiClient {
  const now = options.now ?? Date.now;
  let settings: E2eeRelaySettings | null = null;
  let settingsAt = -Infinity;
  let reader: E2eeRelayReader | null = null;
  let readerKey = "";

  const remember = (me: ApiE2eeMe) => {
    settings = relaySettingsOf(me);
    settingsAt = now();
    const key = settings
      ? `${settings.urls.join(",")}|${settings.net}|${settings.ordererKey}`
      : "";
    if (key !== readerKey) {
      reader?.close();
      reader = null;
      readerKey = key;
    }
  };

  const currentReader = async (): Promise<E2eeRelayReader | null> => {
    // Settings come from the engine's own GET e2ee/me. Only a client that is
    // reading from the relays re-reads them on its own, so a rollback to
    // mirror reaches it within the lifetime; others send nothing extra.
    if (settings && now() - settingsAt > SETTINGS_TTL_MS) {
      remember(await base.getMe());
    }
    const current = settings;
    if (!current) return null;
    reader ??= new E2eeRelayReader({
      urls: current.urls,
      net: current.net,
      ordererKey: current.ordererKey,
      auth: () => deviceAuth(options.wallet, current.grantProofs),
      open: options.open,
      now,
    });
    return reader;
  };

  async function viaRelay<T>(
    call: string,
    relayRead: (relay: E2eeRelayReader) => Promise<T>,
    rest: () => Promise<T>
  ): Promise<T> {
    let relay: E2eeRelayReader | null = null;
    try {
      relay = await currentReader();
    } catch {
      relay = null;
    }
    if (!relay) return rest();
    try {
      return await relayRead(relay);
    } catch (error) {
      options.onFallback?.(call, error);
      return rest();
    }
  }

  return {
    ...base,
    getMe: async () => {
      const me = await base.getMe();
      remember(me);
      return me;
    },
    getWelcomes: (deviceKey, signal) =>
      viaRelay(
        "getWelcomes",
        (relay) => relay.welcomes(deviceKey),
        () => base.getWelcomes(deviceKey, signal)
      ),
    getLog: (group, query) =>
      viaRelay(
        "getLog",
        async (relay) => {
          const state = await base.getGroup(group, query.deviceKey);
          const page = await relay.log({
            group,
            deviceKey: query.deviceKey,
            afterSeq: query.afterSeq,
            limit: query.limit ?? 100,
            lastSeq: state.last_seq,
          });
          return { ...page, group: state };
        },
        () => base.getLog(group, query)
      ),
    getBlobChunk: (blobId, index, deviceKey, signal) =>
      viaRelay(
        "getBlobChunk",
        async (relay) => ({ data: await relay.blobChunk(blobId, index) }),
        () => base.getBlobChunk(blobId, index, deviceKey, signal)
      ),
  };
}
