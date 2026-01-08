"use client";

import type { RefObject} from "react";
import { useEffect, useMemo, useRef } from "react";
import type {
  Drop,
  ExtendedDrop} from "@/helpers/waves/drop.helpers";
import {
  DropSize
} from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";

type ClipboardFormat = "plain" | "markdown";

interface ClipboardMessage {
  readonly id: string;
  readonly author: string;
  readonly timestamp: number;
  readonly plainContent: string;
  readonly markdownContent: string;
  readonly embedPlainLines: string[];
  readonly embedMarkdownLines: string[];
  readonly attachmentPlainLines: string[];
  readonly attachmentMarkdownLines: string[];
}

interface UseWaveDropsClipboardOptions {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly drops: Drop[] | undefined;
}

const isHTMLElement = (node: Node | null): node is HTMLElement =>
  !!node && node instanceof HTMLElement;

const nodeIsEditable = (node: Node | null): boolean => {
  if (!node) {
    return false;
  }

  if (isHTMLElement(node)) {
    if (node.isContentEditable) {
      return true;
    }
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement
    ) {
      return true;
    }
    if (node.dataset?.["waveClipboardAllowDefault"] === "true") {
      return true;
    }
  }

  const parent = node.parentElement;
  if (!parent) {
    return false;
  }

  if (parent.isContentEditable) {
    return true;
  }

  if (parent instanceof HTMLInputElement || parent instanceof HTMLTextAreaElement) {
    return true;
  }

  const allowDefaultElement = parent.closest(
    "[data-wave-clipboard-allow-default=\"true\"]"
  );

  return allowDefaultElement !== null;
};

const escapeAttributeValue = (value: string): string => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    if (code <= 0x1F || code === 0x7F || ch === "\"" || ch === "\\" || ch === "[" || ch === "]") {
      out += "\\" + ch;
    } else {
      out += ch;
    }
  }
  return out;
};

const findDropElement = (node: Node | null): HTMLElement | null => {
  if (!node) {
    return null;
  }

  let current: HTMLElement | null = null;

  if (node instanceof HTMLElement) {
    current = node;
  } else if (node.parentElement) {
    current = node.parentElement;
  }

  while (current) {
    if (current.dataset?.["waveDropId"]) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
};

const isRangeFullyCoveringElement = (range: Range, element: HTMLElement): boolean => {
  const elementRange = document.createRange();
  elementRange.selectNodeContents(element);

  const coversStart = range.compareBoundaryPoints(Range.START_TO_START, elementRange) <= 0;
  const coversEnd = range.compareBoundaryPoints(Range.END_TO_END, elementRange) >= 0;

  return coversStart && coversEnd;
};

const getSelectedTextForElement = (range: Range, element: HTMLElement): string => {
  const elementRange = document.createRange();
  elementRange.selectNodeContents(element);

  const clipped = range.cloneRange();

  if (clipped.compareBoundaryPoints(Range.START_TO_START, elementRange) < 0) {
    clipped.setStart(elementRange.startContainer, elementRange.startOffset);
  }

  if (clipped.compareBoundaryPoints(Range.END_TO_END, elementRange) > 0) {
    clipped.setEnd(elementRange.endContainer, elementRange.endOffset);
  }

  const text = clipped.toString();

  return text;
};

const replaceMarkdownLinks = (input: string): string => {
  if (!input.includes("[")) {
    return input;
  }

  let result = "";
  let cursor = 0;

  while (cursor < input.length) {
    const openBracket = input.indexOf("[", cursor);
    if (openBracket === -1) {
      result += input.slice(cursor);
      break;
    }

    const isImage = openBracket > cursor && input[openBracket - 1] === "!";
    const segmentEnd = isImage ? openBracket - 1 : openBracket;

    result += input.slice(cursor, segmentEnd);

    const closeBracket = input.indexOf("]", openBracket + 1);
    if (closeBracket === -1) {
      result += input.slice(segmentEnd);
      break;
    }

    if (closeBracket + 1 >= input.length || input[closeBracket + 1] !== "(") {
      result += input.slice(segmentEnd, closeBracket + 1);
      cursor = closeBracket + 1;
      continue;
    }

    let depth = 1;
    let urlCursor = closeBracket + 2;

    while (urlCursor < input.length && depth > 0) {
      const char = input[urlCursor];
      if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      }
      urlCursor += 1;
    }

    if (depth !== 0) {
      result += input.slice(segmentEnd, urlCursor);
      cursor = urlCursor;
      continue;
    }

    const urlEnd = urlCursor - 1;
    const label = input.slice(openBracket + 1, closeBracket);
    const url = input.slice(closeBracket + 2, urlEnd);

    if (isImage) {
      result += url;
    } else if (label && url) {
      result += `${label} (${url})`;
    } else {
      result += label || url;
    }

    cursor = urlCursor;
  }

  return result;
};

