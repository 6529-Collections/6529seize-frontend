"use client";

import type { RefObject} from "react";
import { useEffect, useMemo, useRef } from "react";
import type {
  Drop,
  ExtendedDrop} from "@/helpers/waves/drop.helpers";
import {
  DropSize
} from "@/helpers/waves/drop.helpers";
import type {
  ClipboardFormat,
  ClipboardMessage,
} from "@/helpers/waves/drop-clipboard.helpers";
import {
  buildClipboardMessage,
  buildQuoteDropLookup,
  formatMessage,
  formatMessages,
} from "@/helpers/waves/drop-clipboard.helpers";

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

  const quoteDropLookup = useMemo(
    () => buildQuoteDropLookup(fullDrops),
    [fullDrops]
  );

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
