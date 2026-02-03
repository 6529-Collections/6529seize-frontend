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

type SerializedWaveMentionNode = Spread<
  {
    waveName: string;
  },
  SerializedTextNode
>;

function convertWaveMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;

  return {
    node: $createWaveMentionNode(textContent),
  };
}

export class WaveMentionNode extends TextNode {
  __waveName: string;

  static override getType(): string {
    return "wave-mention";
  }

  static override clone(node: WaveMentionNode): WaveMentionNode {
    return new WaveMentionNode(node.__waveName, node.__text, node.__key);
  }

  static override importJSON(
    serializedNode: SerializedWaveMentionNode
  ): WaveMentionNode {
    const node = $createWaveMentionNode(serializedNode.waveName);
    node.setTextContent(serializedNode.text);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  constructor(waveName: string, text?: string, key?: NodeKey) {
    super(text ?? waveName, key);
    this.__waveName = waveName;
  }

  override exportJSON(): SerializedWaveMentionNode {
    return {
      ...super.exportJSON(),
      waveName: this.__waveName,
      type: "wave-mention",
      version: 1,
    };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = "editor-wave-mention";
    return dom;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-lexical-wave-mention", "true");
    element.textContent = this.__text;
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-wave-mention")) {
          return null;
        }
        return {
          conversion: convertWaveMentionElement,
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
}

export function $createWaveMentionNode(waveName: string): WaveMentionNode {
  const waveMentionNode = new WaveMentionNode(waveName);
  waveMentionNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement(waveMentionNode);
}

export function $isWaveMentionNode(
  node: LexicalNode | null | undefined
): node is WaveMentionNode {
  return node instanceof WaveMentionNode;
}