const toPlainText = (markdown: string): string => {
  const withoutLinkMarkup = replaceMarkdownLinks(markdown);

  return withoutLinkMarkup
    .replaceAll(/```([\s\S]*?)```/g, (_, code) => code.trim())
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/(\*\*|__)(.*?)\1/g, "$2")
    .replaceAll(/([*_])(.*?)\1/g, "$2")
    .replaceAll(/~~(.*?)~~/g, "$1")
    .replaceAll(/(^|\n)#{1,6}\s+/g, "$1")
    .replaceAll(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replaceAll(/(^|\n)\s*\d+[.)]\s+/g, "$1")
    .replaceAll(/(^|\n)>\s?/g, "$1")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
};

type EmbedInfo = {
  readonly title?: string | undefined;
  readonly url?: string | undefined;
  readonly description?: string | undefined;
  readonly extras: string[];
};

const EMBED_KEY_SEPARATORS = [":", "::", ".", "-", "_"] as const;

const createEmptyEmbed = (): EmbedInfo => ({ extras: [] });

const ensureFieldValue = <K extends "title" | "url" | "description">(
  group: EmbedInfo,
  field: K,
  value: string
): EmbedInfo => {
  if (group[field]) {
    return group;
  }
  return { ...group, [field]: value };
};

const appendUniqueExtra = (group: EmbedInfo, value: string): EmbedInfo => {
  if (group.extras.includes(value)) {
    return group;
  }
  return { ...group, extras: [...group.extras, value] };
};

const splitEmbedKey = (normalizedKey: string) => {
  for (const separator of EMBED_KEY_SEPARATORS) {
    const index = normalizedKey.lastIndexOf(separator);
    if (index > -1) {
      return {
        groupKey: normalizedKey.slice(0, index) || "default",
        fieldKey: normalizedKey.slice(index + separator.length),
      };
    }
  }

  return { groupKey: "default", fieldKey: normalizedKey };
};

const applyMetadataToGroup = (
  group: EmbedInfo,
  fieldKey: string,
  dataKey: string | undefined,
  dataValue: string
): EmbedInfo => {
  if (fieldKey.includes("title")) {
    return ensureFieldValue(group, "title", dataValue);
  }

  if (fieldKey.includes("url")) {
    return ensureFieldValue(group, "url", dataValue);
  }

  if (fieldKey.includes("description")) {
    return ensureFieldValue(group, "description", dataValue);
  }

  if (dataValue.startsWith("http")) {
    if (!group.url) {
      return ensureFieldValue(group, "url", dataValue);
    }
    return appendUniqueExtra(group, dataValue);
  }

  const extraLabel = `${dataKey}: ${dataValue}`;
  return appendUniqueExtra(group, extraLabel);
};

const extractEmbeds = (metadata: ApiDropMetadata[]): EmbedInfo[] => {
  if (!metadata.length) {
    return [];
  }

  const groups = new Map<string, EmbedInfo>();

  for (const { data_key, data_value } of metadata) {
    if (!data_value) {
      continue;
    }

    const normalizedKey = data_key?.toLowerCase?.() ?? "";
    const { groupKey, fieldKey } = splitEmbedKey(normalizedKey);
    const group = groups.get(groupKey) ?? createEmptyEmbed();

    groups.set(
      groupKey,
      applyMetadataToGroup(group, fieldKey, data_key, data_value)
    );
  }

  return Array.from(groups.values()).filter(
    (group) =>
      !!group.title ||
      !!group.url ||
      !!group.description ||
      group.extras.length > 0
  );
};

type QuoteDropSource = {
  readonly author?: { readonly handle?: string | null | undefined } | undefined;
  readonly parts?: ReadonlyArray<{
    readonly part_id: number;
    readonly content: string | null;
  }> | undefined;
  readonly created_at?: number | null | undefined;
  readonly wave?: { readonly name?: string | null | undefined } | null | undefined;
};

