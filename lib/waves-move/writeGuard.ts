import { getBrowserLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isWavesWritePaused } from "./schedule";
import { isKnownMovingWave, waveOfKnownDrop } from "./scope";

const READ_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"]);

const COMPETITION_ACTIONS: ReadonlySet<string> = new Set([
  "publish",
  "pause",
  "resume",
  "archive",
  "clone",
]);

const parseBody = (body: unknown): Record<string, unknown> | null => {
  if (typeof body !== "string") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

/**
 * A new drop is an entry when its type is anything but CHAT, and it creates a
 * poll when it carries one. Chat drops, replies, edits and reactions stay on
 * 6529.io and keep working.
 */
const isEntryOrPollDrop = (body: unknown): boolean => {
  const parsed = parseBody(body);
  if (parsed === null) {
    return false;
  }
  const dropType = parsed["drop_type"];
  const isEntry =
    typeof dropType === "string" && dropType.toUpperCase() !== "CHAT";
  const poll = parsed["poll"];
  return isEntry || (typeof poll === "object" && poll !== null);
};

const isLegacyWaveWrite = (
  method: string,
  segments: readonly string[]
): boolean => {
  const [, waveId, leaf, subLeaf] = segments;
  if (segments.length === 1) {
    // POST waves: a new wave.
    return true;
  }
  if (waveId === "direct-message") {
    // Direct messages are chat.
    return false;
  }
  if (segments.length === 2) {
    // A wave's own edit. Its deletion can't be told from a direct
    // message's by the path; the delete control checks the wave's type.
    return method !== "DELETE";
  }
  // waves/{id}/rep/rating: wave REP. The other `waves/{id}/...` writes
  // (mute, pins, pinned drop, curations) are personal settings or display
  // state that stay off the 6529 Network.
  return leaf === "rep" && subLeaf === "rating" && segments.length === 4;
};

/**
 * `v3/waves[/{wave}[/competitions[/{competition}[/...]]]]`: a new wave, a
 * wave's settings, and a decision's creation, settings, actions, entries and
 * votes. Validation requests stay open.
 */
const isV3WaveWrite = (segments: readonly string[]): boolean => {
  const [, root, , collection, , leaf, action, ...rest] = segments;
  if (root !== "waves") {
    return false;
  }
  if (segments.length <= 3) {
    return true;
  }
  if (collection !== "competitions") {
    return false;
  }
  if (segments.length <= 5) {
    return true;
  }
  if (leaf === "actions") {
    return (
      segments.length === 7 &&
      action !== undefined &&
      COMPETITION_ACTIONS.has(action)
    );
  }
  if (leaf === "entries") {
    // .../entries, or .../entries/{entry}/votes/me
    return (
      segments.length === 6 ||
      (segments.length === 9 && rest[0] === "votes" && rest[1] === "me")
    );
  }
  return false;
};

const isV2Write = (segments: readonly string[], body: unknown): boolean => {
  const [, root, id, leaf, subLeaf] = segments;
  if (root === "drops") {
    if (segments.length === 2) {
      return isEntryOrPollDrop(body);
    }
    // v2/drops/{id}/poll/vote
    return (
      segments.length === 5 &&
      id !== undefined &&
      leaf === "poll" &&
      subLeaf === "vote"
    );
  }
  // v2/waves/{id}/metadata[/{metadataId}]: a wave's custom rules.
  return (
    root === "waves" &&
    leaf === "metadata" &&
    (segments.length === 4 || segments.length === 5)
  );
};

/**
 * The browser's guard is a convenience: the 6529.io API's own freeze decides
 * what is accepted.
 *
 * Whether a request changes a vote, an entry, a poll or its ballot, wave REP,
 * a wave's settings, or a decision. These move to the 6529 Network, and from
 * the freeze 6529.io refuses them. Chat drops, edits, deletions, reactions,
 * curations, pins, boosts, mutes and direct messages are not affected.
 * `segments` are the path segments after `/api/`.
 *
 * Group writes go through: direct-message preferences, the network page's
 * filters and curation setup create groups too, and a new group can't reach a
 * wave or a decision while their edits are refused.
 *
 * Withdrawing an entry is a deletion of its drop, and deleting a wave looks
 * like deleting a direct message; the path alone can't tell them apart, so
 * the delete controls check the drop's or the wave's type.
 */
const isWavesWrite = (
  method: string,
  segments: readonly string[],
  body: unknown
): boolean => {
  const [root] = segments;
  if (root === undefined) {
    return false;
  }
  switch (root) {
    case "drops":
      if (segments.length === 1) {
        return isEntryOrPollDrop(body);
      }
      // drops/{id}/ratings is a vote on an entry, or a rating of a chat drop,
      // which stays on this site; the path can't tell them apart, so the
      // vote controls check the drop's type.
      return false;
    case "waves":
      return isLegacyWaveWrite(method, segments);
    case "v2":
      return isV2Write(segments, body);
    case "v3":
      return isV3WaveWrite(segments);
    default:
      return false;
  }
};

/**
 * Whether a paused write's wave moves: a new wave does; any other write only
 * when a page has read its wave as moving. A wave that stays on 6529.io, or
 * one the site hasn't read, keeps its writes, and 6529.io's API decides.
 */
const isMovingWaveWrite = (
  segments: readonly string[],
  body: unknown
): boolean => {
  const [root, second, third] = segments;
  if (root === undefined) {
    return false;
  }
  const bodyWave = (): string | null => {
    const waveId = parseBody(body)?.["wave_id"];
    return typeof waveId === "string" ? waveId : null;
  };
  switch (root) {
    case "drops":
      return isKnownMovingWave(bodyWave());
    case "waves":
      return segments.length === 1 || isKnownMovingWave(second);
    case "v2":
      if (second !== "drops") {
        return isKnownMovingWave(third);
      }
      // v2/drops (a new drop) names its wave; v2/drops/{id}/... its drop.
      return isKnownMovingWave(
        third === undefined ? bodyWave() : waveOfKnownDrop(third)
      );
    case "v3":
      return segments.length === 2 || isKnownMovingWave(third);
    default:
      return false;
  }
};

const getApiPathSegments = (url: string): string[] | null => {
  let pathname: string;
  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    return null;
  }
  const [prefix, ...segments] = pathname.split("/").filter(Boolean);
  return prefix === "api" && segments.length > 0 ? segments : null;
};

export class WavesWritePausedError extends Error {
  /**
   * As the API answers a frozen write (423 Locked): callers read it as a
   * definite refusal, so nothing is retried or kept to resend.
   */
  readonly status = 423;

  constructor() {
    super(t(getBrowserLocale(), "wavesMove.paused"));
    this.name = "WavesWritePausedError";
  }
}

/**
 * Throws `WavesWritePausedError`, without sending anything, for a vote, entry,
 * poll, wave REP, wave or decision write while 6529.io's own routes for
 * them are closed for the move to the 6529 Network. Reads and every other
 * route are sent as before.
 */
export function assertWavesWriteAllowed(request: {
  readonly url: string;
  readonly method: string;
  readonly body?: unknown;
}): void {
  // Nothing is paused (the usual case, and every build without the two
  // times): no path or body is read.
  if (!isWavesWritePaused() || READ_METHODS.has(request.method.toUpperCase())) {
    return;
  }
  const segments = getApiPathSegments(request.url);
  if (
    segments !== null &&
    isWavesWrite(request.method.toUpperCase(), segments, request.body) &&
    isMovingWaveWrite(segments, request.body)
  ) {
    throw new WavesWritePausedError();
  }
}
