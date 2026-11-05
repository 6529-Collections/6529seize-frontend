"use client";

import { type ClipboardEvent, type KeyboardEvent, useState } from "react";
import type { MessageKey } from "@/i18n/messages";
import type { E2eeMember } from "@/lib/e2ee/types";
import {
  type ActiveMentionQuery,
  filterMentionCandidates,
  getActiveMentionQuery,
} from "./e2eeMentions";

export const E2EE_MAX_TEXT_LENGTH = 10_000;
const E2EE_MAX_FILES = 10;
/** Blob limit is 25 MiB of ciphertext; keep headroom for per-chunk tags. */
const E2EE_MAX_FILE_BYTES = 25 * 1024 * 1024 - 64 * 1024;
const E2EE_MAX_FILE_MB_LABEL = 25;

export interface ComposerError {
  readonly key: MessageKey;
  readonly params: Readonly<Record<string, string | number>>;
}

/** Adds chosen files within the count and size limits. */
export function addComposerFiles(
  current: readonly File[],
  incoming: readonly File[]
): { readonly files: File[]; readonly error: ComposerError | null } {
  const files = [...current];
  let error: ComposerError | null = null;
  for (const file of incoming) {
    if (file.size > E2EE_MAX_FILE_BYTES) {
      error = {
        key: "e2ee.composer.fileTooLarge",
        params: { name: file.name, max: E2EE_MAX_FILE_MB_LABEL },
      };
      continue;
    }
    if (files.length >= E2EE_MAX_FILES) {
      error = {
        key: "e2ee.composer.tooManyFiles",
        params: { max: E2EE_MAX_FILES },
      };
      break;
    }
    files.push(file);
  }
  return { files, error };
}

/** Name, size and type: what two views of one clipboard file share. */
const clipboardFileKey = (file: File): string =>
  JSON.stringify([file.name, file.size, file.type]);

/** Uses up one count of `key`; false when none was left. */
function takeMatch(counts: Map<string, number>, key: string): boolean {
  const remaining = counts.get(key) ?? 0;
  if (remaining > 0) {
    counts.set(key, remaining - 1);
  }
  return remaining > 0;
}

/**
 * The clipboard's files from both `files` and `items`. Chrome lists one
 * pasted file in both as separate objects, so an `items` file matching a
 * listed one is skipped once per match; any other `items` file is kept.
 */
function getClipboardFiles(data: DataTransfer): File[] {
  const files = Array.from(data.files);
  const unmatched = new Map<string, number>();
  for (const file of files) {
    const key = clipboardFileKey(file);
    unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
  }
  for (const item of Array.from(data.items)) {
    const file = item.kind === "file" ? item.getAsFile() : null;
    if (file && !takeMatch(unmatched, clipboardFileKey(file))) {
      files.push(file);
    }
  }
  return files;
}

/** Pasted images, which are attached like files picked with the attach control. */
function getPastedImages(data: DataTransfer | null): File[] {
  if (!data) {
    return [];
  }
  return getClipboardFiles(data).filter((file) =>
    file.type.toLowerCase().startsWith("image/")
  );
}

/** Composer text with the caret position to restore. */
export interface ComposerText {
  readonly text: string;
  readonly caret: number;
}

/** `text` with `start`..`end` replaced by `inserted`, caret after the insert. */
function insertComposerText(
  text: string,
  start: number,
  end: number,
  inserted: string
): ComposerText {
  // A textarea stores line breaks as "\n", as a native paste would.
  const normalized = inserted.replaceAll(/\r\n?/g, "\n");
  const before = text.slice(0, start);
  return {
    text: `${before}${normalized}${text.slice(end)}`,
    caret: before.length + normalized.length,
  };
}

export interface PasteNotice {
  /** Changes with every paste, so the same count is announced again. */
  readonly id: number;
  /** Pasted images that were added as attachments. */
  readonly count: number;
  /** The attachments right after the paste; any later change ends the notice. */
  readonly files: readonly File[];
}

/**
 * Paste into the composer: images are added with `addFiles`, the attach
 * control's path, and text pasted with them goes to `onText`. Any other
 * paste is left to the browser. The notice lasts until the attachments
 * change again (send, remove, pick, clear).
 */