const mergeQuoteDropSources = (
  primary?: QuoteDropSource | null,
  secondary?: QuoteDropSource | null
): QuoteDropSource | undefined => {
  if (!primary && !secondary) {
    return undefined;
  }

  if (!primary) {
    return secondary ?? undefined;
  }

  if (!secondary) {
    return primary ?? undefined;
  }

  return {
    author: primary.author ?? secondary.author,
    parts: primary.parts ?? secondary.parts,
    created_at: primary.created_at ?? secondary.created_at,
    wave: primary.wave ?? secondary.wave,
  };
};

const registerQuoteDropSource = (
  registry: Map<string, QuoteDropSource>,
  dropId: string,
  source: QuoteDropSource | null | undefined
): void => {
  if (!source) {
    return;
  }

  const merged = mergeQuoteDropSources(registry.get(dropId), source);
  if (merged) {
    registry.set(dropId, merged);
  }
};

type DropReferenceDescriptor = {
  readonly label: string;
  readonly dropId: string;
  readonly dropPartId: number;
  readonly isDeleted?: boolean | undefined;
  readonly drop?: QuoteDropSource | null | undefined;
};

const formatDeletedReference = (
  descriptor: DropReferenceDescriptor
): string =>
  `> **${descriptor.label}** (original message deleted: ${descriptor.dropId}#${descriptor.dropPartId})`;

const formatFallbackReference = (
  descriptor: DropReferenceDescriptor
): string =>
  `> **${descriptor.label}** (${descriptor.dropId}#${descriptor.dropPartId})`;

const resolveReferenceDetails = (
  descriptor: DropReferenceDescriptor,
  quoteLookup: Map<string, QuoteDropSource>
) => {
  const mergedDrop = mergeQuoteDropSources(
    descriptor.drop ?? undefined,
    quoteLookup.get(descriptor.dropId)
  );

  const authorHandle = mergedDrop?.author?.handle?.trim() ?? "";
  const referencedPartContent = mergedDrop?.parts?.find(
    (part) => part.part_id === descriptor.dropPartId
  )?.content;
  const normalizedContent =
    typeof referencedPartContent === "string"
      ? referencedPartContent.trim()
      : "";
  const waveName = mergedDrop?.wave?.name?.trim() ?? "";

  return { authorHandle, normalizedContent, waveName };
};

const buildReferenceContentLines = (content: string): string[] => {
  if (!content) {
    return [];
  }

  const contentLines = content.split("\n");
  return contentLines.map((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 ? `> ${line}` : ">";
  });
};

const buildReferenceHeading = (
  label: string,
  authorHandle: string,
  hasContent: boolean
): string => {
  const headingParts = [label, authorHandle]
    .filter((part) => part && part.length > 0)
    .join(" ")
    .trim();

  const suffix = hasContent ? ":" : "";

  return `> **${headingParts}${suffix}**`;
};

const formatReference = (
  descriptor: DropReferenceDescriptor,
  quoteLookup: Map<string, QuoteDropSource>
): string | null => {
  if (descriptor.isDeleted) {
    return formatDeletedReference(descriptor);
  }

  const { authorHandle, normalizedContent, waveName } =
    resolveReferenceDetails(descriptor, quoteLookup);

  if (!authorHandle && !normalizedContent && !waveName) {
    return formatFallbackReference(descriptor);
  }

  const lines = [
    buildReferenceHeading(descriptor.label, authorHandle, normalizedContent.length > 0),
    ...buildReferenceContentLines(normalizedContent),
  ];

  if (waveName) {
    lines.push(`> in ${waveName}`);
  }

  return lines.join("\n");
};

type EmbedLineBuilder = (embed: EmbedInfo) => string[];

const buildEmbedLines = (
  embedInfos: EmbedInfo[],
  builder: EmbedLineBuilder
): string[] => embedInfos.flatMap(builder);

const createPlainEmbedLines: EmbedLineBuilder = (embed) => {
  const lines: string[] = [];
  if (embed.title && embed.url) {
    lines.push(`${embed.title} — ${embed.url}`);
  } else if (embed.title) {
    lines.push(embed.title);
  } else if (embed.url) {
    lines.push(embed.url);
  }

  if (embed.description) {
    lines.push(embed.description);
  }

  lines.push(...embed.extras);

  return lines;
};

