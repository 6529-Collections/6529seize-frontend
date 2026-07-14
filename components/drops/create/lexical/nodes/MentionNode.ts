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

type SerializedMentionNode = Spread<
  {
    mentionName: string;
    mentionedProfileId?: string | null;
  },
  SerializedTextNode
>;

function convertMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  if (textContent !== null) {
    const node = $createMentionNode(
      textContent,
      domNode.getAttribute("data-mentioned-profile-id")
    );
    return {
      node,
    };
  }

  return null;
}

export class MentionNode extends TextNode {
  __mention: string;
  __mentionedProfileId: string | null;

  static override getType(): string {
    return "mention";
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__mention,
      node.__mentionedProfileId,
      node.__text,
      node.__key
    );
  }
  static override importJSON(
    serializedNode: SerializedMentionNode
  ): MentionNode {
    const node = $createMentionNode(
      serializedNode.mentionName,
      serializedNode.mentionedProfileId ?? null
    );
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(
    mentionName: string,
    mentionedProfileId: string | null = null,
    text?: string,
    key?: NodeKey
  ) {
    super(text ?? mentionName, key);
    this.__mention = mentionName;
    this.__mentionedProfileId = mentionedProfileId;
  }

  override exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mention,
      mentionedProfileId: this.__mentionedProfileId,
      type: "mention",
      version: 1,
    };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = "editor-mention";
    return dom;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-mention", "true");
    if (this.__mentionedProfileId) {
      element.setAttribute(
        "data-mentioned-profile-id",
        this.__mentionedProfileId
      );
    }
    element.textContent = this.__text;
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-mention")) {
          return null;
        }
        return {
          conversion: convertMentionElement,
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

  getMentionedProfileId(): string | null {
    return this.__mentionedProfileId;
  }
}

export function $createMentionNode(
  mentionName: string,
  mentionedProfileId: string | null = null
): MentionNode {
  const mentionNode = new MentionNode(mentionName, mentionedProfileId);
  mentionNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode;
}
