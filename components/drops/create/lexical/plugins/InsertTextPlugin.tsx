import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isTextNode,
  type RangeSelection,
} from "lexical";
import { forwardRef, useImperativeHandle } from "react";
import { $createImageNode } from "../nodes/ImageNode";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "../nodes/urlPreviewImage.constants";

export interface InsertTextOptions {
  readonly smartSpacing?: boolean;
}

export interface InsertTextPluginHandles {
  insertTextAtCursor: (text: string, options?: InsertTextOptions) => void;
  insertImagePreviewFromUrl: (url: string, options?: InsertTextOptions) => void;
}

const hasNonWhitespace = (value: string | undefined): boolean =>
  Boolean(value && /\S/.test(value));

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

      const nodes = [
        ...(leading ? [$createTextNode(" ")] : []),
        $createImageNode({
          src: normalizedUrl,
          altText: URL_PREVIEW_IMAGE_ALT_TEXT,
        }),
        ...(trailing ? [$createTextNode(" ")] : []),
      ];

      $insertNodes(nodes);

      const trailingSpaceNode = trailing ? nodes[nodes.length - 1] : null;
      if ($isTextNode(trailingSpaceNode)) {
        trailingSpaceNode.selectEnd();
      }
    });
  };

  useImperativeHandle(ref, () => ({
    insertTextAtCursor,
    insertImagePreviewFromUrl,
  }));

  return <></>;
});

InsertTextPlugin.displayName = "InsertTextPlugin";

export default InsertTextPlugin;