const createMarkdownEmbedLines: EmbedLineBuilder = (embed) => {
  const lines: string[] = [];
  if (embed.title && embed.url) {
    lines.push(`[${embed.title}](${embed.url})`);
  } else if (embed.title) {
    lines.push(`**${embed.title}**`);
  } else if (embed.url) {
    lines.push(embed.url);
  }

  if (embed.description) {
    lines.push(embed.description);
  }

  lines.push(...embed.extras);

  return lines;
};

type DropPart = ExtendedDrop["parts"][number];

const buildPartSegments = (
  part: DropPart,
  quoteLookup: Map<string, QuoteDropSource>
): string[] => {
  const segments: string[] = [];
  const content = (part.content ?? "").trim();

  if (content.length > 0) {
    segments.push(content);
  }

  const quoted = part.quoted_drop;
  if (!quoted) {
    return segments;
  }

  const quoteSegment = formatReference(
    {
      label: "Quote from",
      dropId: quoted.drop_id,
      dropPartId: quoted.drop_part_id,
      drop: quoted.drop,
    },
    quoteLookup
  );

  if (quoteSegment) {
    segments.push(quoteSegment);
  }

  return segments;
};

const buildClipboardMessage = (
  drop: ExtendedDrop,
  quoteLookup: Map<string, QuoteDropSource>
): ClipboardMessage => {
  const markdownSegments: string[] = [];

  const replySegment = drop.reply_to
    ? formatReference(
        {
          label: "Replying to",
          dropId: drop.reply_to.drop_id,
          dropPartId: drop.reply_to.drop_part_id,
          isDeleted: drop.reply_to.is_deleted,
          drop: drop.reply_to.drop,
        },
        quoteLookup
      )
    : null;

  if (replySegment) {
    markdownSegments.push(replySegment);
  }

  for (const part of drop.parts) {
    markdownSegments.push(...buildPartSegments(part, quoteLookup));
  }

  const markdownContent = markdownSegments.join("\n\n").trim();

  const plainContent = markdownContent ? toPlainText(markdownContent) : "";

  const embedInfos = extractEmbeds(drop.metadata ?? []);

  const summaryPlainLines: string[] = [];
  const summaryMarkdownLines: string[] = [];

  if (drop.drop_type !== ApiDropType.Chat) {
    summaryPlainLines.push(`Type: ${drop.drop_type}`);
    summaryMarkdownLines.push(`**Type:** ${drop.drop_type}`);
  }

  if (drop.drop_type === ApiDropType.Winner) {
    const winnerRank = drop.winning_context?.place ?? drop.rank;
    if (winnerRank !== null && winnerRank !== undefined) {
      summaryPlainLines.push(`Rank: ${winnerRank}`);
      summaryMarkdownLines.push(`**Rank:** ${winnerRank}`);
    }
  }

  const embedPlainLines = [
    ...summaryPlainLines,
    ...buildEmbedLines(embedInfos, createPlainEmbedLines),
  ].filter(Boolean);
  const embedMarkdownLines = [
    ...summaryMarkdownLines,
    ...buildEmbedLines(embedInfos, createMarkdownEmbedLines),
  ].filter(Boolean);

  const mediaUrls = drop.parts.flatMap((part) =>
    part.media
      .map((media) => media.url)
      .filter((url): url is string => !!url && url.length > 0)
  );

  const uniqueAttachments = Array.from(new Set(mediaUrls));

  return {
    id: drop.stableHash ?? drop.id,
    author: drop.author?.handle ?? "Unknown",
    timestamp: drop.created_at,
    markdownContent,
    plainContent,
    embedPlainLines,
    embedMarkdownLines,
    attachmentPlainLines: uniqueAttachments,
    attachmentMarkdownLines: uniqueAttachments.map(
      (url) => `[attachment](${url})`
    ),
  };
};

const formatTimestamp = (timestamp: number): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
};

type FormatContent = {
  primaryContent: string;
  embedLines: string[];
  attachmentLines: string[];
};

const resolveFormatContent = (
  message: ClipboardMessage,
  format: ClipboardFormat
): FormatContent => {
  const isMarkdown = format === "markdown";
  let primarySource: string | null | undefined;
  let embedSource: string[] | null | undefined;
  let attachmentSource: string[] | null | undefined;

  if (isMarkdown) {
    primarySource = message.markdownContent;
    embedSource = message.embedMarkdownLines;
    attachmentSource = message.attachmentMarkdownLines;
  } else {
    primarySource = message.plainContent;
    embedSource = message.embedPlainLines;
    attachmentSource = message.attachmentPlainLines;
  }

  const primaryContent = (primarySource ?? "").trim();
  const embedLines = embedSource ?? [];
  const attachmentLines = attachmentSource ?? [];

  return {
    primaryContent,
    embedLines,
    attachmentLines,
  };
};

