import React from "react";
import { render } from "@testing-library/react";

import PlainTextPastePlugin from "@/components/drops/create/lexical/plugins/PlainTextPastePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";

type PasteHandler = (event: ClipboardEvent) => boolean;

let commandHandler: PasteHandler | undefined;

const registerCommandMock = jest.fn(
  (_command: unknown, handler: PasteHandler) => {
    commandHandler = handler;
    return jest.fn();
  }
);

const editor = {
  registerCommand: registerCommandMock,
  update: (fn: () => void) => fn(),
} as const;

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock("lexical", () => ({
  COMMAND_PRIORITY_LOW: 1,
  PASTE_COMMAND: "PASTE_COMMAND",
  $getSelection: jest.fn(),
  $isRangeSelection: jest.fn(),
}));

const createClipboardEvent = ({
  text = "",
  uriList = "",
  files = [],
}: {
  readonly text?: string;
  readonly uriList?: string;
  readonly files?: File[];
}) => {
  const preventDefault = jest.fn();
  const getData = jest.fn((mimeType: string) => {
    if (mimeType === "text/plain") {
      return text;
    }

    if (mimeType === "text/uri-list") {
      return uriList;
    }

    return "";
  });

  return {
    event: {
      preventDefault,
      clipboardData: {
        files,
        getData,
      },
    } as unknown as ClipboardEvent,
    preventDefault,
    getData,
  };
};

const renderPlugin = () => render(<PlainTextPastePlugin />);

const getCommandHandler = (): PasteHandler => {
  if (!commandHandler) {
    throw new Error("Paste command handler was not registered");
  }

  return commandHandler;
};

describe("PlainTextPastePlugin", () => {
  beforeEach(() => {
    commandHandler = undefined;
    registerCommandMock.mockClear();
    ($getSelection as jest.Mock).mockReset();
    ($isRangeSelection as jest.Mock).mockReset();
    (useLexicalComposerContext as jest.Mock).mockReturnValue([editor]);
  });

  it("registers paste command with low priority", () => {
    renderPlugin();

    expect(registerCommandMock).toHaveBeenCalledWith(
      PASTE_COMMAND,
      expect.any(Function),
      COMMAND_PRIORITY_LOW
    );
  });

  it("returns false when clipboardData is missing", () => {
    renderPlugin();

    const preventDefault = jest.fn();
    const handled = getCommandHandler()({
      preventDefault,
    } as unknown as ClipboardEvent);

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("returns false when paste includes files", () => {
    renderPlugin();

    const { event, preventDefault } = createClipboardEvent({
      text: "text",
      files: [{} as File],
    });

    const handled = getCommandHandler()(event);

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("returns false when plain text and uri list are empty", () => {
    renderPlugin();

    const { event, preventDefault } = createClipboardEvent({});
    const handled = getCommandHandler()(event);

    expect(handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("preserves pasted blank lines for range selections", () => {
    renderPlugin();

    const selection = {
      insertText: jest.fn(),
      insertParagraph: jest.fn(),
      insertRawText: jest.fn(),
    };
    ($getSelection as jest.Mock).mockReturnValue(selection);
    ($isRangeSelection as jest.Mock).mockReturnValue(true);

    const { event, preventDefault } = createClipboardEvent({
      text: "First\n\nSecond",
    });

    const handled = getCommandHandler()(event);

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(selection.insertText).toHaveBeenNthCalledWith(1, "First");
    expect(selection.insertParagraph).toHaveBeenCalledTimes(2);
    expect(selection.insertText).toHaveBeenNthCalledWith(2, "Second");
    expect(selection.insertRawText).not.toHaveBeenCalled();
  });

  it("falls back to text/uri-list when text/plain is empty", () => {
    renderPlugin();

    const selection = {
      insertText: jest.fn(),
      insertParagraph: jest.fn(),
      insertRawText: jest.fn(),
    };
    ($getSelection as jest.Mock).mockReturnValue(selection);
    ($isRangeSelection as jest.Mock).mockReturnValue(true);

    const { event, getData } = createClipboardEvent({
      text: "",
      uriList: "https://example.com",
    });

    const handled = getCommandHandler()(event);

    expect(handled).toBe(true);
    expect(getData).toHaveBeenCalledWith("text/plain");
    expect(getData).toHaveBeenCalledWith("text/uri-list");
    expect(selection.insertText).toHaveBeenCalledWith("https://example.com");
  });

  it("uses raw text insertion for non-range selections", () => {
    renderPlugin();

    const selection = {
      insertRawText: jest.fn(),
    };
    ($getSelection as jest.Mock).mockReturnValue(selection);
    ($isRangeSelection as jest.Mock).mockReturnValue(false);

    const { event } = createClipboardEvent({
      text: "First\n\nSecond",
    });

    const handled = getCommandHandler()(event);

    expect(handled).toBe(true);
    expect(selection.insertRawText).toHaveBeenCalledWith("First\n\nSecond");
  });
});
