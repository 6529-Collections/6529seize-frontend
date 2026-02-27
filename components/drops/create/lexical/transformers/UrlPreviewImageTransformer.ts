import type { Transformer } from "@lexical/markdown";
import { $isImageNode, ImageNode } from "../nodes/ImageNode";
import { URL_PREVIEW_IMAGE_ALT_TEXT } from "../nodes/urlPreviewImage.constants";

export const URL_PREVIEW_IMAGE_TRANSFORMER: Transformer = {
  type: "element",
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    if (node.getAltText() !== URL_PREVIEW_IMAGE_ALT_TEXT) {
      return null;
    }

    return node.getSrc();
  },
  regExp: /(?:)/,
  replace: () => {},
};