const createHeading = (
  authorLabel: string,
  timeLabel: string,
  format: ClipboardFormat,
  isSingle: boolean
): string => {
  const timeSuffix = timeLabel ? " (" + timeLabel + ")" : "";
  const markdownTimePrefix = timeLabel ? "**" + timeLabel + "** " : "";
  const plainTimePrefix = timeLabel ? timeLabel + " " : "";
  const markdownAuthorLabel = "**" + authorLabel + "**";

  if (format === "markdown") {
    if (isSingle) {
      return markdownAuthorLabel + timeSuffix + ":";
    }

    return markdownTimePrefix + markdownAuthorLabel + ":";
  }

  if (isSingle) {
    return authorLabel + timeSuffix + ":";
  }

  return plainTimePrefix + authorLabel + ":";
};

const formatMessage = (
  message: ClipboardMessage,
  format: ClipboardFormat,
  isSingle: boolean
): string => {
  const timeLabel = formatTimestamp(message.timestamp);
  const authorLabel = message.author || "Unknown";
  const formatContent = resolveFormatContent(message, format);
  const heading = createHeading(authorLabel, timeLabel, format, isSingle);

  const sections = [
    formatContent.primaryContent,
    ...formatContent.embedLines,
    ...formatContent.attachmentLines,
  ].filter((section) => section.length > 0);

  if (sections.length === 0) {
    return heading;
  }

  const [firstSection, ...rest] = sections;
  let block = (heading + " " + firstSection).trimEnd();

  if (rest.length > 0) {
    block += "\n\n" + rest.join("\n\n");
  }

  return block;
};

const formatMessages = (
  messages: ClipboardMessage[],
  format: ClipboardFormat
): string => {
  if (messages.length === 0) {
    return "";
  }

  const isSingle = messages.length === 1;
  const segments = messages.map((message) =>
    formatMessage(message, format, isSingle)
  );

  return segments.join("\n\n");
};

const gatherSelectedMessageIds = (
  selection: Selection,
  container: HTMLElement
): string[] => {
  const dropElements = Array.from(
    container.querySelectorAll<HTMLElement>("[data-wave-drop-id]")
  );

  const ids: string[] = [];
  const seen = new Set<string>();

  for (const element of dropElements) {
    const dropId = element.dataset["waveDropId"];
    if (!dropId || seen.has(dropId)) {
      continue;
    }

    let intersects = false;
    for (let i = 0; i < selection.rangeCount; i += 1) {
      const range = selection.getRangeAt(i);
      try {
        if (range.intersectsNode(element)) {
          intersects = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (intersects) {
      ids.push(dropId);
      seen.add(dropId);
    }
  }

  return ids;
};

type SelectionContext = {
  messages: ClipboardMessage[];
  selectedIds: string[];
  selectionRange: Range | null;
};

type RangeBoundaryContext = {
  startDropId: string | null;
  endDropId: string | null;
  startElementForRange: HTMLElement | null;
  endElementForRange: HTMLElement | null;
  startFullySelected: boolean;
  endFullySelected: boolean;
};

type PartialSegmentsResult = {
  partialSegments: Map<string, string>;
  usedPartialHandling: boolean;
};

const resolveSelectionContext = (
  selection: Selection | null,
  container: HTMLElement,
  clipboardMessages: Map<string, ClipboardMessage>
): SelectionContext | null => {
  if (selection === null) {
    return null;
  }

  if (selection.isCollapsed) {
    return null;
  }

  const anchorNodeParent = selection.anchorNode;
  const focusNodeParent = selection.focusNode;

  const anchorInside = anchorNodeParent
    ? container.contains(anchorNodeParent)
    : false;
  const focusInside = focusNodeParent
    ? container.contains(focusNodeParent)
    : false;

  if (!anchorInside && !focusInside) {
    return null;
  }

  if (nodeIsEditable(anchorNodeParent) || nodeIsEditable(focusNodeParent)) {
    return null;
  }

  const selectedIds = gatherSelectedMessageIds(selection, container);
  if (selectedIds.length === 0) {
    return null;
  }

  const messages: ClipboardMessage[] = [];
  for (const id of selectedIds) {
    const message = clipboardMessages.get(id);
    if (message) {
      messages.push(message);
    }
  }

  if (messages.length === 0) {
    return null;
  }

  messages.sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      return a.id.localeCompare(b.id);
    }
    return a.timestamp - b.timestamp;
  });

  const selectionRange =
    selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  return {
    messages,
    selectedIds,
    selectionRange,
  };
};

