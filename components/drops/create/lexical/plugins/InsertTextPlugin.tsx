import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isTextNode,
  type RangeSelection,
} from "lexical";
import { forwardRef, useImperativeHandle } from "react";
import { $createImageNode, $isImageNode } from "../nodes/ImageNode";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "../nodes/urlPreviewImage.constants";
import { isTenorGifUrl } from "@/components/waves/drops/gifPreview";

export interface InsertTextOptions {
  readonly smartSpacing?: boolean;
}

export interface InsertTextPluginHandles {
  insertTextAtCursor: (text: string, options?: InsertTextOptions) => void;
  insertImagePreviewFromUrl: (url: string, options?: InsertTextOptions) => void;
}

const hasNonWhitespace = (value: string | undefined): boolean =>
  Boolean(value && /\S/.test(value));
const LOADING_IMAGE_SRC = "loading";

const applySmartSpacing = (
  selection: RangeSelection,
  text: string,
  smartSpacing: boolean
): string => {
  if (!smartSpacing || !text.length || !selection.isCollapsed()) {
    return text;
  }

  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode)) {
    return text;
  }

  const content = anchorNode.getTextContent();
  const offset = selection.anchor.offset;

  const beforeChar = offset > 0 ? content[offset - 1] : undefined;
  const afterChar = offset < content.length ? content[offset] : undefined;
  const firstChar = text[0];
  const lastChar = text[text.length - 1];

  const prefix = hasNonWhitespace(beforeChar) && hasNonWhitespace(firstChar);
  const suffix = hasNonWhitespace(afterChar) && hasNonWhitespace(lastChar);

  return `${prefix ? " " : ""}${text}${suffix ? " " : ""}`;
};

const getSpacingForSelection = (
  selection: RangeSelection,
  smartSpacing: boolean
): { readonly leading: boolean; readonly trailing: boolean } => {
  if (!smartSpacing || !selection.isCollapsed()) {
    return { leading: false, trailing: false };
  }

  const anchorNode = selection.anchor.getNode();
  if (!$isTextNode(anchorNode)) {
    return { leading: false, trailing: false };
  }

  const content = anchorNode.getTextContent();
  const offset = selection.anchor.offset;
  const beforeChar = offset > 0 ? content[offset - 1] : undefined;
  const afterChar = offset < content.length ? content[offset] : undefined;

  return {
    leading: hasNonWhitespace(beforeChar),
    trailing: hasNonWhitespace(afterChar),
  };
};

const InsertTextPlugin = forwardRef<InsertTextPluginHandles, {}>((_, ref) => {
  const [editor] = useLexicalComposerContext();

  const insertTextAtCursor = (text: string, options?: InsertTextOptions) => {
    if (!text.length) {
      return;
    }

    editor.update(() => {
      let selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        $getRoot().selectEnd();
        selection = $getSelection();
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const textToInsert = applySmartSpacing(
        selection,
        text,
        Boolean(options?.smartSpacing)
      );

      selection.insertRawText(textToInsert);
    });
  };

  const insertImagePreviewFromUrl = (
    url: string,
    options?: InsertTextOptions
  ) => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl.length) {
      return;
    }
    const shouldUseLoadingPlaceholder = isTenorGifUrl(normalizedUrl);
    let placeholderNodeKey: string | null = null;

    editor.update(() => {
      let selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        $getRoot().selectEnd();
        selection = $getSelection();
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const { leading, trailing } = getSpacingForSelection(
        selection,
        Boolean(options?.smartSpacing)
      );
      const imageNode = $createImageNode({
        src: shouldUseLoadingPlaceholder ? LOADING_IMAGE_SRC : normalizedUrl,
        altText: URL_PREVIEW_IMAGE_ALT_TEXT,
      });
      if (shouldUseLoadingPlaceholder) {
        placeholderNodeKey = imageNode.getKey();
      }

      const nodes = [
        ...(leading ? [$createTextNode(" ")] : []),
        imageNode,
        ...(trailing ? [$createTextNode(" ")] : []),
      ];

      $insertNodes(nodes);

      const trailingSpaceNode = trailing ? nodes[nodes.length - 1] : null;
      if ($isTextNode(trailingSpaceNode)) {
        trailingSpaceNode.selectEnd();
      }
    });

    if (!shouldUseLoadingPlaceholder || !placeholderNodeKey) {
      return;
    }
    const placeholderKey = placeholderNodeKey;

    const replacePlaceholderWithPreview = () => {
      editor.update(() => {
        const placeholderNode = $getNodeByKey(placeholderKey);
        if (!$isImageNode(placeholderNode)) {
          return;
        }
        if (placeholderNode.getSrc() !== LOADING_IMAGE_SRC) {
          return;
        }
        placeholderNode.replace(
          $createImageNode({
            src: normalizedUrl,
            altText: URL_PREVIEW_IMAGE_ALT_TEXT,
          })
        );
      });
    };

    if (typeof globalThis.Image === "undefined") {
      replacePlaceholderWithPreview();
      return;
    }

    const preloader = new globalThis.Image();
    const finalize = () => {
      preloader.onload = null;
      preloader.onerror = null;
      replacePlaceholderWithPreview();
    };

    preloader.onload = finalize;
    preloader.onerror = finalize;
    preloader.src = normalizedUrl;
  };

  useImperativeHandle(ref, () => ({
    insertTextAtCursor,
    insertImagePreviewFromUrl,
  }));

  return <></>;
});

InsertTextPlugin.displayName = "InsertTextPlugin";

export default InsertTextPlugin;
