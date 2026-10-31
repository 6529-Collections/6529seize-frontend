import { getE2eeErrorCode } from "@/components/e2ee/e2eeErrors";
import { MAX_BLOB_BYTES } from "@/lib/e2ee/media";
import type { E2eeEngine, E2eeImported } from "@/lib/e2ee/types";
import type { LegacyDmItem } from "./legacyDmExport";

/**
 * Moves an unencrypted DM's history into an encrypted chat with the same
 * people (D146), from the member's own browser: it reads what the API
 * already shows them, oldest first, and sends each message through the
 * engine as an imported message (labelled, never verified). Images and
 * files are fetched and re-uploaded as encrypted attachments through the
 * engine's blob store, whatever backs it.
 *
 * It resumes by itself: anything already in the chat (from this member, an
 * earlier run, or another member's import) is skipped by its original id.
 */

/** Text per imported message, below the 10,000-character payload limit. */
export const IMPORT_TEXT_CHUNK = 9_000;
/** Encrypted attachments per message (contract section 6). */
const MAX_FILES_PER_MESSAGE = 10;
/** About 85 messages a minute per device, under the 120 a minute limit. */
const IMPORT_PACING_MS = 700;

interface LegacyImportUnit {
  readonly item: LegacyDmItem;
  /** Index of this message among the original's imported messages. */
  readonly part: number;
  readonly text: string;
  /** Media of the original that ride on this message. */
  readonly media: readonly { url: string; name: string; mime: string }[];
}

export interface LegacyImportProgress {
  readonly total: number;
  readonly sent: number;
  readonly skipped: number;
  readonly failed: number;
  readonly mediaMoved: number;
  readonly mediaNotMoved: number;
}

type LegacyImportOutcome =
  | "done"
  | "cancelled"
  /** The blob upload quota is used up; continue later. */
  | "paused";

export interface LegacyImportResult extends LegacyImportProgress {
  readonly outcome: LegacyImportOutcome;
}

export interface LegacyImportDeps {
  readonly engine: Pick<
    E2eeEngine,
    "sendImported" | "getMessages" | "getAttachmentsEnabled"
  >;
  readonly fetchMedia: (url: string, signal: AbortSignal) => Promise<Blob>;
  readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;
}

/** Code-point-safe split; never cuts a surrogate pair. */
export function chunkText(text: string, size: number): string[] {
  const chars = [...text];
  if (chars.length <= size) {
    return [text];
  }
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += size) {
    out.push(chars.slice(i, i + size).join(""));
  }
  return out;
}