const buildRangePayload = (
  selectionRange: Range,
  selectedIds: string[],
  container: HTMLElement,
  messages: ClipboardMessage[],
  format: ClipboardFormat
): string | undefined => {
  const messagesById = new Map(
    messages.map((message) => [message.id, message] as const)
  );

  const dropElements = collectDropElements(container, selectedIds);
  const boundaries = resolveRangeBoundaries(selectionRange, dropElements);
  const { partialSegments, usedPartialHandling } = collectPartialSegments(
    selectionRange,
    boundaries
  );

  const segments = buildSegmentsFromSelection({
    selectedIds,
    partialSegments,
    messagesById,
    format,
  });

  if (segments.length > 0 || usedPartialHandling) {
    return segments.join("\n\n");
  }

  return undefined;
};

const collectDropElements = (
  container: HTMLElement,
  selectedIds: string[]
): Map<string, HTMLElement> => {
  const dropElements = new Map<string, HTMLElement>();

  for (const id of selectedIds) {
    const escapedId = escapeAttributeValue(id);
    const element = container.querySelector<HTMLElement>(
      `[data-wave-drop-id="${escapedId}"]`
    );

    if (element) {
      dropElements.set(id, element);
    }
  }

  return dropElements;
};

const resolveRangeBoundaries = (
  selectionRange: Range,
  dropElements: Map<string, HTMLElement>
): RangeBoundaryContext => {
  const startElement = findDropElement(selectionRange.startContainer);
  const endElement = findDropElement(selectionRange.endContainer);
  const startDropId = startElement?.dataset?.["waveDropId"] ?? null;
  const endDropId = endElement?.dataset?.["waveDropId"] ?? null;

  const startElementForRange =
    startDropId == null
      ? startElement ?? null
      : dropElements.get(startDropId) ?? startElement ?? null;
  const endElementForRange =
    endDropId != null
      ? dropElements.get(endDropId) ?? endElement ?? null
      : endElement ?? null;

  const startFullySelected = Boolean(
    startDropId &&
      startElementForRange &&
      isRangeFullyCoveringElement(selectionRange, startElementForRange)
  );
  const endFullySelected = Boolean(
    endDropId &&
      endElementForRange &&
      isRangeFullyCoveringElement(selectionRange, endElementForRange)
  );

  return {
    startDropId,
    endDropId,
    startElementForRange,
    endElementForRange,
    startFullySelected,
    endFullySelected,
  };
};

const collectPartialSegments = (
  selectionRange: Range,
  boundaries: RangeBoundaryContext
): PartialSegmentsResult => {
  const partialSegments = new Map<string, string>();
  let usedPartialHandling = false;

  if (
    boundaries.startDropId &&
    boundaries.startElementForRange &&
    boundaries.startFullySelected === false
  ) {
    usedPartialHandling = true;
    const text = getSelectedTextForElement(
      selectionRange,
      boundaries.startElementForRange
    );
    partialSegments.set(boundaries.startDropId, text);
  }

  const isSameDrop =
    boundaries.startDropId !== null &&
    boundaries.startDropId === boundaries.endDropId;
  const endPartiallySelected =
    boundaries.endFullySelected === false ||
    (isSameDrop && boundaries.startFullySelected === false);

  if (
    boundaries.endDropId &&
    boundaries.endElementForRange &&
    endPartiallySelected
  ) {
    usedPartialHandling = true;
    const text = getSelectedTextForElement(
      selectionRange,
      boundaries.endElementForRange
    );
    partialSegments.set(boundaries.endDropId, text);
  }

  return { partialSegments, usedPartialHandling };
};

type BuildSegmentsOptions = {
  readonly selectedIds: string[];
  readonly partialSegments: Map<string, string>;
  readonly messagesById: Map<string, ClipboardMessage>;
  readonly format: ClipboardFormat;
};

