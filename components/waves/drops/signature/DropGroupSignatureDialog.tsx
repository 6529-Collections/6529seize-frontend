"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { ChevronDownIcon, MinusCircleIcon } from "@heroicons/react/24/outline";
import { ShieldCheckIcon } from "@heroicons/react/16/solid";
import { useId, useState } from "react";
import {
  DropSignatureVerification,
  SignatureDialogFrame,
} from "./DropSignatureDialog";
import { isDropAuthorSigned } from "./dropAuthorSigned";

export type GroupSignatureDrop = Pick<
  ApiDrop,
  "id" | "is_author_signed" | "title" | "parts" | "wave" | "author"
> &
  Partial<Pick<ApiDrop, "created_at">>;

const EXCERPT_MAX_LENGTH = 80;
/** Only the start of a long line can reach the excerpt. */
const MAX_SCANNED_LINE_LENGTH = 400;
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

/** Replaces Markdown links with their text and drops images, in one pass. */
function stripMarkdownLinks(line: string): string {
  let result = "";
  let index = 0;
  while (index < line.length) {
    const isImage = line.startsWith("![", index);
    const open = isImage ? index + 1 : index;
    const close = line[open] === "[" ? line.indexOf("]", open + 1) : -1;
    const end =
      close !== -1 && line[close + 1] === "("
        ? line.indexOf(")", close + 2)
        : -1;
    if (end === -1) {
      result += line.charAt(index);
      index += 1;
      continue;
    }
    if (!isImage) {
      result += line.slice(open + 1, close);
    }
    index = end + 1;
  }
  return result;
}

/** The first line of a post's title or text, without Markdown syntax. */
function getDropExcerpt(drop: GroupSignatureDrop): string | null {
  const source = [drop.title, ...drop.parts.map((part) => part.content)].find(
    (text): text is string => typeof text === "string" && text.trim() !== ""
  );
  const firstLine = source
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line !== "");
  if (!firstLine) {
    return null;
  }
  const plain = stripMarkdownLinks(firstLine.slice(0, MAX_SCANNED_LINE_LENGTH))
    .replaceAll(/^[#>\-*\s]+/g, "")
    .replaceAll(/[*_`~]/g, "")
    .trim();
  if (plain === "") {
    return null;
  }
  return plain.length > EXCERPT_MAX_LENGTH
    ? `${plain.slice(0, EXCERPT_MAX_LENGTH - 1).trimEnd()}…`
    : plain;
}

function GroupSignatureRow({
  drop,
  locale,
  expanded,
  onToggle,
}: {
  readonly drop: GroupSignatureDrop;
  readonly locale: SupportedLocale;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) {
  const panelId = useId();
  const signed = isDropAuthorSigned(drop);
  const excerpt =
    getDropExcerpt(drop) ?? t(locale, "signedMessages.group.postWithoutText");
  const status = t(
    locale,
    signed
      ? "signedMessages.signature.signed"
      : "signedMessages.signature.unsigned"
  );
  const StatusIcon = signed ? ShieldCheckIcon : MinusCircleIcon;
  return (
    <li className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={expanded ? panelId : undefined}
        onClick={onToggle}
        className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-1 tw-py-3 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-900"
      >
        {drop.created_at !== undefined && (
          <span className="tw-flex-shrink-0 tw-text-xs tw-tabular-nums tw-text-iron-400">
            {formatDate(locale, drop.created_at, TIME_FORMAT)}
          </span>
        )}
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-text-iron-100">
          {excerpt}
        </span>
        <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1 tw-text-xs tw-text-iron-300">
          <StatusIcon aria-hidden="true" className="tw-size-3.5" />
          <span>{status}</span>
        </span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-4 tw-flex-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${expanded ? "tw-rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div id={panelId} className="tw-px-1 tw-pb-4 tw-pt-1">
          <DropSignatureVerification dropId={drop.id} drop={drop} />
        </div>
      )}
    </li>
  );
}

function DropGroupSignatureDialogContent({
  group,
  isOpen,
  onClose,
}: DropGroupSignatureDialogProps) {
  const locale = useBrowserLocale();
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const toggle = (dropId: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (!next.delete(dropId)) {
        next.add(dropId);
      }
      return next;
    });
  return (
    <SignatureDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      title={t(locale, "signedMessages.group.title")}
    >
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-text-iron-400">
        {t(locale, "signedMessages.group.description")}
      </p>
      <ul
        aria-label={t(locale, "signedMessages.group.listLabel")}
        className="tw-m-0 tw-mt-3 tw-list-none tw-p-0"
      >
        {group.map((drop) => (
          <GroupSignatureRow
            key={drop.id}
            drop={drop}
            locale={locale}
            expanded={expandedIds.has(drop.id)}
            onToggle={() => toggle(drop.id)}
          />
        ))}
      </ul>
    </SignatureDialogFrame>
  );
}

interface DropGroupSignatureDialogProps {
  /** The grouped posts in display order, header post first. */
  readonly group: readonly GroupSignatureDrop[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/**
 * Lists every post of a grouped chat run with its signed status. A post's
 * signature is fetched and verified in the browser only when its row is
 * opened. Renders nothing while signed messages are disabled.
 */
export default function DropGroupSignatureDialog(
  props: DropGroupSignatureDialogProps
) {
  if (!isSignedMessagesEnabled() || !props.isOpen) {
    return null;
  }
  return <DropGroupSignatureDialogContent {...props} />;
}
