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
  readonly containerRef: RefObject<HTMLElement | null>;
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

  const parent = isHTMLElement(node) ? node.parentElement : node.parentElement;
  if (!parent) {
    return false;
  }

  if (parent.closest("[contenteditable=\"true\"]")) {
    return true;
  }

  if (parent instanceof HTMLInputElement || parent instanceof HTMLTextAreaElement) {
    return true;
  }

  return (
    parent.closest("[data-wave-clipboard-allow-default=\"true\"]") !== null
  );
};

const escapeAttributeValue = (value: string): string => {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/["\\]/g, "\\$&");
};

const findDropElement = (node: Node | null): HTMLElement | null => {
  if (!node) {
    return null;
  }

  let current: HTMLElement | null =
    node instanceof HTMLElement ? node : (node.parentElement ?? null);

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

  elementRange.detach?.();

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

  clipped.detach?.();
  elementRange.detach?.();

  return text;
};

const toPlainText = (markdown: string): string =>
  markdown
    .replace(/```([\s\S]*?)```/g, (_, code) => code.trim())
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?]\((.*?)\)/g, (_, url: string) => url)
    .replace(/\[(.*?)]\((.*?)\)/g, "$1 ($2)")
    .replace(/(?:\*\*|__)(.*?)\1/g, "$1")
    .replace(/[_*~>#-]/g, "")
    .replace(/\n{3,}/g, "\n\n")
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

  metadata.forEach(({ data_key, data_value }) => {
    if (!data_value) {
      return;
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

    const group = groups.get(groupKey) ?? { extras: [] as string[] };

    if (fieldKey.includes("title")) {
      if (!group.title) {
        group.title = data_value;
      }
    } else if (fieldKey.includes("url")) {
      if (!group.url) {
        group.url = data_value;
      }
    } else if (fieldKey.includes("description")) {
      if (!group.description) {
        group.description = data_value;
      }
    } else if (data_value.startsWith("http")) {
      if (!group.url) {
        group.url = data_value;
      } else if (!group.extras.includes(data_value)) {
        group.extras.push(data_value);
      }
    } else {
      group.extras.push(`${data_key}: ${data_value}`);
    }

    groups.set(groupKey, group);
  });

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
    attachmentMarkdownLines: uniqueAttachments,
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

const formatMessage = (
  message: ClipboardMessage,
  format: ClipboardFormat,
  isSingle: boolean
): string => {
  const timeLabel = formatTimestamp(message.timestamp);
  const authorLabel = message.author || "Unknown";
  const heading =
    format === "markdown"
      ? isSingle
        ? `**${authorLabel}**${timeLabel ? ` (${timeLabel})` : ""}:`
        : `${timeLabel ? `**${timeLabel}** ` : ""}**${authorLabel}**:`
      : isSingle
      ? `${authorLabel}${timeLabel ? ` (${timeLabel})` : ""}:`
      : `${timeLabel ? `${timeLabel} ` : ""}${authorLabel}:`;

  const primaryContent =
    format === "markdown"
      ? message.markdownContent.trim()
      : message.plainContent.trim();

  const embedLines =
    format === "markdown"
      ? message.embedMarkdownLines
      : message.embedPlainLines;
  const attachmentLines =
    format === "markdown"
      ? message.attachmentMarkdownLines
      : message.attachmentPlainLines;

  const additionalSections = [...embedLines, ...attachmentLines].filter(
    (line) => line && line.length > 0
  );

  if (!primaryContent && additionalSections.length === 0) {
    return heading;
  }

  const [firstSection, ...rest] = [
    primaryContent,
    ...additionalSections,
  ].filter((section) => section && section.length > 0);

  if (!firstSection) {
    return heading;
  }

  let block = `${heading} ${firstSection}`.trimEnd();
  if (rest.length > 0) {
    block += `\n\n${rest.join("\n\n")}`;
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
      const selection = globalThis.getSelection?.();

      if (!selection || selection.isCollapsed) {
        formatRef.current = "plain";
        return;
      }

      const anchorNodeParent = selection.anchorNode;
      const focusNodeParent = selection.focusNode;

      if (
        !container.contains(anchorNodeParent) &&
        !container.contains(focusNodeParent)
      ) {
        formatRef.current = "plain";
        return;
      }

      if (nodeIsEditable(anchorNodeParent) || nodeIsEditable(focusNodeParent)) {
        formatRef.current = "plain";
        return;
      }

      const selectedIds = gatherSelectedMessageIds(selection, container);

      if (!selectedIds.length) {
        formatRef.current = "plain";
        return;
      }

      const messages = selectedIds
        .map((id) => clipboardMessages.get(id))
        .filter((message): message is ClipboardMessage => !!message);

      if (!messages.length) {
        formatRef.current = "plain";
        return;
      }

      messages.sort((a, b) => {
        if (a.timestamp === b.timestamp) {
          return a.id.localeCompare(b.id);
        }
        return a.timestamp - b.timestamp;
      });

      const messagesById = new Map(
        messages.map((message) => [message.id, message] as const)
      );

      const selectionRange =
        selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      let payload: string | undefined;

      if (selectionRange) {
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

        const startElement = findDropElement(selectionRange.startContainer);
        const endElement = findDropElement(selectionRange.endContainer);
        const startDropId = startElement?.dataset?.waveDropId ?? null;
        const endDropId = endElement?.dataset?.waveDropId ?? null;

        const startElementForRange =
          (startDropId && dropElements.get(startDropId)) ?? startElement ?? null;
        const endElementForRange =
          (endDropId && dropElements.get(endDropId)) ?? endElement ?? null;

        const startFullySelected =
          !!(
            startDropId &&
            startElementForRange &&
            isRangeFullyCoveringElement(selectionRange, startElementForRange)
          );
        const endFullySelected =
          !!(
            endDropId &&
            endElementForRange &&
            isRangeFullyCoveringElement(selectionRange, endElementForRange)
          );

        const partialSegments = new Map<string, string>();
        let usedPartialHandling = false;

        if (startDropId && startElementForRange && !startFullySelected) {
          usedPartialHandling = true;
          const text = getSelectedTextForElement(selectionRange, startElementForRange);
          partialSegments.set(startDropId, text);
        }

        if (
          endDropId &&
          endElementForRange &&
          (!endFullySelected || (startDropId === endDropId && !startFullySelected))
        ) {
          usedPartialHandling = true;
          const text = getSelectedTextForElement(selectionRange, endElementForRange);
          partialSegments.set(endDropId, text);
        }

        const fullMessageIds = selectedIds.filter((id) => !partialSegments.has(id));
        const totalFullMessages = fullMessageIds.length;

        const segments: string[] = [];

        for (const id of selectedIds) {
          if (partialSegments.has(id)) {
            const partial = partialSegments.get(id) ?? "";
            segments.push(partial);
            continue;
          }

          const message = messagesById.get(id);
          if (!message) {
            continue;
          }

          const segment = formatMessage(
            message,
            formatRef.current,
            totalFullMessages === 1
          );

          segments.push(segment);
        }

        if (segments.length > 0 || usedPartialHandling) {
          payload = segments.join("\n\n");
        }
      }

      if (!payload) {
        payload = formatMessages(messages, formatRef.current);
      }

      if (!payload) {
        formatRef.current = "plain";
        return;
      }

      event.preventDefault();

      if (event.clipboardData) {
        event.clipboardData.setData("text/plain", payload);
      }

      if (navigator?.clipboard?.writeText) {
        void navigator.clipboard
          .writeText(payload)
          .catch(() => {
            // Silently ignore clipboard promise failures – the event clipboard fallback already ran.
          });
      }

      formatRef.current = "plain";
    };

    window.addEventListener("keydown", handleKeyDown);
    container.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("copy", handleCopy);
    };
  }, [clipboardMessages, containerRef]);
};
