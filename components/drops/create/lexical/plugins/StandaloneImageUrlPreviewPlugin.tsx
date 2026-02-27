"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  KEY_SPACE_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { parseStandaloneMediaUrl } from "@/components/waves/drops/media-utils";
import { $createImageNode } from "../nodes/ImageNode";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "../nodes/urlPreviewImage.constants";

const WHITESPACE_REGEX = /\s/;

const getTokenEndingAtOffset = (
  text: string,
  offset: number
): {
  readonly start: number;
  readonly end: number;
  readonly token: string;
} | null => {
  if (offset <= 0) {
    return null;
  }

  let start = offset;
  while (start > 0 && !WHITESPACE_REGEX.test(text[start - 1]!)) {
    start -= 1;
  }

  const token = text.slice(start, offset);
  if (!token.length) {
    return null;
  }

  return { start, end: offset, token };
};

const isPreviewableImageUrl = (token: string): boolean => {
  const media = parseStandaloneMediaUrl(token);
  return media?.type === "image";
};

const replaceTokenWithPreviewNode = ({
  textNode,
  start,
  end,
  url,
  appendTrailingSpace,
}: {
  readonly textNode: ReturnType<typeof $createTextNode>;
  readonly start: number;
  readonly end: number;
  readonly url: string;
  readonly appendTrailingSpace: boolean;
}): void => {
  const original = textNode.getTextContent();
  const beforeText = original.slice(0, start);
  const afterText = original.slice(end);

  const beforeNode = beforeText.length ? $createTextNode(beforeText) : null;
  const imageNode = $createImageNode({
    src: url,
    altText: URL_PREVIEW_IMAGE_ALT_TEXT,
  });
  const trailingSpaceNode = appendTrailingSpace ? $createTextNode(" ") : null;
  const afterNode = afterText.length ? $createTextNode(afterText) : null;

  const nodes = [
    ...(beforeNode ? [beforeNode] : []),
    imageNode,
    ...(trailingSpaceNode ? [trailingSpaceNode] : []),
    ...(afterNode ? [afterNode] : []),
  ];

  const [firstNode, ...restNodes] = nodes;
  if (!firstNode) {
    return;
  }

  textNode.replace(firstNode);
  let previousNode = firstNode;
  for (const node of restNodes) {
    previousNode.insertAfter(node);
    previousNode = node;
  }

  if (trailingSpaceNode) {
    trailingSpaceNode.selectEnd();
    return;
  }

  if (afterNode) {
    afterNode.selectStart();
    return;
  }

  imageNode.selectNext();
};

const convertCurrentTokenToPreviewNode = (
  appendTrailingSpace: boolean
): boolean => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode)) {
    return false;
  }

  const tokenRange = getTokenEndingAtOffset(
    anchorNode.getTextContent(),
    selection.anchor.offset
  );
  if (!tokenRange) {
    return false;
  }

  if (!isPreviewableImageUrl(tokenRange.token)) {
    return false;
  }

  replaceTokenWithPreviewNode({
    textNode: anchorNode,
    start: tokenRange.start,
    end: tokenRange.end,
    url: tokenRange.token,
    appendTrailingSpace,
  });

  return true;
};

export default function StandaloneImageUrlPreviewPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterSpace = editor.registerCommand(
      KEY_SPACE_COMMAND,
      (event) => {
        let converted = false;
        editor.update(() => {
          converted = convertCurrentTokenToPreviewNode(true);
        });

        if (converted) {
          event?.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!event?.shiftKey) {
          return false;
        }

        editor.update(() => {
          convertCurrentTokenToPreviewNode(false);
        });

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    const unregisterPaste = editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        if (clipboardData.files.length > 0) {
          return false;
        }

        const text = clipboardData.getData("text/plain").trim();
        if (!isPreviewableImageUrl(text)) {
          return false;
        }

        event.preventDefault();
        editor.update(() => {
          let selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            $getRoot().selectEnd();
            selection = $getSelection();
          }

          if (!$isRangeSelection(selection)) {
            return;
          }

          selection.insertNodes([
            $createImageNode({
              src: text,
              altText: URL_PREVIEW_IMAGE_ALT_TEXT,
            }),
          ]);
        });
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    return () => {
      unregisterSpace();
      unregisterEnter();
      unregisterPaste();
    };
  }, [editor]);

  return null;
}
