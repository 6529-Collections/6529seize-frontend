import { setTimeout as delay } from "node:timers/promises";

import { nip19, SimplePool } from "nostr-tools";
import type { Event } from "nostr-tools";

import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import type {
  NostrArticlePointer,
  NostrCardResponse,
  NostrNotePointer,
  NostrProfilePointer,
  NostrProfileResponse,
} from "@/types/nostr-open-graph";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://eden.nostr.land",
] as const;

const TRACKING_PARAM_PREFIXES = ["utm_", "ref", "source", "feature", "fbclid", "gclid"] as const;

const NOTE_CACHE_PREFIX = "nostr:note:";
const PROFILE_CACHE_PREFIX = "nostr:profile:";
const ARTICLE_CACHE_PREFIX = "nostr:article:";
const SECRET_CACHE_KEY = "nostr:secret";

const NOTE_CACHE_TTL_MS = 15 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 15 * 60 * 1000;
const ARTICLE_CACHE_TTL_MS = 15 * 60 * 1000;
const SECRET_CACHE_TTL_MS = 30 * 60 * 1000;

const NIP05_TTL_MS = 24 * 60 * 60 * 1000;

const MAX_NOTE_TEXT_LENGTH = 2800;
const MAX_PROFILE_ABOUT_LENGTH = 1200;
const MAX_ARTICLE_SUMMARY_LENGTH = 1200;

const NOTE_FETCH_TIMEOUT_MS = 3500;
const PROFILE_FETCH_TIMEOUT_MS = 3500;
const ARTICLE_FETCH_TIMEOUT_MS = 3500;
const NIP05_FETCH_TIMEOUT_MS = 1500;

const IMAGE_PROXY_BASE =
  process.env.IMAGE_PROXY_URL ??
  process.env.NEXT_PUBLIC_IMAGE_PROXY_URL ??
  process.env.NEXT_PUBLIC_IMG_PROXY_URL ??
  null;

const nip05Cache = new Map<
  string,
  { readonly expiresAt: number; readonly verified: boolean; readonly pubkey: string | null }
>();

const isHex32 = (value: string): boolean => /^(?:[0-9a-f]{64})$/i.test(value);

const isValidRelayUrl = (url: string | undefined): url is string => {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === "ws:" || protocol === "wss:";
  } catch {
    return false;
  }
};

const normalizeRelays = (relays: readonly string[] | undefined): string[] => {
  if (!relays || relays.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  for (const relay of relays) {
    if (!isValidRelayUrl(relay)) {
      continue;
    }
    const normalized = relay.replace(/\/$/, "");
    if (!seen.has(normalized)) {
      seen.add(normalized);
    }
  }

  return Array.from(seen);
};

const proxyImageUrl = (value: string | null | undefined): string | null => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  if (!IMAGE_PROXY_BASE) {
    return trimmed;
  }

  if (IMAGE_PROXY_BASE.includes("{url}")) {
    return IMAGE_PROXY_BASE.replace("{url}", encodeURIComponent(trimmed));
  }

  try {
    const base = new URL(IMAGE_PROXY_BASE);
    base.searchParams.set("url", trimmed);
    return base.toString();
  } catch {
    return trimmed;
  }
};

const clampText = (value: string | null, maxLength: number): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/<[^>]*>/g, "").replace(/\r\n/g, "\n").replace(/\s+$/g, "").trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
};

const toShortHex = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.length <= 12
    ? value
    : `${value.slice(0, 6)}…${value.slice(value.length - 4)}`;
};

const toShortNpub = (pubkey: string): string => {
  try {
    const npub = nip19.npubEncode(pubkey);
    return `${npub.slice(0, 8)}…${npub.slice(npub.length - 4)}`;
  } catch {
    return toShortHex(pubkey);
  }
};

type ParsedNotePointer = {
  readonly type: "note";
  readonly pointer: NostrNotePointer;
  readonly canonicalUrl: string | null;
  readonly openUrl: string | null;
  readonly cacheKey: string;
};