export function usePastedImages({
  canAttach,
  files,
  addFiles,
  onText,
}: {
  readonly canAttach: boolean;
  /** The composer's attachments now. */
  readonly files: readonly File[];
  /** Adds files within the attach limits; returns the new attachments. */
  readonly addFiles: (files: readonly File[]) => readonly File[];
  readonly onText: (next: ComposerText) => void;
}): {
  readonly notice: PasteNotice | null;
  readonly onPaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
} {
  const [notice, setNotice] = useState<PasteNotice | null>(null);
  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const images = canAttach ? getPastedImages(event.clipboardData) : [];
    if (images.length === 0) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData.getData("text/plain");
    if (pasted) {
      const element = event.currentTarget;
      onText(
        insertComposerText(
          element.value,
          element.selectionStart,
          element.selectionEnd,
          pasted
        )
      );
    }
    const next = addFiles(images);
    // addComposerFiles only appends, so the growth is the images accepted.
    const added = next.length - files.length;
    setNotice((current) =>
      added > 0
        ? { id: (current?.id ?? 0) + 1, count: added, files: next }
        : null
    );
  };
  return { notice: notice?.files === files ? notice : null, onPaste };
}

interface MentionPicker {
  readonly query: ActiveMentionQuery | null;
  readonly candidates: readonly E2eeMember[];
  readonly open: boolean;
  readonly activeIndex: number;
  readonly update: (value: string, caret: number | null) => void;
  readonly close: () => void;
  readonly move: (delta: 1 | -1) => void;
  /** Text with the active `@query` replaced by the member's handle. */
  readonly apply: (
    text: string,
    member: E2eeMember
  ) => { readonly text: string; readonly caret: number } | null;
}

/** `@` mention suggestions over the chat's members. */
export function useMentionPicker(
  members: readonly E2eeMember[],
  selfProfileId: string | null
): MentionPicker {
  const [query, setQuery] = useState<ActiveMentionQuery | null>(null);
  const [index, setIndex] = useState(0);
  const candidates = query
    ? filterMentionCandidates(members, query.query, selfProfileId)
    : [];
  const activeIndex = Math.min(index, Math.max(candidates.length - 1, 0));

  return {
    query,
    candidates,
    open: candidates.length > 0,
    activeIndex,
    update: (value, caret) => {
      setQuery(caret === null ? null : getActiveMentionQuery(value, caret));
      setIndex(0);
    },
    close: () => setQuery(null),
    move: (delta) => {
      if (candidates.length > 0) {
        setIndex((activeIndex + delta + candidates.length) % candidates.length);
      }
    },
    apply: (text, member) => {
      if (!query || !member.handle) {
        return null;
      }
      const before = text.slice(0, query.start);
      const after = text.slice(query.start + query.query.length + 1);
      const insert = `@${member.handle} `;
      setQuery(null);
      return {
        text: `${before}${insert}${after}`,
        caret: before.length + insert.length,
      };
    },
  };
}

/** Handles arrow/enter/tab/escape while suggestions are open. */
export function handleMentionKey(
  event: KeyboardEvent<HTMLTextAreaElement>,
  picker: MentionPicker,
  onPick: (member: E2eeMember) => void
): boolean {
  if (!picker.open) {
    return false;
  }
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp":
      event.preventDefault();
      picker.move(event.key === "ArrowDown" ? 1 : -1);
      return true;
    case "Enter":
    case "Tab": {
      event.preventDefault();
      const member = picker.candidates[picker.activeIndex];
      if (member) {
        onPick(member);
      }
      return true;
    }
    case "Escape":
      event.preventDefault();
      picker.close();
      return true;
    default:
      return false;
  }
}

/** Enter sends; Shift+Enter and IME composition insert a newline. */
export const isSendKey = (event: KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;

export const isEditLastMessageKey = (
  event: KeyboardEvent<HTMLTextAreaElement>
) =>
  event.key === "ArrowUp" &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey;

export const isComposerEmpty = (
  text: string,
  files: readonly File[]
): boolean => text.trim().length === 0 && files.length === 0;