function fileName(url: string, fallback: string): string {
  try {
    const last = new URL(url).pathname.split("/").pop();
    return last ? decodeURIComponent(last).slice(0, 200) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * One original drop becomes one message per part, more when a part's text
 * is long. Media ride on the first message of their part.
 */
export function planLegacyImport(
  items: readonly LegacyDmItem[]
): LegacyImportUnit[] {
  const units: LegacyImportUnit[] = [];
  for (const item of items) {
    let part = 0;
    item.parts.forEach((legacyPart, index) => {
      const titled =
        index === 0 && item.title
          ? `${item.title}\n\n${legacyPart.text}`
          : legacyPart.text;
      const media = [
        ...legacyPart.media.map((m) => ({
          url: m.url,
          name: fileName(m.url, "image"),
          mime: m.mime_type,
        })),
        ...legacyPart.attachments
          .filter((a) => a.url !== null)
          .map((a) => ({
            url: a.url as string,
            name: a.file_name,
            mime: a.mime_type,
          })),
      ];
      chunkText(titled, IMPORT_TEXT_CHUNK).forEach((text, chunkIndex) => {
        units.push({
          item,
          part,
          text,
          media: chunkIndex === 0 ? media : [],
        });
        part += 1;
      });
    });
    if (part === 0) {
      units.push({ item, part: 0, text: item.title ?? "", media: [] });
    }
  }
  return units;
}

/** Attachments present in the original that no import carries. */
function missingAttachments(item: LegacyDmItem): number {
  return item.parts.reduce(
    (sum, part) => sum + part.attachments.filter((a) => a.url === null).length,
    0
  );
}

const unitKey = (dropId: string, part: number): string => `${dropId}#${part}`;

const isQuotaError = (error: unknown): boolean =>
  getE2eeErrorCode(error) === "E2EE_RATE_LIMITED" ||
  (typeof error === "object" &&
    error !== null &&
    (error as { status?: unknown }).status === 429);

async function collectFiles(
  unit: LegacyImportUnit,
  deps: LegacyImportDeps,
  signal: AbortSignal
): Promise<{ files: File[]; notMoved: number }> {
  if (!deps.engine.getAttachmentsEnabled()) {
    return { files: [], notMoved: unit.media.length };
  }
  const files: File[] = [];
  let notMoved = 0;
  for (const media of unit.media) {
    if (files.length >= MAX_FILES_PER_MESSAGE) {
      notMoved += 1;
      continue;
    }
    try {
      const blob = await deps.fetchMedia(media.url, signal);
      if (blob.size > MAX_BLOB_BYTES - 64 * 1024) {
        notMoved += 1;
        continue;
      }
      files.push(
        new File([blob], media.name, { type: blob.type || media.mime })
      );
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      notMoved += 1;
    }
  }
  return { files, notMoved };
}

function importedFor(
  waveId: string,
  unit: LegacyImportUnit,
  notMoved: number
): E2eeImported {
  const { item } = unit;
  return {
    waveId,
    dropId: item.legacy_drop_id,
    part: unit.part,
    serialNo: item.serial_no,
    authorProfileId: item.author.profile_id,
    authorHandle: item.author.handle,
    createdAt: item.created_at,
    editedAt: item.updated_at,
    replyToDropId: item.reply_to,
    mediaNotImported:
      notMoved + (unit.part === 0 ? missingAttachments(item) : 0),
    reactions:
      unit.part === 0
        ? item.reactions
            .slice(0, 50)
            .map((r) => [r.reaction, r.profile_ids.length])
        : [],
  };
}

type SendStep = "sent" | "sentWithoutMedia" | "failed" | "paused";

/**
 * Sends one message. If its attachments are refused (other than by the
 * daily quota, which pauses the run), the text still goes, with the media
 * counted as not moved.
 */
async function sendUnit(
  deps: LegacyImportDeps,
  g: string,
  input: {
    readonly text: string;
    readonly reply: string | null;
    readonly files: File[];
    readonly imported: (missingMedia: number) => E2eeImported;
  }
): Promise<SendStep> {
  const attempt = async (files: File[]) =>
    deps.engine.sendImported(g, {
      text: input.text,
      reply: input.reply,
      files,
      imported: input.imported(input.files.length - files.length),
    });
  try {
    await attempt(input.files);
    return "sent";
  } catch (error) {
    if (isQuotaError(error)) {
      return "paused";
    }
    if (input.files.length === 0) {
      return "failed";
    }
  }
  try {
    await attempt([]);
    return "sentWithoutMedia";
  } catch (error) {
    return isQuotaError(error) ? "paused" : "failed";
  }
}

export async function runLegacyDmImport(input: {
  readonly g: string;
  readonly waveId: string;
  readonly items: readonly LegacyDmItem[];
  readonly deps: LegacyImportDeps;
  readonly signal: AbortSignal;
  readonly onProgress?: ((progress: LegacyImportProgress) => void) | undefined;
  readonly pacingMs?: number | undefined;
}): Promise<LegacyImportResult> {
  const { g, waveId, deps, signal } = input;
  const units = planLegacyImport(input.items);
  const present = new Set<string>();
  const messageIdByDrop = new Map<string, string>();
  const index = () => {
    for (const message of deps.engine.getMessages(g)) {
      const imported = message.imported;
      if (imported?.waveId === waveId && !message.deleted) {
        present.add(unitKey(imported.dropId, imported.part));
        if (imported.part === 0) {
          messageIdByDrop.set(imported.dropId, message.id);
        }
      }
    }
  };
  // Replies point at the encrypted copy of their target once it exists.
  const replyFor = (dropId: string | null): string | null => {
    if (!dropId) {
      return null;
    }
    if (!messageIdByDrop.has(dropId)) {
      index();
    }
    return messageIdByDrop.get(dropId) ?? null;
  };
  index();
  const progress = {
    total: units.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    mediaMoved: 0,
    mediaNotMoved: 0,
  };
  const report = () => input.onProgress?.({ ...progress });
  report();
  for (const unit of units) {
    if (signal.aborted) {
      return { ...progress, outcome: "cancelled" };
    }
    if (present.has(unitKey(unit.item.legacy_drop_id, unit.part))) {
      progress.skipped += 1;
      report();
      continue;
    }
    const { files, notMoved } = await collectFiles(unit, deps, signal);
    const reply = unit.part === 0 ? replyFor(unit.item.reply_to) : null;
    const step = await sendUnit(deps, g, {
      text: unit.text,
      reply,
      files,
      imported: (missing) => importedFor(waveId, unit, notMoved + missing),
    });
    if (step === "paused") {
      report();
      return { ...progress, outcome: "paused" };
    }
    if (step === "failed") {
      progress.failed += 1;
    } else {
      progress.sent += 1;
      const moved = step === "sent" ? files.length : 0;
      progress.mediaMoved += moved;
      progress.mediaNotMoved += notMoved + files.length - moved;
    }
    report();
    await deps
      .sleep(input.pacingMs ?? IMPORT_PACING_MS, signal)
      .catch(() => undefined);
  }
  return { ...progress, outcome: signal.aborted ? "cancelled" : "done" };
}

/** Browser defaults: CDN fetch (as media downloads do) and an abortable wait. */
export const browserImportIo: Pick<LegacyImportDeps, "fetchMedia" | "sleep"> = {
  fetchMedia: async (url, signal) => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`media ${response.status}`);
    }
    return response.blob();
  },
  sleep: (ms, signal) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    }),
};