type ParsedProfilePointer = {
  readonly type: "profile";
  readonly pointer: NostrProfilePointer;
  readonly canonicalUrl: string | null;
  readonly openUrl: string | null;
  readonly cacheKey: string;
};

type ParsedArticlePointer = {
  readonly type: "article";
  readonly pointer: NostrArticlePointer;
  readonly canonicalUrl: string | null;
  readonly openUrl: string | null;
  readonly cacheKey: string;
};

type ParsedSecretPointer = { readonly type: "secret" };

type ParsedPointer =
  | ParsedNotePointer
  | ParsedProfilePointer
  | ParsedArticlePointer
  | ParsedSecretPointer;

const normalizePermalink = (url: URL): string => {
  const sanitized = new URL(url.toString());
  sanitized.hostname = sanitized.hostname.replace(/^www\./i, "");
  sanitized.hash = "";

  const params = new URLSearchParams();
  for (const [key, value] of Array.from(sanitized.searchParams.entries())) {
    const lowerKey = key.toLowerCase();
    if (TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))) {
      continue;
    }
    params.append(key, value);
  }
  sanitized.search = params.toString();
  return sanitized.toString();
};

const decodeNoteIdentifier = (value: string): { readonly id: string } | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (isHex32(trimmed)) {
    return { id: trimmed.toLowerCase() };
  }

  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === "note" && typeof decoded.data === "string") {
      return { id: decoded.data };
    }
    if (decoded.type === "nevent" && typeof decoded.data === "object" && decoded.data.id) {
      return { id: decoded.data.id };
    }
  } catch {
    return null;
  }

  return null;
};

const decodeProfileIdentifier = (value: string): { readonly pubkey: string; readonly relays?: string[] } | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (isHex32(trimmed)) {
    return { pubkey: trimmed.toLowerCase() };
  }

  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === "npub" && typeof decoded.data === "string") {
      return { pubkey: decoded.data };
    }
    if (decoded.type === "nprofile" && typeof decoded.data === "object" && decoded.data.pubkey) {
      return { pubkey: decoded.data.pubkey, relays: decoded.data.relays };
    }
  } catch {
    return null;
  }

  return null;
};

const decodeArticleIdentifier = (
  value: string
): { readonly pubkey: string; readonly identifier: string; readonly relays?: string[] } | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === "naddr" && typeof decoded.data === "object") {
      const { pubkey, identifier, kind, relays } = decoded.data;
      if (kind === 30023 && pubkey && identifier) {
        return { pubkey, identifier, relays };
      }
    }
  } catch {
    return null;
  }

  return null;
};

