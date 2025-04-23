/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  $applyNodeReplacement,
  TextNode,
} from "lexical";

type SerializedHashtagNode = Spread<
  {
    hashtagName: string;
  },
  SerializedTextNode
>;

function convertHashtagElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createHashtagNode(textContent);
    return {
      node,
    };
  }

  return null;
}

export class HashtagNode extends TextNode {
  __hashtag: string;

  static getType(): string {
    return "hashtag";
  }

  static clone(node: HashtagNode): HashtagNode {
    return new HashtagNode(node.__hashtag, node.__text, node.__key);
  }
  static importJSON(serializedNode: SerializedHashtagNode): HashtagNode {
    const node = $createHashtagNode(serializedNode.hashtagName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(hashtagName: string, text?: string, key?: NodeKey) {
    super(text ?? hashtagName, key);
    this.__hashtag = hashtagName;
  }

  exportJSON(): SerializedHashtagNode {
    return {
      ...super.exportJSON(),
      hashtagName: this.__hashtag,
      type: "hashtag",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = "editor-hashtag";

    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-hashtag", "true");

    element.textContent = this.__text;

    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-hashtag")) {
          return null;
        }
        return {
          conversion: convertHashtagElement,
          priority: 1,
        };
      },
    };
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createHashtagNode(hashtagName: string): HashtagNode {
  const hashtagNode = new HashtagNode(hashtagName);
  hashtagNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(hashtagNode);
}

export function $isHashtagNode(
  node: LexicalNode | null | undefined
): node is HashtagNode {
  return node instanceof HashtagNode;
}
