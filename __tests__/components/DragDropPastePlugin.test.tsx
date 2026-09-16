import { validateDropImageSignature } from "@/services/uploads/prepareDropImage";
import React from "react";
import { act, render, screen } from "@testing-library/react";
import DragDropPastePlugin from "@/components/drops/create/lexical/plugins/DragDropPastePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

jest.mock(
  "@/components/drops/create/lexical/plugins/InlineImageViewportPlugin",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

jest.mock("@/services/uploads/prepareDropImage", () => ({
  validateDropImageSignature: jest.fn(() => Promise.resolve()),
}));
const toastMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: toastMock }),
}));

const editorState = { id: "editor-state" };
const imageUploadToken = {};
const selectionMock = {
  insertParagraph: jest.fn(),
  insertRawText: jest.fn(),
  insertText: jest.fn(),
};
const update = (fn: any, options?: { onUpdate?: () => void }) => {
  fn();
  options?.onUpdate?.();
};
let dragDropPasteHandler: any;
let pasteHandler: any;
let updateListener: (event: { tags: Set<string> }) => void;
const editor = {
  registerCommand: jest.fn((cmd: any, fn: any) => {
    if (cmd === "PASTE_COMMAND") {
      pasteHandler = fn;
    } else {
      dragDropPasteHandler = fn;
    }
    return () => {};
  }),
  getEditorState: jest.fn(() => editorState),
  registerUpdateListener: jest.fn((listener) => {
    updateListener = listener;
    return () => {};
  }),
  update,
} as any;

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));
jest.mock("@/components/drops/create/lexical/nodes/ImageNode", () => ({
  $createImageNode: jest.fn(() => ({
    getKey: () => "1",
    getUploadToken: () => imageUploadToken,
  })),
  $isImageNode: jest.fn((node) => node !== null),
  ImageNode: class {},
}));
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(() => Promise.resolve({ url: "uploaded" })),
}));

jest.mock("lexical", () => ({
  $addUpdateTag: jest.fn(),
  $getSelection: jest.fn(() => selectionMock),
  $getNodeByKey: jest.fn(() => ({ replace: jest.fn(), remove: jest.fn() })),
  $insertNodes: jest.fn(),
  $isRangeSelection: jest.fn(() => true),
  $nodesOfType: jest.fn(() => []),
  COMMAND_PRIORITY_LOW: 1,
  PASTE_COMMAND: "PASTE_COMMAND",
}));
jest.mock("@lexical/rich-text", () => ({
  DRAG_DROP_PASTE: "DRAG_DROP_PASTE",
}));

const { $insertNodes, $getNodeByKey, $nodesOfType } = require("lexical");
const {
  multiPartUpload,
} = require("@/components/waves/create-wave/services/multiPartUpload");
const {
  $createImageNode,
} = require("@/components/drops/create/lexical/nodes/ImageNode");
const { useAuth } = require("@/components/auth/Auth");