const parseBech32Pointer = (value: string): ParsedPointer | null => {
  const lower = value.toLowerCase();
  if (lower.startsWith("nsec1")) {
    return { type: "secret" };
  }

  try {
    const decoded = nip19.decode(value);
    if (decoded.type === "note" && typeof decoded.data === "string") {
      const pointer: NostrNotePointer = { id: decoded.data };
      return {
        type: "note",
        pointer,
        canonicalUrl: null,
        openUrl: `https://snort.social/e/${pointer.id}`,
        cacheKey: `${NOTE_CACHE_PREFIX}${pointer.id}`,
      };
    }

    if (decoded.type === "nevent" && typeof decoded.data === "object" && decoded.data.id) {
      const pointer: NostrNotePointer = {
        id: decoded.data.id,
        relays: normalizeRelays(decoded.data.relays),
      };
      return {
        type: "note",
        pointer,
        canonicalUrl: null,
        openUrl: `https://snort.social/e/${pointer.id}`,
        cacheKey: `${NOTE_CACHE_PREFIX}${pointer.id}`,
      };
    }

    if (decoded.type === "npub" && typeof decoded.data === "string") {
      const pointer: NostrProfilePointer = { pubkey: decoded.data };
      return {
        type: "profile",
        pointer,
        canonicalUrl: `https://snort.social/p/${pointer.pubkey}`,
        openUrl: `https://snort.social/p/${pointer.pubkey}`,
        cacheKey: `${PROFILE_CACHE_PREFIX}${pointer.pubkey}`,
      };
    }

    if (decoded.type === "nprofile" && typeof decoded.data === "object" && decoded.data.pubkey) {
      const pointer: NostrProfilePointer = {
        pubkey: decoded.data.pubkey,
        relays: normalizeRelays(decoded.data.relays),
      };
      return {
        type: "profile",
        pointer,
        canonicalUrl: `https://snort.social/p/${pointer.pubkey}`,
        openUrl: `https://snort.social/p/${pointer.pubkey}`,
        cacheKey: `${PROFILE_CACHE_PREFIX}${pointer.pubkey}`,
      };
    }

    if (decoded.type === "naddr" && typeof decoded.data === "object") {
      const { kind, identifier, pubkey, relays } = decoded.data;
      if (kind === 30023 && pubkey && identifier) {
        return {
          type: "article",
          pointer: { kind: 30023, pubkey, identifier, relays: normalizeRelays(relays) },
          canonicalUrl: null,
          openUrl: null,
          cacheKey: `${ARTICLE_CACHE_PREFIX}${pubkey}:${identifier}`,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
};

type PermalinkParser = (url: URL) => ParsedPointer | null;

const parseSnortPermalink: PermalinkParser = (url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [type, identifier] = segments;
  if (type === "e") {
    const decoded = decodeNoteIdentifier(identifier);
    if (!decoded) {
      return null;
    }
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "note",
      pointer: { id: decoded.id },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${NOTE_CACHE_PREFIX}${decoded.id}`,
    };
  }

  if (type === "p") {
    const decoded = decodeProfileIdentifier(identifier);
    if (!decoded) {
      return null;
    }

    const canonicalUrl = normalizePermalink(url);
    return {
      type: "profile",
      pointer: { pubkey: decoded.pubkey, relays: normalizeRelays(decoded.relays) },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${PROFILE_CACHE_PREFIX}${decoded.pubkey}`,
    };
  }

  return null;
};

const parseCoraclePermalink: PermalinkParser = (url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [type, identifier] = segments;
  if (type === "note") {
    const decoded = decodeNoteIdentifier(identifier);
    if (!decoded) {
      return null;
    }
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "note",
      pointer: { id: decoded.id },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${NOTE_CACHE_PREFIX}${decoded.id}`,
    };
  }

  if (type === "p") {
    const decoded = decodeProfileIdentifier(identifier);
    if (!decoded) {
      return null;
    }
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "profile",
      pointer: { pubkey: decoded.pubkey, relays: normalizeRelays(decoded.relays) },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${PROFILE_CACHE_PREFIX}${decoded.pubkey}`,
    };
  }

  return null;
};

const parsePrimalPermalink: PermalinkParser = (url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [type, identifier] = segments;
  if (type === "e") {
    const decoded = decodeNoteIdentifier(identifier);
    if (!decoded) {
      return null;
    }
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "note",
      pointer: { id: decoded.id },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${NOTE_CACHE_PREFIX}${decoded.id}`,
    };
  }

  if (type === "p") {
    const decoded = decodeProfileIdentifier(identifier);
    if (!decoded) {
      return null;
    }
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "profile",
      pointer: { pubkey: decoded.pubkey, relays: normalizeRelays(decoded.relays) },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${PROFILE_CACHE_PREFIX}${decoded.pubkey}`,
    };
  }

  return null;
};

const parseIrisPermalink: PermalinkParser = (url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const identifier = segments[0];
  const noteDecoded = decodeNoteIdentifier(identifier);
  if (noteDecoded) {
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "note",
      pointer: { id: noteDecoded.id },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${NOTE_CACHE_PREFIX}${noteDecoded.id}`,
    };
  }

  const profileDecoded = decodeProfileIdentifier(identifier);
  if (profileDecoded) {
    const canonicalUrl = normalizePermalink(url);
    return {
      type: "profile",
      pointer: { pubkey: profileDecoded.pubkey, relays: normalizeRelays(profileDecoded.relays) },
      canonicalUrl,
      openUrl: canonicalUrl,
      cacheKey: `${PROFILE_CACHE_PREFIX}${profileDecoded.pubkey}`,
    };
  }

  return null;
};

const parseNostrAtPermalink: PermalinkParser = (url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const identifier = segments[0];
  const decoded = decodeNoteIdentifier(identifier);
  if (!decoded) {
    return null;
  }
  const canonicalUrl = normalizePermalink(url);
  return {
    type: "note",
    pointer: { id: decoded.id },
    canonicalUrl,
    openUrl: canonicalUrl,
    cacheKey: `${NOTE_CACHE_PREFIX}${decoded.id}`,
  };
};

const PERMALINK_PARSERS: Record<string, PermalinkParser> = {
  "snort.social": parseSnortPermalink,
  "coracle.social": parseCoraclePermalink,
  "primal.net": parsePrimalPermalink,
  "iris.to": parseIrisPermalink,
  "nostr.at": parseNostrAtPermalink,
};

const parsePermalink = (value: string): ParsedPointer | null => {
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== "http:" && protocol !== "https:") {
      return null;
    }
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const parser = PERMALINK_PARSERS[hostname];
    if (!parser) {
      return null;
    }
    return parser(parsed);
  } catch {
    return null;
  }
};

const parsePointer = (input: string): ParsedPointer | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase().startsWith("nostr:")) {
    return parseBech32Pointer(trimmed.slice(6));
  }

  if (/^(note1|nevent1|npub1|nprofile1|naddr1|nsec1)/i.test(trimmed)) {
    return parseBech32Pointer(trimmed);
  }

  const permalinkPointer = parsePermalink(trimmed);
  if (permalinkPointer) {
    return permalinkPointer;
  }

  return null;
};

const mergeRelayHints = (
  pointerRelays: readonly string[] | undefined,
  additional: readonly string[]
): string[] => {
  const dedup = new Set<string>();
  for (const relay of pointerRelays ?? []) {
    if (isValidRelayUrl(relay)) {
      dedup.add(relay.replace(/\/$/, ""));
    }
  }
  for (const relay of additional) {
    if (isValidRelayUrl(relay)) {
      dedup.add(relay.replace(/\/$/, ""));
    }
  }
  return Array.from(dedup);
};

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
  const timeoutPromise = delay(timeoutMs).then(() => null as T | null);
  return Promise.race([promise.then((value) => value as T | null).catch(() => null), timeoutPromise]);
};

const fetchSingleEvent = async (
  relays: readonly string[],
  filter: Parameters<SimplePool["get"]>[1],
  timeoutMs: number
): Promise<Event | null> => {
  const pool = new SimplePool();
  try {
    const result = await runWithTimeout(pool.get(relays as string[], filter, { maxWait: timeoutMs }), timeoutMs);
    return result ?? null;
  } finally {
    pool.close(relays as string[]);
    pool.destroy();
  }
};

const extractLabels = (tags: readonly string[][]): string[] => {
  const labels = new Set<string>();
  for (const tag of tags) {
    if (!Array.isArray(tag) || tag.length === 0) {
      continue;
    }
    const key = (tag[0] ?? "").toLowerCase();
    const value = (tag[1] ?? "").trim();
    if (!value) {
      continue;
    }
    if (key === "content-warning" || key === "cw" || key === "label") {
      labels.add(value.toLowerCase());
    }
  }
  return Array.from(labels);
};

const IMAGE_URL_PATTERN = /(https?:\/\/[^\s<>\"]+\.(?:png|jpe?g|gif|webp|avif))/gi;

const extractImageUrls = (content: string): string[] => {
  const results = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = IMAGE_URL_PATTERN.exec(content))) {
    if (match[1]) {
      results.add(match[1]);
    }
  }
  return Array.from(results);
};

const sanitizeCreatedAt = (createdAt: number | undefined): string | null => {
  if (!createdAt || Number.isNaN(createdAt)) {
    return null;
  }
  try {
    return new Date(createdAt * 1000).toISOString();
  } catch {
    return null;
  }
};

const parseProfileContent = (
  content: string | null
): {
  readonly name: string | null;
  readonly displayName: string | null;
  readonly about: string | null;
  readonly picture: string | null;
  readonly banner: string | null;
  readonly nip05: string | null;
} => {
  if (!content) {
    return {
      name: null,
      displayName: null,
      about: null,
      picture: null,
      banner: null,
      nip05: null,
    };
  }

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed !== "object" || parsed === null) {
      return {
        name: null,
        displayName: null,
        about: null,
        picture: null,
        banner: null,
        nip05: null,
      };
    }

    const record = parsed as Record<string, unknown>;
    const getString = (key: string): string | null => {
      const value = record[key];
      return typeof value === "string" && value.trim() ? value.trim() : null;
    };

    return {
      name: getString("name"),
      displayName: getString("display_name"),
      about: getString("about"),
      picture: getString("picture"),
      banner: getString("banner"),
      nip05: getString("nip05"),
    };
  } catch {
    return {
      name: null,
      displayName: null,
      about: null,
      picture: null,
      banner: null,
      nip05: null,
    };
  }
};

const verifyNip05 = async (pubkey: string, nip05: string | null): Promise<{ verified: boolean; handle: string | null }> => {
  if (!nip05) {
    return { verified: false, handle: null };
  }

  const normalized = nip05.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { verified: false, handle: null };
  }

  const cacheKey = `${normalized}`;
  const cached = nip05Cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      verified: cached.verified && cached.pubkey?.toLowerCase() === pubkey.toLowerCase(),
      handle: cached.verified ? normalized : null,
    };
  }

  const [name, domain] = normalized.split("@");
  if (!domain) {
    return { verified: false, handle: null };
  }

  const targetUrl =
    name === "_"
      ? `https://${domain}/.well-known/nostr.json`
      : `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NIP05_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(targetUrl, { signal: controller.signal, headers: { accept: "application/json" } });
  } catch {
    nip05Cache.set(cacheKey, {
      expiresAt: Date.now() + NIP05_TTL_MS,
      verified: false,
      pubkey: null,
    });
    clearTimeout(timeout);
    return { verified: false, handle: null };
  }

  clearTimeout(timeout);

  if (!response.ok) {
    nip05Cache.set(cacheKey, {
      expiresAt: Date.now() + NIP05_TTL_MS,
      verified: false,
      pubkey: null,
    });
    return { verified: false, handle: null };
  }

  try {
    const payload = (await response.json()) as { names?: Record<string, string> };
    const names = payload?.names;
    if (!names) {
      nip05Cache.set(cacheKey, {
        expiresAt: Date.now() + NIP05_TTL_MS,
        verified: false,
        pubkey: null,
      });
      return { verified: false, handle: null };
    }
    const candidate = name === "_" ? names["_"] : names[name];
    const matches = typeof candidate === "string" && candidate.toLowerCase() === pubkey.toLowerCase();
    nip05Cache.set(cacheKey, {
      expiresAt: Date.now() + NIP05_TTL_MS,
      verified: matches,
      pubkey: matches ? pubkey : null,
    });
    return {
      verified: matches,
      handle: matches ? normalized : null,
    };
  } catch {
    nip05Cache.set(cacheKey, {
      expiresAt: Date.now() + NIP05_TTL_MS,
      verified: false,
      pubkey: null,
    });
    return { verified: false, handle: null };
  }
};

const buildAuthorInfo = async (
  pubkey: string,
  pointerRelays: readonly string[] | undefined
): Promise<NostrProfileResponse["profile"] & { pubkey: string } | null> => {
  const relays = mergeRelayHints(pointerRelays, DEFAULT_RELAYS);
  const metadataEvent = await fetchSingleEvent(
    relays,
    { kinds: [0], authors: [pubkey] },
    PROFILE_FETCH_TIMEOUT_MS
  );

  const parsed = parseProfileContent(metadataEvent?.content ?? null);
  const { verified, handle } = await verifyNip05(pubkey, parsed.nip05);
  const name = parsed.displayName ?? parsed.name ?? toShortNpub(pubkey);

  return {
    pubkey,
    name,
    handle,
    about: clampText(parsed.about, MAX_PROFILE_ABOUT_LENGTH),
    avatar: proxyImageUrl(parsed.picture),
    banner: proxyImageUrl(parsed.banner),
    verifiedNip05: verified,
  };
};

const buildNoteResponse = async (
  parsed: ParsedNotePointer
): Promise<{ readonly data: NostrCardResponse; readonly ttl: number }> => {
  const relays = mergeRelayHints(parsed.pointer.relays, DEFAULT_RELAYS);
  const event = await fetchSingleEvent(
    relays,
    { ids: [parsed.pointer.id] },
    NOTE_FETCH_TIMEOUT_MS
  );

  if (!event) {
    return {
      data: {
        type: "nostr.unavailable",
        message: "Unavailable on Nostr",
        links: { open: parsed.openUrl ?? parsed.canonicalUrl ?? null },
      },
      ttl: NOTE_CACHE_TTL_MS,
    };
  }

  const authorInfo = await buildAuthorInfo(event.pubkey, parsed.pointer.relays);
  const text = clampText(event.content ?? null, MAX_NOTE_TEXT_LENGTH);
  const images = text ? extractImageUrls(text) : [];

  return {
    data: {
      type: "nostr.note",
      canonicalUrl: parsed.canonicalUrl,
      pointer: {
        id: parsed.pointer.id,
        relays: normalizeRelays(parsed.pointer.relays),
      },
      author: authorInfo
        ? {
            pubkey: authorInfo.pubkey,
            name: authorInfo.name,
            handle: authorInfo.handle,
            avatar: authorInfo.avatar,
            verifiedNip05: authorInfo.verifiedNip05,
          }
        : null,
      createdAt: sanitizeCreatedAt(event.created_at),
      text,
      images: images
        .map((imageUrl) => proxyImageUrl(imageUrl))
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ url, alt: authorInfo?.name ? `Image from ${authorInfo.name}'s note` : "Image from note" })),
      labels: extractLabels(event.tags),
      links: { open: parsed.openUrl ?? parsed.canonicalUrl ?? `https://snort.social/e/${parsed.pointer.id}` },
    },
    ttl: NOTE_CACHE_TTL_MS,
  };
};

