import { getE2eeErrorCode } from "@/components/e2ee/e2eeErrors";
import { safeAttachmentName } from "@/lib/e2ee/attachment-name";
import { ciphertextSize, MAX_BLOB_BYTES } from "@/lib/e2ee/media";
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
  /** Larger than one encrypted attachment can be, after encryption. */
  readonly mediaTooLarge: number;
  /** Could not be fetched, attachments are off, or the upload was refused. */
  readonly mediaNotMoved: number;
}

/**
 * Why a run stopped before the end. `rate`: the blob store's daily upload
 * limit (continue later). `storage`: the encrypted attachment storage is
 * full (continue later or without media).
 */
export type LegacyImportPause = "rate" | "storage";

export type LegacyImportResult = LegacyImportProgress &
  (
    | { readonly outcome: "done" | "cancelled" }
    | { readonly outcome: "paused"; readonly pause: LegacyImportPause }
  );

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

function nameFromUrl(url: string, fallback: string): string {
  try {
    const last = new URL(url).pathname.split("/").pop() ?? "";
    return safeAttachmentName(decodeURIComponent(last), fallback);
  } catch {
    return fallback;
  }
}

/** Groups of at most `size`, at least one (possibly empty) group. */
function groupsOf<T>(values: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < values.length; i += size) {
    out.push(values.slice(i, i + size));
  }
  return out.length > 0 ? out : [[]];
}

/**
 * One original drop becomes one message per part, more when a part's text
 * is long or it has more than 10 images and files (the per-message limit):
 * the extra media ride on follow-up messages of the same part, so none is
 * left behind for the count alone.
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
          name: nameFromUrl(m.url, "image"),
          mime: m.mime_type,
        })),
        ...legacyPart.attachments.flatMap((a) =>
          a.url === null
            ? []
            : [
                {
                  url: a.url,
                  name: safeAttachmentName(a.file_name, "file"),
                  mime: a.mime_type,
                },
              ]
        ),
      ];
      const texts = chunkText(titled, IMPORT_TEXT_CHUNK);
      const mediaGroups = groupsOf(media, MAX_FILES_PER_MESSAGE);
      const count = Math.max(texts.length, mediaGroups.length);
      for (let i = 0; i < count; i += 1) {
        units.push({
          item,
          part,
          text: texts[i] ?? "",
          media: mediaGroups[i] ?? [],
        });
        part += 1;
      }
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

/**
 * Whether a file fits one encrypted attachment. The engine encrypts the
 * file's exact bytes (no re-encoding) in AES-GCM chunks, adding a 16-byte
 * tag per chunk, and the store caps the ciphertext at MAX_BLOB_BYTES; this
 * is the same `ciphertextSize` check the engine applies, so nothing that
 * passes here is refused for size.
 */
export const fitsEncryptedAttachment = (plaintextBytes: number): boolean =>
  ciphertextSize(plaintextBytes) <= MAX_BLOB_BYTES;

/**
 * Upload failures that stop the run instead of dropping media. Blob API
 * errors reach the caller unchanged from `sendImported` (E2eeApiError with
 * the server's code and status): the daily upload limit is
 * `E2EE_RATE_LIMITED` / 429, and a full attachment store is a server
 * `E2EE_TOO_LARGE` (413) for a file that already passed the size check.
 */
export function pauseReason(error: unknown): LegacyImportPause | null {
  const code = getE2eeErrorCode(error);
  const status =
    typeof error === "object" && error !== null
      ? (error as { status?: unknown }).status
      : undefined;
  if (code === "E2EE_RATE_LIMITED" || status === 429) {
    return "rate";
  }
  if (code === "E2EE_TOO_LARGE" || status === 413) {
    return "storage";
  }
  return null;
}

interface CollectedFiles {
  readonly files: File[];
  readonly tooLarge: number;
  readonly notMoved: number;
}

async function collectFiles(
  unit: LegacyImportUnit,
  deps: LegacyImportDeps,
  skipMedia: boolean,
  signal: AbortSignal
): Promise<CollectedFiles> {
  if (skipMedia || !deps.engine.getAttachmentsEnabled()) {
    return { files: [], tooLarge: 0, notMoved: unit.media.length };
  }
  const files: File[] = [];
  let tooLarge = 0;
  let notMoved = 0;
  // planLegacyImport keeps every unit within MAX_FILES_PER_MESSAGE.
  for (const media of unit.media) {
    try {
      const blob = await deps.fetchMedia(media.url, signal);
      if (!fitsEncryptedAttachment(blob.size)) {
        tooLarge += 1;
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
  return { files, tooLarge, notMoved };
}

function importedFor(
  waveId: string,
  unit: LegacyImportUnit,
  notImported: number
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
      notImported + (unit.part === 0 ? missingAttachments(item) : 0),
    reactions:
      unit.part === 0
        ? item.reactions
            .slice(0, 50)
            .map((r) => [r.reaction, r.profile_ids.length])
        : [],
  };
}

type SendStep =
  | { readonly kind: "sent" | "sentWithoutMedia" | "failed" }
  | { readonly kind: "paused"; readonly pause: LegacyImportPause };

/**
 * Sends one message. Quota and storage refusals pause the run so no media
 * is dropped; any other refusal of the attachments still sends the text,
 * with the media counted as not moved.
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
    return { kind: "sent" };
  } catch (error) {
    const pause = pauseReason(error);
    if (pause) {
      return { kind: "paused", pause };
    }
    // Codes only: never the message text or file names.
    console.warn(
      "Legacy DM import: send refused",
      getE2eeErrorCode(error) ?? "unknown",
      input.files.length > 0 ? "retrying without attachments" : ""
    );
    if (input.files.length === 0) {
      return { kind: "failed" };
    }
  }
  try {
    await attempt([]);
    return { kind: "sentWithoutMedia" };
  } catch (error) {
    const pause = pauseReason(error);
    return pause ? { kind: "paused", pause } : { kind: "failed" };
  }
}

type MutableProgress = { -readonly [K in keyof LegacyImportProgress]: number };

function recordStep(
  progress: MutableProgress,
  kind: "sent" | "sentWithoutMedia" | "failed",
  collected: CollectedFiles
): void {
  if (kind === "failed") {
    progress.failed += 1;
    return;
  }
  const moved = kind === "sent" ? collected.files.length : 0;
  progress.sent += 1;
  progress.mediaMoved += moved;
  progress.mediaTooLarge += collected.tooLarge;
  progress.mediaNotMoved += collected.notMoved + collected.files.length - moved;
}

export async function runLegacyDmImport(input: {
  readonly g: string;
  readonly waveId: string;
  readonly items: readonly LegacyDmItem[];
  readonly deps: LegacyImportDeps;
  readonly signal: AbortSignal;
  readonly onProgress?: ((progress: LegacyImportProgress) => void) | undefined;
  readonly pacingMs?: number | undefined;
  /** Move text only (after the attachment storage filled up). */
  readonly skipMedia?: boolean | undefined;
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
    mediaTooLarge: 0,
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
    const collected = await collectFiles(
      unit,
      deps,
      input.skipMedia === true,
      signal
    );
    const step = await sendUnit(deps, g, {
      text: unit.text,
      reply: unit.part === 0 ? replyFor(unit.item.reply_to) : null,
      files: collected.files,
      imported: (missing) =>
        importedFor(
          waveId,
          unit,
          collected.tooLarge + collected.notMoved + missing
        ),
    });
    if (step.kind === "paused") {
      report();
      return { ...progress, outcome: "paused", pause: step.pause };
    }
    recordStep(progress, step.kind, collected);
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
