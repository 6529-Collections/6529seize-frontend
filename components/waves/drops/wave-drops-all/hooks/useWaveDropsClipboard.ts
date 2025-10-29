"use client";

import { RefObject, useEffect, useMemo, useRef } from "react";
import {
  Drop,
  DropSize,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiDropMetadata } from "@/generated/models/ApiDropMetadata";

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
    if (node.dataset?.waveClipboardAllowDefault === "true") {
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

  return value.replaceAll(/[\0-\x1F\x7F"\\\[\]]/g, String.raw`\$&`);
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
    if (current.dataset?.waveDropId) {
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

const toPlainText = (markdown: string): string =>
  markdown
    .replaceAll(/```([\s\S]*?)```/g, (_, code) => code.trim())
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/!\[[^\]]*]\(([^)]+)\)/g, "$1")
    .replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replaceAll(/(\*\*|__)(.*?)\1/g, "$2")
    .replaceAll(/(\*|_)(.*?)\1/g, "$2")
    .replaceAll(/~~(.*?)~~/g, "$1")
    .replaceAll(/(^|\n)#{1,6}\s+/g, "$1")
    .replaceAll(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replaceAll(/(^|\n)>\s?/g, "$1")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();

type EmbedInfo = {
  readonly title?: string;
  readonly url?: string;
  readonly description?: string;
  readonly extras: string[];
};

const EMBED_KEY_SEPARATORS = [":", "::", ".", "-", "_"] as const;

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
    let groupKey = "default";
    let fieldKey = normalizedKey;

    for (const separator of EMBED_KEY_SEPARATORS) {
      const index = normalizedKey.lastIndexOf(separator);
      if (index > -1) {
        groupKey = normalizedKey.slice(0, index) || "default";
        fieldKey = normalizedKey.slice(index + separator.length);
        break;
      }
    }

    const group = groups.get(groupKey) ?? { extras: [] };
    let nextGroup = group;

    if (fieldKey.includes("title")) {
      if (!nextGroup.title) {
        nextGroup = { ...nextGroup, title: data_value };
      }
    } else if (fieldKey.includes("url")) {
      if (!nextGroup.url) {
        nextGroup = { ...nextGroup, url: data_value };
      }
    } else if (fieldKey.includes("description")) {
      if (!nextGroup.description) {
        nextGroup = { ...nextGroup, description: data_value };
      }
    } else if (data_value.startsWith("http")) {
      if (!nextGroup.url) {
        nextGroup = { ...nextGroup, url: data_value };
      } else if (!nextGroup.extras.includes(data_value)) {
        nextGroup = {
          ...nextGroup,
          extras: [...nextGroup.extras, data_value],
        };
      }
    } else {
      nextGroup = {
        ...nextGroup,
        extras: [...nextGroup.extras, `${data_key}: ${data_value}`],
      };
    }

    groups.set(groupKey, nextGroup);
  }

  return Array.from(groups.values()).filter(
    (group) =>
      !!group.title ||
      !!group.url ||
      !!group.description ||
      group.extras.length > 0
  );
};

const buildClipboardMessage = (drop: ExtendedDrop): ClipboardMessage => {
  const markdownContent = drop.parts
    .map((part) => part.content ?? "")
    .filter((value) => (value ?? "").trim().length > 0)
    .join("\n\n")
    .trim();

  const plainContent = markdownContent ? toPlainText(markdownContent) : "";

  const embedInfos = extractEmbeds(drop.metadata ?? []);

  const embedPlainLines = embedInfos.flatMap((embed) => {
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
  });

  const embedMarkdownLines = embedInfos.flatMap((embed) => {
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
  });

  const mediaUrls = drop.parts.flatMap((part) =>
    part.media
      .map((media) => media.url)
      .filter((url): url is string => !!url && url.length > 0)
  );

  const uniqueAttachments = Array.from(new Set(mediaUrls));

  return {
    id: drop.stableKey ?? drop.id,
    author: drop.author?.handle ?? "Unknown",
    timestamp: drop.created_at,
    markdownContent,
    plainContent,
    embedPlainLines: embedPlainLines.filter(Boolean),
    embedMarkdownLines: embedMarkdownLines.filter(Boolean),
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
  if (!messages.length) {
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
    const dropId = element.dataset.waveDropId;
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
  if (!selection || selection.isCollapsed) {
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
  if (!selectedIds.length) {
    return null;
  }

  const messages = selectedIds
    .map((id) => clipboardMessages.get(id))
    .filter((message): message is ClipboardMessage => !!message);

  if (!messages.length) {
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
  const startDropId = startElement?.dataset?.waveDropId ?? null;
  const endDropId = endElement?.dataset?.waveDropId ?? null;

  const startElementForRange =
    startDropId != null
      ? dropElements.get(startDropId) ?? startElement ?? null
      : startElement ?? null;
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
    !boundaries.startFullySelected
  ) {
    usedPartialHandling = true;
    const text = getSelectedTextForElement(
      selectionRange,
      boundaries.startElementForRange
    );
    partialSegments.set(boundaries.startDropId, text);
  }

  if (
    boundaries.endDropId &&
    boundaries.endElementForRange &&
    (!boundaries.endFullySelected ||
      (boundaries.startDropId === boundaries.endDropId &&
        !boundaries.startFullySelected))
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
  selectedIds: string[];
  partialSegments: Map<string, string>;
  messagesById: Map<string, ClipboardMessage>;
  format: ClipboardFormat;
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
  const chatDrops = useMemo(
    () =>
      (drops ?? []).filter(
        (drop): drop is ExtendedDrop =>
          drop.type === DropSize.FULL && drop.drop_type === ApiDropType.Chat
      ),
    [drops]
  );

  const clipboardMessages = useMemo(() => {
    return new Map(
      chatDrops.map((drop) => [drop.stableKey ?? drop.id, buildClipboardMessage(drop)])
    );
  }, [chatDrops]);

  const formatRef = useRef<ClipboardFormat>("plain");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "c") {
        return;
      }

      if (!event.metaKey && !event.ctrlKey) {
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
        void navigator.clipboard.writeText(payload).catch(() => {});
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