const buildSegmentsFromSelection = ({
  selectedIds,
  partialSegments,
  messagesById,
  format,
}: BuildSegmentsOptions): string[] => {
  const fullMessageIds = selectedIds.filter((id) => !partialSegments.has(id));
  const totalFullMessages = fullMessageIds.length;
  const segments: string[] = [];

  for (const id of selectedIds) {
    const partial = partialSegments.get(id);
    if (partial !== undefined) {
      segments.push(partial);
      continue;
    }

    const message = messagesById.get(id);
    if (!message) {
      continue;
    }

    const segment = formatMessage(
      message,
      format,
      totalFullMessages === 1
    );

    segments.push(segment);
  }

  return segments;
};

export const useWaveDropsClipboard = ({
  containerRef,
  drops,
}: UseWaveDropsClipboardOptions): void => {
  const fullDrops = useMemo(
    () =>
      (drops ?? []).filter(
        (drop): drop is ExtendedDrop =>
          drop.type === DropSize.FULL &&
          typeof drop.stableKey === "string" &&
          drop.stableKey.length > 0 &&
          typeof drop.stableHash === "string" &&
          drop.stableHash.length > 0
      ),
    [drops]
  );

  const quoteDropLookup = useMemo(() => {
    const registry = new Map<string, QuoteDropSource>();

    for (const drop of fullDrops) {
      registerQuoteDropSource(registry, drop.id, {
        author: drop.author,
        parts: drop.parts,
        created_at: drop.created_at,
        wave: drop.wave,
      });

      if (drop.reply_to?.drop) {
        registerQuoteDropSource(registry, drop.reply_to.drop_id, {
          author: drop.reply_to.drop.author,
          parts: drop.reply_to.drop.parts,
          created_at: drop.reply_to.drop.created_at,
          wave: drop.wave,
        });
      }

      for (const part of drop.parts) {
        const quoted = part.quoted_drop;
        if (quoted?.drop) {
          registerQuoteDropSource(registry, quoted.drop_id, {
            author: quoted.drop.author,
            parts: quoted.drop.parts,
            created_at: quoted.drop.created_at,
            wave: drop.wave,
          });
        }
      }
    }

    return registry;
  }, [fullDrops]);

  const clipboardMessages = useMemo(() => {
    return new Map(
      fullDrops.map((drop) => [
        drop.stableHash ?? drop.id,
        buildClipboardMessage(drop, quoteDropLookup),
      ])
    );
  }, [fullDrops, quoteDropLookup]);

  const formatRef = useRef<ClipboardFormat>("plain");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (typeof event.key !== "string" || event.key.toLowerCase() !== "c") {
        return;
      }

      if (!event.metaKey && !event.ctrlKey) {
        return;
      }

      const selection = globalThis.getSelection?.() ?? null;
      const targetNode = event.target instanceof Node ? event.target : null;
      const anchorNode = selection?.anchorNode ?? null;
      const focusNode = selection?.focusNode ?? null;
      const isInContainer = (node: Node | null) =>
        !!node && container.contains(node);

      if (
        !isInContainer(targetNode) &&
        !isInContainer(anchorNode) &&
        !isInContainer(focusNode)
      ) {
        formatRef.current = "plain";
        return;
      }

      formatRef.current = event.shiftKey ? "markdown" : "plain";
    };

    const handleCopy = (event: ClipboardEvent) => {
      const selection = globalThis.getSelection?.() ?? null;
      const context = resolveSelectionContext(
        selection,
        container,
        clipboardMessages
      );

      if (!context) {
        formatRef.current = "plain";
        return;
      }

      const rangePayload = context.selectionRange
        ? buildRangePayload(
            context.selectionRange,
            context.selectedIds,
            container,
            context.messages,
            formatRef.current
          )
        : undefined;

      const payload =
        rangePayload ?? formatMessages(context.messages, formatRef.current);

      if (!payload) {
        formatRef.current = "plain";
        return;
      }

      event.preventDefault();

      if (event.clipboardData) {
        event.clipboardData.setData("text/plain", payload);
        if (formatRef.current === "markdown") {
          event.clipboardData.setData("text/markdown", payload);
        }
      }

      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(payload).catch(() => undefined);
      }

      formatRef.current = "plain";
    };

    globalThis.addEventListener?.("keydown", handleKeyDown);
    container.addEventListener("copy", handleCopy);

    return () => {
      globalThis.removeEventListener?.("keydown", handleKeyDown);
      container.removeEventListener("copy", handleCopy);
    };
  }, [clipboardMessages, containerRef]);
};
