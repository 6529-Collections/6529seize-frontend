jest.unmock("lexical");

import { $getRoot, createEditor, type EditorConfig } from "lexical";
import {
  ImageNode,
  $createImageNode,
  $isImageNode,
} from "@/components/drops/create/lexical/nodes/ImageNode";

const createImageEditor = () =>
  createEditor({
    namespace: "image-node-test",
    nodes: [ImageNode],
    onError: (error) => {
      throw error;
    },
  });

describe("ImageNode", () => {
  it("preserves image serialization without saving transient upload previews", () => {
    const editor = createImageEditor();
    editor.update(
      () => {
        const node = $createImageNode({
          src: "img.png",
          altText: "alt",
          width: 10,
          height: 20,
          previewSrc: "blob:temporary",
        });
        const json = node.exportJSON();
        expect(json).toEqual({
          type: "image",
          version: 1,
          src: "img.png",
          altText: "alt",
          width: 10,
          height: 20,
        });
        const imported = ImageNode.importJSON(json);
        expect(imported.getSrc()).toBe("img.png");
        expect($isImageNode(imported)).toBe(true);
      },
      { discrete: true }
    );
  });

  it("completes an upload without replacing its node or changing image metadata", () => {
    const editor = createImageEditor();
    let imageKey = "";
    let uploadToken: object | undefined;
    editor.update(
      () => {
        const node = $createImageNode({
          src: "loading",
          altText: "alt",
          width: 10,
          height: 20,
        });
        $getRoot().append(node);
        imageKey = node.getKey();
        uploadToken = node.getUploadToken();
        node.setPreviewSrc("blob:temporary");
      },
      { discrete: true }
    );
    editor.update(
      () => {
        const node = $getRoot().getFirstChildOrThrow<ImageNode>();
        node.setSrc("https://example.com/image.png");
        const current = $getRoot().getFirstChildOrThrow<ImageNode>();
        expect(current.getKey()).toBe(imageKey);
        expect(current.getUploadToken()).toBe(uploadToken);
        expect(current.exportJSON()).toMatchObject({
          src: "https://example.com/image.png",
          altText: "alt",
          width: 10,
          height: 20,
        });
      },
      { discrete: true }
    );
  });

  it("reserves a compact frame before the lazy image component loads", () => {
    const editor = createImageEditor();
    editor.update(
      () => {
        const node = $createImageNode({ src: "loading" });
        const span = node.createDOM({
          theme: { image: "cls" },
        } as EditorConfig);
        expect(span.classList.contains("cls")).toBe(true);
        expect(span.style.height).toContain("--composer-image-height");
        expect(node.updateDOM()).toBe(false);
      },
      { discrete: true }
    );
  });
});
