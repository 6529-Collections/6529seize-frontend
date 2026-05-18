import React from "react";
import { act, render } from "@testing-library/react";
import DragDropPastePlugin from "@/components/drops/create/lexical/plugins/DragDropPastePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const toastMock = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ setToast: toastMock }),
}));

const editorState = { id: "editor-state" };
const update = (fn: any, options?: { onUpdate?: () => void }) => {
  fn();
  options?.onUpdate?.();
};
let commandHandler: any;
const editor = {
  registerCommand: jest.fn((_cmd: any, fn: any) => {
    commandHandler = fn;
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
  $insertNodes: jest.fn(),
  $getNodeByKey: jest.fn(() => ({ replace: jest.fn(), remove: jest.fn() })),
  COMMAND_PRIORITY_LOW: 1,
}));
jest.mock("@lexical/rich-text", () => ({ DRAG_DROP_PASTE: "PASTE" }));
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
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockResolvedValue([
      { file: new File(["a"], "a.png", { type: "image/png" }) },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uploads image on paste", async () => {
    renderPlugin();
    await act(async () => {
      await commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });
    expect(multiPartUpload).toHaveBeenCalled();
    expect($insertNodes).toHaveBeenCalled();
    expect($getNodeByKey).toHaveBeenCalledWith("1");
  });

  it("shows error when file unsupported", async () => {
    const { mediaFileReader } = require("@lexical/utils");
    (mediaFileReader as jest.Mock).mockResolvedValue([]);
    renderPlugin();
    await act(async () => {
      await commandHandler([new File(["a"], "a.txt", { type: "text/plain" })]);
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
      await commandHandler(files);
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
      await commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
      await Promise.resolve();
    });

    expect(onAttachmentFiles).not.toHaveBeenCalled();
    expect(multiPartUpload).not.toHaveBeenCalled();
    expect($insertNodes).not.toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalled();
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
      commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
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
      commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
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
      commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
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
      commandHandler([new File(["a"], "a.png", { type: "image/png" })]);
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
});

function renderPlugin(props = {}) {
  return render(<DragDropPastePlugin {...props} />);
}
