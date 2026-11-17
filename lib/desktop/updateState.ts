/**
 * 6529 Desktop's update state, as the app reports it (`updater.getState()`
 * and the `update-state` event, from auto-installing builds). The app owns
 * the words: `label` is the release standard's short label and `headline`
 * its filled-in sentence (states U1-U14). The website shows them as text and
 * picks the look and the buttons from the id.
 */

const STATE_IDS = [
  "U1",
  "U2",
  "U3",
  "U4",
  "U5",
  "U6",
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
] as const;

export type DesktopUpdateStateId = (typeof STATE_IDS)[number];

export interface DesktopUpdateState {
  readonly id: DesktopUpdateStateId;
  /** The state's name, e.g. `available`, `checking`, `went_back`. */
  readonly state: string;
  /** Short label for the title strip mark, or null for none. */
  readonly label: string | null;
  /** The standard's sentence for this state, filled in by the app. */
  readonly headline: string;
  /** The version that runs now. */
  readonly running: string | null;
  /** The release the state is about, when there is one. */
  readonly version: string | null;
  /** "Check for new releases". */
  readonly check: boolean;
  /** "Install updates automatically". */
  readonly auto: boolean;
  /** Whether this install can update by itself (else: no switches). */
  readonly canInstall: boolean;
  readonly cannotInstallWhy: string | null;
  /** Last check, unix seconds. */
  readonly checkedAt: number | null;
  /** Extra sentence after the headline (U4: automatic updates are off). */
  readonly note: string | null;
}

const MAX_TEXT = 400;
const MAX_LABEL = 40;
const VERSION = /^[\w.+-]{1,64}$/;
/** Words from the app are drawn as text; controls and line breaks are refused. */
function hasControl(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
    if (code === 0x2028 || code === 0x2029) return true;
  }
  return false;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Plain one-line text from the app, at most `max` characters, or null. */
export function readDesktopUpdateText(
  value: unknown,
  max: number
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max && !hasControl(text)
    ? text
    : null;
}

const readVersion = (value: unknown): string | null =>
  typeof value === "string" && VERSION.test(value) ? value : null;

/** The last second a JavaScript Date can hold (8.64e15 ms). */
const MAX_DATE_SECONDS = 8_640_000_000_000;

const readSeconds = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value > 0 &&
  value <= MAX_DATE_SECONDS
    ? value
    : null;

/**
 * A state the app reported, or null when it is not one (an unknown id, a
 * missing headline or switch, odd text): the website then shows nothing
 * rather than guessing.
 */
export function parseDesktopUpdateState(
  value: unknown
): DesktopUpdateState | null {
  if (!isRecord(value)) return null;
  const { id, check, auto, canInstall } = value;
  const headline = readDesktopUpdateText(value["headline"], MAX_TEXT);
  const state = readDesktopUpdateText(value["state"], 40);
  if (
    typeof id !== "string" ||
    !(STATE_IDS as readonly string[]).includes(id) ||
    headline === null ||
    state === null ||
    typeof check !== "boolean" ||
    typeof auto !== "boolean" ||
    typeof canInstall !== "boolean"
  ) {
    return null;
  }
  return {
    id: id as DesktopUpdateStateId,
    state,
    label: readDesktopUpdateText(value["label"], MAX_LABEL),
    headline,
    running: readVersion(value["running"]),
    version: readVersion(value["version"]),
    check,
    auto,
    canInstall,
    cannotInstallWhy: readDesktopUpdateText(
      value["cannotInstallWhy"],
      MAX_TEXT
    ),
    checkedAt: readSeconds(value["checkedAt"]),
    note: readDesktopUpdateText(value["note"], MAX_TEXT),
  };
}

/** How a state looks (release standard R54). */
type DesktopUpdateTone = "quiet" | "warning" | "alert";

export function desktopUpdateTone(id: DesktopUpdateStateId): DesktopUpdateTone {
  if (id === "U5" || id === "U12") return "alert";
  if (id === "U11" || id === "U14") return "warning";
  return "quiet";
}

/**
 * A time as the release standard writes it: `YYYY-MM-DD HH:MM UTC` (R58),
 * the same in every locale on purpose, so the app and the website say the
 * same time in the same words.
 */
export function formatDesktopUpdateTime(unixSeconds: number): string {
  const iso = new Date(unixSeconds * 1000).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
