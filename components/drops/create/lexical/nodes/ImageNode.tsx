/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

import { $applyNodeReplacement, DecoratorNode } from "lexical";
import * as React from "react";
import { Suspense, type JSX } from "react";

const ImageComponent = React.lazy(() => import("./ImageComponent"));

interface ImagePayload {
  key?: NodeKey | undefined;
  src: string;
  altText?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  previewSrc?: string | undefined;
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  const { src, alt, width, height } = img;
  const node = $createImageNode({ src, altText: alt, width, height });
  return { node };
}

type SerializedImageNode = Spread<
  {
    src: string;
    altText?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText?: string | undefined;
  __width?: number | undefined;
  __height?: number | undefined;
  // Local upload previews are transient and must never enter saved content.
  __previewSrc?: string | undefined;
  // History clones share this transient identity; discarded history can release it.
  __uploadToken: object = {};
  static override getType(): string {
    return "image";
  }

  static override clone(node: ImageNode): ImageNode {
    const clone = new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
      node.__previewSrc
    );
    clone.__uploadToken = node.__uploadToken;
    return clone;
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
      height,
    });

    return node;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText?: string,
    width?: number,
    height?: number,
    key?: NodeKey,
    previewSrc?: string
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__previewSrc = previewSrc;
  }

  override exportJSON(): SerializedImageNode {
    return {
      src: this.getSrc(),
      type: "image",
      version: 1,
      altText: this.getAltText(),
      width: this.getWidth(),
      height: this.getHeight(),
    };
  }

  // View

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    // Reserve the footprint before the lazy decorator or image has loaded.
    span.classList.add("tw-my-2", "tw-block", "tw-w-80", "tw-max-w-full");
    span.style.height = "var(--composer-image-height, min(10rem, 16vh))";
    return span;
  }

  override updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText ?? "";
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  setSrc(src: string): void {
    const node = this.getWritable();
    node.__src = src;
    node.__previewSrc = undefined;
  }

  setPreviewSrc(src: string): void {
    this.getWritable().__previewSrc = src;
  }

  getUploadToken(): object {
    return this.__uploadToken;
  }

  override decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.getAltText()}
          nodeKey={this.getKey()}
          previewSrc={this.__previewSrc}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
  key,
  previewSrc,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, key, previewSrc)
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