const buildProfileResponse = async (
  parsed: ParsedProfilePointer
): Promise<{ readonly data: NostrCardResponse; readonly ttl: number }> => {
  const relays = mergeRelayHints(parsed.pointer.relays, DEFAULT_RELAYS);
  const event = await fetchSingleEvent(
    relays,
    { kinds: [0], authors: [parsed.pointer.pubkey] },
    PROFILE_FETCH_TIMEOUT_MS
  );

  const parsedProfile = parseProfileContent(event?.content ?? null);
  const { verified, handle } = await verifyNip05(parsed.pointer.pubkey, parsedProfile.nip05);

  const profile = {
    name: parsedProfile.displayName ?? parsedProfile.name ?? toShortNpub(parsed.pointer.pubkey),
    handle,
    about: clampText(parsedProfile.about, MAX_PROFILE_ABOUT_LENGTH),
    avatar: proxyImageUrl(parsedProfile.picture),
    banner: proxyImageUrl(parsedProfile.banner),
    verifiedNip05: verified,
  };

  return {
    data: {
      type: "nostr.profile",
      canonicalUrl: parsed.canonicalUrl ?? `https://snort.social/p/${parsed.pointer.pubkey}`,
      pointer: {
        pubkey: parsed.pointer.pubkey,
        relays: normalizeRelays(parsed.pointer.relays),
      },
      profile,
    },
    ttl: PROFILE_CACHE_TTL_MS,
  };
};

