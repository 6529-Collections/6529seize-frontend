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

export type SerializedNftNode = Spread<
  {
    nftName: string;
  },
  SerializedTextNode
>;

function convertNftElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createNftNode(textContent);
    return {
      node,
    };
  }

  return null;
}

export class NftNode extends TextNode {
  __nft: string;

  static getType(): string {
    return "nft";
  }

  static clone(node: NftNode): NftNode {
    return new NftNode(node.__nft, node.__text, node.__key);
  }
  static importJSON(serializedNode: SerializedNftNode): NftNode {
    const node = $createNftNode(serializedNode.nftName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(nftName: string, text?: string, key?: NodeKey) {
    super(text ?? nftName, key);
    this.__nft = nftName;
  }

  exportJSON(): SerializedNftNode {
    return {
      ...super.exportJSON(),
      nftName: this.__nft,
      type: "nft",
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = "editor-nft";

    return dom;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-nft", "true");

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
          conversion: convertNftElement,
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

export function $createNftNode(hashtagName: string): NftNode {
  const nftNode = new NftNode(hashtagName);
  nftNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(nftNode);
}

export function $isNftgNode(node: LexicalNode | null | undefined): node is NftNode {
  return node instanceof NftNode;
}
