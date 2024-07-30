import { TextMatchTransformer } from "@lexical/markdown";
import { $createImageNode, $isImageNode, ImageNode } from "../nodes/ImageNode";

export const IMAGE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![Seize](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, _, src] = match;
    const imageNode = $createImageNode({ src });
    textNode.replace(imageNode);
  },
  trigger: ")",
  type: "text-match",
};
