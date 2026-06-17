import React from "react";
import { act, render } from "@testing-library/react";
import DragDropPastePlugin from "@/components/drops/create/lexical/plugins/DragDropPastePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const toastMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: toastMock }),
}));

const editorState = { id: "editor-state" };
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
  update,
} as any;

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));
jest.mock("@/components/drops/create/lexical/nodes/ImageNode", () => ({
  $createImageNode: jest.fn(() => ({ getKey: () => "1" })),
}));
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(() => Promise.resolve({ url: "uploaded" })),
}));

jest.mock("lexical", () => ({
  $getSelection: jest.fn(() => selectionMock),
  $getNodeByKey: jest.fn(() => ({ replace: jest.fn(), remove: jest.fn() })),
  $insertNodes: jest.fn(),
  $isRangeSelection: jest.fn(() => true),
  COMMAND_PRIORITY_LOW: 1,
  PASTE_COMMAND: "PASTE_COMMAND",
}));
jest.mock("@lexical/rich-text", () => ({
  DRAG_DROP_PASTE: "DRAG_DROP_PASTE",
}));
jest.mock("@lexical/utils", () => ({
  isMimeType: jest.fn((file: File, acceptableTypes: string[]) =>
    acceptableTypes.some(
      (type) => file.type.startsWith(type) || file.type === type
    )
  ),
  mediaFileReader: jest.fn(() =>
    Promise.resolve([{ file: new File(["a"], "a.png", { type: "image/png" }) }])
  ),
}));

const { $insertNodes, $getNodeByKey } = require("lexical");
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
    selectionMock.insertParagraph.mockClear();
    selectionMock.insertRawText.mockClear();
    selectionMock.insertText.mockClear();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockResolvedValue([
      { file: new File(["a"], "a.png", { type: "image/png" }) },
    ]);
    (multiPartUpload as jest.Mock).mockResolvedValue({ url: "uploaded" });
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
  });

  it("uploads pasted HTML data images before Lexical imports the base64 src", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockImplementation((files: File[]) =>
      Promise.resolve(files.map((file) => ({ file })))
    );
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

  it("preserves pasted plain text when image paste includes text", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockImplementation((files: File[]) =>
      Promise.resolve(files.map((file) => ({ file })))
    );
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

  it("lets attachment-only paste fall through to Lexical", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    const preventDefault = jest.fn();

    renderPlugin();
    const handled = pasteHandler({
      preventDefault,
      clipboardData: {
        files: [new File(["a"], "a.pdf", { type: "application/pdf" })],
        items: [],
        getData: jest.fn(() => ""),
      },
    });

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(mediaFileReader).not.toHaveBeenCalled();
    expect(multiPartUpload).not.toHaveBeenCalled();
  });

  it("uploads HTML data images when clipboard files are not images", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockImplementation((files: File[]) =>
      Promise.resolve(
        files
          .filter((file) => file.type.startsWith("image/"))
          .map((file) => ({ file }))
      )
    );
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

    const fileReaderFiles = (mediaFileReader as jest.Mock).mock.calls[0][0];
    const uploadArg = (multiPartUpload as jest.Mock).mock.calls[0][0];
    expect(preventDefault).toHaveBeenCalled();
    expect(fileReaderFiles).toHaveLength(2);
    expect(fileReaderFiles[0]).toBe(textFile);
    expect(fileReaderFiles[1].name).toBe("pasted-image-0.png");
    expect(uploadArg.file.name).toBe("pasted-image-0.png");
    expect(uploadArg.file.type).toBe("image/png");
  });

  it("shows error when file unsupported", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockResolvedValue([]);
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
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockResolvedValue([]);
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

  it("does not add files or upload images when disabled before file reading finishes", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    let resolveFileReader: ((value: Array<{ file: File }>) => void) | undefined;
    const imageFile = new File(["a"], "a.png", { type: "image/png" });
    const attachmentFile = new File(["b"], "b.pdf", {
      type: "application/pdf",
    });
    const onAttachmentFiles = jest.fn();
    const onUploadEditorStateChange = jest.fn();

    (mediaFileReader as jest.Mock).mockReturnValue(
      new Promise<Array<{ file: File }>>((resolve) => {
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
      resolveFileReader?.([{ file: imageFile }]);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onAttachmentFiles).not.toHaveBeenCalled();
    expect($insertNodes).not.toHaveBeenCalled();
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
    expect(onUploadEditorStateChange).not.toHaveBeenCalled();
  });

  it("replaces loading image after parent rerenders with a new attachment handler", async () => {
    let resolveUpload: ((value: { url: string }) => void) | undefined;
    const replace = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue({ replace });
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

    expect(replace).toHaveBeenCalled();
  });

  it("finishes an in-flight inline upload after becoming disabled and syncs editor state", async () => {
    let resolveUpload: ((value: { url: string }) => void) | undefined;
    const replace = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue({ replace });
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

    expect(replace).toHaveBeenCalled();
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });

  it("removes loading image, shows an error, and syncs editor state when in-flight upload fails after becoming disabled", async () => {
    let rejectUpload: ((reason: Error) => void) | undefined;
    const remove = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue({ remove });
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
      message: "Upload failed",
      type: "error",
    });
    expect(onUploadEditorStateChange).toHaveBeenCalledWith(editorState);
  });

  it("removes loading image and shows an error when inline upload hangs", async () => {
    jest.useFakeTimers();
    const remove = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue({ remove });
    (multiPartUpload as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderPlugin();
    await act(async () => {
      dragDropPasteHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(30_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(remove).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith({
      message: "Image upload timed out. Please try again.",
      type: "error",
    });
  });

  it("removes loading image and syncs editor state when inline upload hangs after becoming disabled", async () => {
    jest.useFakeTimers();
    const remove = jest.fn();
    const onUploadEditorStateChange = jest.fn();
    ($getNodeByKey as jest.Mock).mockReturnValue({ remove });
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
      jest.advanceTimersByTime(30_000);
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