const buildArticleResponse = async (
  parsed: ParsedArticlePointer
): Promise<{ readonly data: NostrCardResponse; readonly ttl: number }> => {
  const relays = mergeRelayHints(parsed.pointer.relays, DEFAULT_RELAYS);
  const event = await fetchSingleEvent(
    relays,
    {
      kinds: [30023],
      authors: [parsed.pointer.pubkey],
      "#d": [parsed.pointer.identifier],
    },
    ARTICLE_FETCH_TIMEOUT_MS
  );

  if (!event) {
    return {
      data: {
        type: "nostr.unavailable",
        message: "Article unavailable on Nostr",
        links: { open: parsed.openUrl ?? parsed.canonicalUrl ?? null },
      },
      ttl: ARTICLE_CACHE_TTL_MS,
    };
  }

  const authorInfo = await buildAuthorInfo(event.pubkey, parsed.pointer.relays);

  const titleTag = event.tags.find((tag) => Array.isArray(tag) && tag[0] === "title");
  const summaryTag = event.tags.find((tag) => Array.isArray(tag) && tag[0] === "summary");
  const imageTag = event.tags.find((tag) => Array.isArray(tag) && tag[0] === "image");

  const title = titleTag && titleTag[1] ? titleTag[1] : null;
  const summary = summaryTag && summaryTag[1] ? summaryTag[1] : null;
  const imageUrl = imageTag && imageTag[1] ? imageTag[1] : null;

  const openUrl = parsed.openUrl ?? `https://primal.net/e/${event.id}`;

  return {
    data: {
      type: "nostr.article",
      canonicalUrl: parsed.canonicalUrl ?? openUrl,
      pointer: {
        kind: 30023,
        pubkey: parsed.pointer.pubkey,
        identifier: parsed.pointer.identifier,
        relays: normalizeRelays(parsed.pointer.relays),
      },
      author: authorInfo
        ? {
            pubkey: authorInfo.pubkey,
            name: authorInfo.name,
            handle: authorInfo.handle,
            avatar: authorInfo.avatar,
            verifiedNip05: authorInfo.verifiedNip05,
          }
        : null,
      article: {
        title: clampText(title, 280) ?? null,
        summary: clampText(summary ?? event.content ?? null, MAX_ARTICLE_SUMMARY_LENGTH),
        image: proxyImageUrl(imageUrl),
      },
      createdAt: sanitizeCreatedAt(event.created_at),
      links: { open: openUrl },
    },
    ttl: ARTICLE_CACHE_TTL_MS,
  };
};

