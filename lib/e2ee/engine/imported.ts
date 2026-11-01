import {
  importedHeader,
  IMPORT_SOURCE,
  parseImported,
  type ImportedPayload,
} from "../imported-payload";
import type { StoredMessage } from "../records";
import type { E2eeImported } from "../types";
import type { GroupRuntime } from "./store";

/** Imported history (D146): payload mapping and the first-copy-wins rule. */

export function toImportedPayload(
  imported: E2eeImported,
  headerLength: number
): ImportedPayload {
  return {
    v: 1,
    src: IMPORT_SOURCE,
    w: imported.waveId,
    d: imported.dropId,
    p: imported.part,
    n: imported.serialNo,
    a: imported.authorProfileId,
    ah: imported.authorHandle,
    at: imported.createdAt,
    e: imported.editedAt,
    r: imported.replyToDropId,
    hl: headerLength,
    mx: imported.mediaNotImported,
    rx: imported.reactions.map(([reaction, count]) => [reaction, count]),
  };
}

/**
 * The importer chooses `at` and `e`, so neither may claim a time after the
 * import message itself (`importedAt`, its server time).
 */
export function fromImportedPayload(
  imp: ImportedPayload,
  importedAt: number
): E2eeImported {
  return {
    waveId: imp.w,
    dropId: imp.d,
    part: imp.p,
    serialNo: imp.n,
    authorProfileId: imp.a,
    authorHandle: imp.ah,
    createdAt: Math.min(imp.at, importedAt),
    editedAt: imp.e === null ? null : Math.min(imp.e, importedAt),
    replyToDropId: imp.r,
    mediaNotImported: imp.mx,
    reactions: imp.rx.map(([reaction, count]) => [reaction, count]),
  };
}

/** The text with its plain fallback header, and the header's length. */
export function importedText(
  imported: E2eeImported,
  text: string
): { text: string; headerLength: number } {
  const header = importedHeader({
    authorHandle: imported.authorHandle,
    createdAt: imported.createdAt,
  });
  return { text: `${header}${text}`, headerLength: header.length };
}

/** What a client that knows imports shows: the original text only. */
export function displayText(stored: StoredMessage): string {
  return stored.imported ? stored.text.slice(stored.imported.hl) : stored.text;
}

/** Validates an outgoing `imp` the way receivers will. */
export function isValidImported(imp: ImportedPayload, text: string): boolean {
  return parseImported(imp, text) !== null;
}

/**
 * True when another message in this chat already carries the same original
 * (wave, drop, part). Messages are applied in sequence order, so every
 * member keeps the same first copy.
 */
export function isDuplicateImport(
  runtime: GroupRuntime,
  messageId: string,
  imp: ImportedPayload
): boolean {
  for (const message of runtime.messages.values()) {
    const other = message.imported;
    if (
      other !== undefined &&
      message.id !== messageId &&
      !message.deleted &&
      other.d === imp.d &&
      other.p === imp.p &&
      other.w === imp.w
    ) {
      return true;
    }
  }
  return false;
}
