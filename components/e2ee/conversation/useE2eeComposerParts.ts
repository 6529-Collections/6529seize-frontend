"use client";

import { type KeyboardEvent, useState } from "react";
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