export interface NostrHandlerResult {
  readonly handled: boolean;
  readonly cacheKey?: string;
  readonly data?: LinkPreviewResponse;
  readonly ttl?: number;
}

export const tryHandleNostrRequest = async (
  input: string
): Promise<NostrHandlerResult> => {
  const parsed = parsePointer(input);
  if (!parsed) {
    return { handled: false };
  }

  if (parsed.type === "secret") {
    return {
      handled: true,
      cacheKey: SECRET_CACHE_KEY,
      ttl: SECRET_CACHE_TTL_MS,
      data: {
        type: "nostr.secret_redacted",
        message: "A private key (nsec) was detected and has been redacted.",
      },
    };
  }

  try {
    if (parsed.type === "note") {
      const { data, ttl } = await buildNoteResponse(parsed);
      return {
        handled: true,
        cacheKey: parsed.cacheKey,
        ttl,
        data,
      };
    }

    if (parsed.type === "profile") {
      const { data, ttl } = await buildProfileResponse(parsed);
      return {
        handled: true,
        cacheKey: parsed.cacheKey,
        ttl,
        data,
      };
    }

    if (parsed.type === "article") {
      const { data, ttl } = await buildArticleResponse(parsed);
      return {
        handled: true,
        cacheKey: parsed.cacheKey,
        ttl,
        data,
      };
    }
  } catch {
    const fallbackOpenUrl =
      "openUrl" in parsed && typeof parsed.openUrl === "string"
        ? parsed.openUrl
        : null;

    return {
      handled: true,
      cacheKey: "cacheKey" in parsed ? parsed.cacheKey : "nostr:error",
      ttl: NOTE_CACHE_TTL_MS,
      data: {
        type: "nostr.unavailable",
        message: "Unable to load Nostr content",
        links: fallbackOpenUrl ? { open: fallbackOpenUrl } : undefined,
      },
    };
  }

  return { handled: false };
};
