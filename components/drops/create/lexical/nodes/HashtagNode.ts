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
import type { ReferencedNft } from "@/entities/IDrop";

type NftReferenceIdentity = Pick<ReferencedNft, "contract" | "token">;

type SerializedHashtagNode = Spread<
  {
    hashtagName: string;
    nftContract?: string | null;
    nftToken?: string | null;
  },
  SerializedTextNode
>;

function convertHashtagElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const nftContract = domNode.dataset["mentionedNftContract"];
    const nftToken = domNode.dataset["mentionedNftToken"];
    const node = $createHashtagNode(
      textContent,
      nftContract && nftToken ? { contract: nftContract, token: nftToken } : null
    );
    return {
      node,
    };
  }

  return null;
}

export class HashtagNode extends TextNode {
  __hashtag: string;
  __nftContract: string | null;
  __nftToken: string | null;

  static override getType(): string {
    return "hashtag";
  }

  static override clone(node: HashtagNode): HashtagNode {
    const referencedNft =
      node.__nftContract && node.__nftToken
        ? { contract: node.__nftContract, token: node.__nftToken }
        : null;
    return new HashtagNode(
      node.__hashtag,
      referencedNft,
      node.__text,
      node.__key
    );
  }
  static override importJSON(
    serializedNode: SerializedHashtagNode
  ): HashtagNode {
    const referencedNft =
      serializedNode.nftContract && serializedNode.nftToken
        ? {
            contract: serializedNode.nftContract,
            token: serializedNode.nftToken,
          }
        : null;
    const node = $createHashtagNode(serializedNode.hashtagName, referencedNft);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(
    hashtagName: string,
    referencedNft: NftReferenceIdentity | null = null,
    text?: string,
    key?: NodeKey
  ) {
    super(text ?? hashtagName, key);
    this.__hashtag = hashtagName;
    this.__nftContract = referencedNft?.contract ?? null;
    this.__nftToken = referencedNft?.token ?? null;
  }

  override exportJSON(): SerializedHashtagNode {
    return {
      ...super.exportJSON(),
      hashtagName: this.__hashtag,
      nftContract: this.__nftContract,
      nftToken: this.__nftToken,
      type: "hashtag",
      version: 1,
    };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = "editor-hashtag";

    return dom;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-hashtag", "true");
    if (this.__nftContract && this.__nftToken) {
      element.dataset["mentionedNftContract"] = this.__nftContract;
      element.dataset["mentionedNftToken"] = this.__nftToken;
    }

    element.textContent = this.__text;

    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
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

  override isTextEntity(): true {
    return true;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }

  getReferencedNft(): ReferencedNft | null {
    if (!this.__nftContract || !this.__nftToken) {
      return null;
    }
    const name = this.getTextContent().replace(/^\$/, "");
    if (!name) {
      return null;
    }
    return {
      contract: this.__nftContract,
      token: this.__nftToken,
      name,
    };
  }
}

export function $createHashtagNode(
  hashtagName: string,
  referencedNft: NftReferenceIdentity | null = null
): HashtagNode {
  const hashtagNode = new HashtagNode(hashtagName, referencedNft);
  hashtagNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(hashtagNode);
}

export function $isHashtagNode(
  node: LexicalNode | null | undefined
): node is HashtagNode {
  return node instanceof HashtagNode;
}