describe("DragDropPastePlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    editor.update = update;
    jest.mocked(validateDropImageSignature).mockResolvedValue(undefined);
    selectionMock.insertParagraph.mockClear();
    selectionMock.insertRawText.mockClear();
    selectionMock.insertText.mockClear();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
    (multiPartUpload as jest.Mock).mockResolvedValue({ url: "uploaded" });
    ($getNodeByKey as jest.Mock).mockReturnValue(createMockImageNode());
    ($nodesOfType as jest.Mock).mockReturnValue([]);
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uploads image on paste", async () => {
    renderPlugin();
    await act(async () => {
      await dragDropPasteHandler([
        new File(["a"], "a.png", { type: "image/png" }),
      ]);
      await Promise.resolve();
    });
    expect(multiPartUpload).toHaveBeenCalled();
    expect($insertNodes).toHaveBeenCalled();
    expect($getNodeByKey).toHaveBeenCalledWith("1");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("updates an existing live region while an image is uploading", async () => {
    let finish: (value: { url: string }) => void = () => {};
    (multiPartUpload as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderPlugin();
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
    });
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Uploading image");
    await act(async () => finish({ url: "uploaded" }));
    expect(status).toBeEmptyDOMElement();
  });

  it("waits for a nested paste transaction to commit before starting its uploads", async () => {
    let commit = () => {};
    editor.update = (run: () => void, options?: { onUpdate?: () => void }) => {
      commit = () => {
        editor.update = update;
        run();
        options?.onUpdate?.();
      };
    };
    renderPlugin();
    act(() => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
    });
    expect(multiPartUpload).not.toHaveBeenCalled();
    await act(async () => commit());
    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
  });

  it("does not recreate an image deleted while its upload is in flight", async () => {
    let finish: (value: { url: string }) => void = () => {};
    (multiPartUpload as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    renderPlugin();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
    });
    ($getNodeByKey as jest.Mock).mockReturnValue(null);
    await act(async () => finish({ url: "uploaded" }));
    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("resolves a pending placeholder restored by redo without another upload", async () => {
    renderPlugin();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
    });
    const restoredNode = createMockImageNode();
    ($getNodeByKey as jest.Mock).mockReturnValue(restoredNode);
    ($nodesOfType as jest.Mock).mockReturnValue([restoredNode]);
    act(() => updateListener({ tags: new Set(["historic"]) }));
    expect(restoredNode.setSrc).toHaveBeenCalledWith("uploaded");
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
  });

  it("does not apply a settled result to another image's pending history", async () => {
    renderPlugin();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
    });
    const unrelatedNode = createMockImageNode({ getUploadToken: () => ({}) });
    ($getNodeByKey as jest.Mock).mockReturnValue(unrelatedNode);
    ($nodesOfType as jest.Mock).mockReturnValue([unrelatedNode]);
    act(() => updateListener({ tags: new Set(["historic"]) }));
    expect(unrelatedNode.setSrc).not.toHaveBeenCalled();
    expect(unrelatedNode.remove).not.toHaveBeenCalled();
  });

  it("uploads pasted HTML data images before Lexical imports the base64 src", async () => {
    const preventDefault = jest.fn();
    const getData = jest.fn((type: string) =>
      type === "text/html"
        ? '<img src="data:image/png;base64,YQ==" alt="screenshot">'
        : ""
    );

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault,
        clipboardData: {
          files: [],
          items: [],
          getData,
        },
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(handled).toBe(true);
    });

    const uploadArg = (multiPartUpload as jest.Mock).mock.calls[0][0];
    expect(preventDefault).toHaveBeenCalled();
    expect(uploadArg.file).toBeInstanceOf(File);
    expect(uploadArg.file.name).toBe("pasted-image-0.png");
    expect(uploadArg.file.type).toBe("image/png");
    expect($insertNodes).toHaveBeenCalled();
  });

  it("inserts one image when Chrome exposes it in both clipboard collections", async () => {
    const imageOptions = { type: "image/png", lastModified: 1700000000000 };
    const listedImage = new File(["a"], "image.png", imageOptions);
    const itemImage = new File(["a"], "image.png", imageOptions);
    const preventDefault = jest.fn();

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault,
        clipboardData: {
          files: [listedImage],
          items: [
            { kind: "string", type: "text/html" },
            { kind: "file", type: "image/png", getAsFile: () => itemImage },
          ],
          getData: (type: string) =>
            type === "text/html"
              ? '<img src="https://example.com/image.png">'
              : "",
        },
      });
      expect(handled).toBe(true);
      await Promise.resolve();
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ path: "drop" })
    );
    const uploadedFile = (multiPartUpload as jest.Mock).mock.calls[0][0].file;
    expect(uploadedFile).toBe(listedImage);
    expect(uploadedFile).not.toBe(itemImage);
  });

  it("keeps a distinct clipboard item when the file list is populated", async () => {
    const listedImage = new File(["a"], "first.png", { type: "image/png" });
    const additionalImage = new File(["b"], "second.png", {
      type: "image/png",
    });

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault: jest.fn(),
        clipboardData: {
          files: [listedImage],
          items: [
            { kind: "file", type: "image/png", getAsFile: () => listedImage },
            {
              kind: "file",
              type: "image/png",
              getAsFile: () => additionalImage,
            },
          ],
          getData: () => "",
        },
      });
      expect(handled).toBe(true);
      await Promise.resolve();
    });

    expect($insertNodes).toHaveBeenCalledTimes(2);
    expect(multiPartUpload).toHaveBeenCalledTimes(2);
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: additionalImage, path: "drop" })
    );
  });

  it("handles a clipboard file list without items", async () => {
    const imageFile = new File(["a"], "image.png", { type: "image/png" });

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault: jest.fn(),
        clipboardData: {
          files: [imageFile],
          getData: () => "",
        },
      });
      expect(handled).toBe(true);
      await Promise.resolve();
    });

    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: imageFile, path: "drop" })
    );
  });

  it("keeps an item image alongside a listed attachment", async () => {
    const attachmentFile = new File(["a"], "file.pdf", {
      type: "application/pdf",
    });
    const imageFile = new File(["b"], "image.png", { type: "image/png" });
    const onAttachmentFiles = jest.fn();

    renderPlugin({ onAttachmentFiles });
    await act(async () => {
      const handled = pasteHandler({
        preventDefault: jest.fn(),
        clipboardData: {
          files: [attachmentFile],
          items: [
            { kind: "file", type: "image/png", getAsFile: () => imageFile },
          ],
          getData: () => "",
        },
      });
      expect(handled).toBe(true);
      await Promise.resolve();
    });

    expect(onAttachmentFiles).toHaveBeenCalledWith([attachmentFile]);
    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: imageFile, path: "drop" })
    );
  });

  it("uses a clipboard item image when the file list is empty", async () => {
    const imageFile = new File(["a"], "image.png", { type: "image/png" });

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault: jest.fn(),
        clipboardData: {
          files: [],
          items: [
            { kind: "file", type: "image/png", getAsFile: () => imageFile },
          ],
          getData: () => "",
        },
      });
      expect(handled).toBe(true);
      await Promise.resolve();
    });

    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: imageFile, path: "drop" })
    );
  });

  it("preserves pasted plain text when image paste includes text", async () => {
    const preventDefault = jest.fn();
    const imageFile = new File(["a"], "a.png", { type: "image/png" });

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault,
        clipboardData: {
          files: [imageFile],
          items: [],
          getData: jest.fn((type: string) =>
            type === "text/html"
              ? '<img src="data:image/png;base64,YQ==" alt="screenshot">'
              : type === "text/plain"
                ? "caption"
                : ""
          ),
        },
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(handled).toBe(true);
    });

    expect(preventDefault).toHaveBeenCalled();
    expect($insertNodes.mock.invocationCallOrder[0]).toBeLessThan(
      selectionMock.insertText.mock.invocationCallOrder[0]
    );
    expect(selectionMock.insertText).toHaveBeenCalledWith("caption");
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: imageFile, path: "drop" })
    );
  });

  it("adds pasted attachments and preserves text without HTML clipboard data", async () => {
    const preventDefault = jest.fn();
    const onAttachmentFiles = jest.fn();
    const file = new File(["a"], "a.pdf", { type: "application/pdf" });
    renderPlugin({ onAttachmentFiles });
    const handled = pasteHandler({
      preventDefault,
      clipboardData: {
        files: [file],
        items: [],
        getData: jest.fn((type: string) =>
          type === "text/plain" ? "caption" : ""
        ),
      },
    });

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(onAttachmentFiles).toHaveBeenCalledWith([file]);
    expect(selectionMock.insertText).toHaveBeenCalledWith("caption");
    expect(multiPartUpload).not.toHaveBeenCalled();
  });

  it("reports rejected pasted files while preserving clipboard text", () => {
    renderPlugin();
    const handled = pasteHandler({
      preventDefault: jest.fn(),
      clipboardData: {
        files: [new File(["a"], "photo.heic", { type: "image/heic" })],
        items: [],
        getData: (type: string) => (type === "text/plain" ? "keep this" : ""),
      },
    });
    expect(handled).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Unsupported file: photo.heic",
      })
    );
    expect(selectionMock.insertText).toHaveBeenCalledWith("keep this");
    expect(multiPartUpload).not.toHaveBeenCalled();
  });

  it("uploads HTML data images when clipboard files are not images", async () => {
    const preventDefault = jest.fn();
    const textFile = new File(["a"], "note.txt", { type: "text/plain" });

    renderPlugin();
    await act(async () => {
      const handled = pasteHandler({
        preventDefault,
        clipboardData: {
          files: [textFile],
          items: [],
          getData: jest.fn((type: string) =>
            type === "text/html"
              ? '<img src="data:image/png;base64,YQ==" alt="screenshot">'
              : ""
          ),
        },
      });
      await Promise.resolve();
      await Promise.resolve();
      expect(handled).toBe(true);
    });

    const uploadArg = (multiPartUpload as jest.Mock).mock.calls[0][0];
    expect(preventDefault).toHaveBeenCalled();
    expect(validateDropImageSignature).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("note.txt") })
    );
    expect(uploadArg.file.name).toBe("pasted-image-0.png");
    expect(uploadArg.file.type).toBe("image/png");
    expect(multiPartUpload).toHaveBeenCalledTimes(1);
    expect($insertNodes).toHaveBeenCalled();
  });

  it("shows error when file unsupported", async () => {
    renderPlugin();
    await act(async () => {
      await dragDropPasteHandler([
        new File(["a"], "a.txt", { type: "text/plain" }),
      ]);
      await Promise.resolve();
    });
    expect(toastMock).toHaveBeenCalled();
  });

  it("passes dropped video and document files to attachment handler", async () => {
    const onAttachmentFiles = jest.fn();
    const files = [
      new File(["a"], "a.mp4", { type: "video/mp4" }),
      new File(["b"], "b.pdf", { type: "application/pdf" }),
      new File(["c"], "c.csv", { type: "text/csv" }),
    ];

    renderPlugin({ onAttachmentFiles });
    await act(async () => {
      await dragDropPasteHandler(files);
      await Promise.resolve();
    });

    expect(onAttachmentFiles).toHaveBeenCalledWith(files);
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect($insertNodes).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("does not add files or upload images while disabled", async () => {
    const onAttachmentFiles = jest.fn();
    renderPlugin({ disabled: true, onAttachmentFiles });

    await act(async () => {
      await dragDropPasteHandler([
        new File(["a"], "a.png", { type: "image/png" }),
      ]);
      await Promise.resolve();
    });

    expect(onAttachmentFiles).not.toHaveBeenCalled();
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect($insertNodes).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
  });

  it("removes the pending image if disabled before validation finishes", async () => {
    const remove = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ remove })
    );
    let resolveFileReader: (() => void) | undefined;
    const imageFile = new File(["a"], "a.png", { type: "image/png" });
    const attachmentFile = new File(["b"], "b.pdf", {
      type: "application/pdf",
    });
    const onAttachmentFiles = jest.fn();
    const onUploadEditorStateChange = jest.fn();

    jest.mocked(validateDropImageSignature).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveFileReader = resolve;
      })
    );
    (multiPartUpload as jest.Mock).mockRejectedValue(
      new Error("Upload failed")
    );

    const { rerender } = renderPlugin({
      onAttachmentFiles,
      onUploadEditorStateChange,
    });

    act(() => {
      dragDropPasteHandler([imageFile, attachmentFile]);
    });

    rerender(
      <DragDropPastePlugin
        disabled
        onAttachmentFiles={onAttachmentFiles}
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );

    await act(async () => {
      resolveFileReader?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onAttachmentFiles).toHaveBeenCalledWith([attachmentFile]);
    expect($insertNodes).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
    expect($getNodeByKey).toHaveBeenCalledWith("1");
    expect(remove).toHaveBeenCalled();
  });

  it("removes a rejected image and synchronizes the disabled editor", async () => {
    const remove = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ remove })
    );
    let rejectValidation!: (error: Error) => void;
    jest.mocked(validateDropImageSignature).mockReturnValue(
      new Promise((_, reject) => {
        rejectValidation = reject;
      })
    );
    const onUploadEditorStateChange = jest.fn();
    const { rerender } = renderPlugin({ onUploadEditorStateChange });
    act(() =>
      dragDropPasteHandler([
        new File(["image"], "animated.avif", { type: "image/avif" }),
      ])
    );
    rerender(
      <DragDropPastePlugin
        disabled
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () =>
      rejectValidation(new Error("Animated AVIF is not supported"))
    );
    expect($getNodeByKey).toHaveBeenCalledWith("1");
    expect(remove).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Could not add animated.avif" })
    );
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });

  it("completes the same image after parent rerenders with a new attachment handler", async () => {
    let resolveUpload: ((value: { url: string }) => void) | undefined;
    const setSrc = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ setSrc })
    );
    (multiPartUpload as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );

    const { rerender } = render(
      <DragDropPastePlugin onAttachmentFiles={() => {}} />
    );
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    rerender(<DragDropPastePlugin onAttachmentFiles={() => {}} />);
    await act(async () => {
      resolveUpload?.({ url: "uploaded" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(setSrc).toHaveBeenCalledWith("uploaded");
  });

  it("finishes an in-flight inline upload after becoming disabled and syncs editor state", async () => {
    let resolveUpload: ((value: { url: string }) => void) | undefined;
    const setSrc = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ setSrc })
    );
    (multiPartUpload as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve;
      })
    );

    const { rerender } = render(
      <DragDropPastePlugin
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    rerender(
      <DragDropPastePlugin
        disabled
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () => {
      resolveUpload?.({ url: "uploaded" });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(setSrc).toHaveBeenCalledWith("uploaded");
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });

  it("removes loading image, shows an error, and syncs editor state when in-flight upload fails after becoming disabled", async () => {
    let rejectUpload: ((reason: Error) => void) | undefined;
    const remove = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ remove })
    );
    (multiPartUpload as jest.Mock).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUpload = reject;
      })
    );

    const { rerender } = render(
      <DragDropPastePlugin
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    rerender(
      <DragDropPastePlugin
        disabled
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () => {
      rejectUpload?.(new Error("Upload failed"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(remove).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Could not add a.png",
      description: "Upload failed",
      autoClose: false,
      type: "error",
    });
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });

  it("removes loading image and shows an error when inline upload hangs", async () => {
    jest.useFakeTimers();
    const remove = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ remove })
    );
    (multiPartUpload as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderPlugin();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(180_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(remove).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      title: "Could not add a.png",
      description: "Image upload timed out. Please try again.",
      autoClose: false,
      type: "error",
    });
  });

  it("removes loading image and syncs editor state when inline upload hangs after becoming disabled", async () => {
    jest.useFakeTimers();
    const remove = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue(
      createMockImageNode({ remove })
    );
    (multiPartUpload as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { rerender } = render(
      <DragDropPastePlugin
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    rerender(
      <DragDropPastePlugin
        disabled
        onUploadEditorStateChange={onUploadEditorStateChange}
      />
    );

    await act(async () => {
      jest.advanceTimersByTime(180_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(remove).toHaveBeenCalled();
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });
});

function renderPlugin(props = {}) {
  return render(<DragDropPastePlugin {...props} />);
}

function createMockImageNode(overrides = {}) {
  return {
    getKey: () => "1",
    getUploadToken: () => imageUploadToken,
    isAttached: () => true,
    getSrc: () => "loading",
    setSrc: jest.fn(),
    setPreviewSrc: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  };
}
