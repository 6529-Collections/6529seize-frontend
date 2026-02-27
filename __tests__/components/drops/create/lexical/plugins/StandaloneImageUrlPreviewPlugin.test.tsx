import { render } from "@testing-library/react";
import StandaloneImageUrlPreviewPlugin from "@/components/drops/create/lexical/plugins/StandaloneImageUrlPreviewPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_CRITICAL,
  KEY_SPACE_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { parseStandaloneMediaUrl } from "@/components/waves/drops/media-utils";

jest.mock("@lexical/react/LexicalComposerContext");

const getSelectionMock = jest.fn();
const isRangeSelectionMock = jest.fn((selection: unknown) =>
  Boolean(selection)
);
const isTextNodeMock = jest.fn((node: unknown) =>
  Boolean((node as { readonly __isTextNode?: boolean } | null)?.__isTextNode)
);
const createTextNodeMock = jest.fn((text: string) => ({
  __isTextNode: true,
  text,
  insertAfter: jest.fn(),
  selectEnd: jest.fn(),
  selectStart: jest.fn(),
}));
const getRootMock = jest.fn(() => ({ selectEnd: jest.fn() }));

jest.mock("lexical", () => ({
  $createTextNode: (text: string) => createTextNodeMock(text),
  $getRoot: () => getRootMock(),
  $getSelection: () => getSelectionMock(),
  $isRangeSelection: (selection: unknown) => isRangeSelectionMock(selection),
  $isTextNode: (node: unknown) => isTextNodeMock(node),
  COMMAND_PRIORITY_CRITICAL: 4,
  COMMAND_PRIORITY_NORMAL: 2,
  KEY_ENTER_COMMAND: "KEY_ENTER_COMMAND",
  KEY_SPACE_COMMAND: "KEY_SPACE_COMMAND",
  PASTE_COMMAND: "PASTE_COMMAND",
}));

const createImageNodeMock = jest.fn(
  (opts: { src: string; altText: string }) => ({
    ...opts,
    insertAfter: jest.fn(),
    selectNext: jest.fn(),
  })
);

jest.mock("@/components/drops/create/lexical/nodes/ImageNode", () => ({
  $createImageNode: (opts: { src: string; altText: string }) =>
    createImageNodeMock(opts),
}));

jest.mock("@/components/waves/drops/media-utils", () => ({
  parseStandaloneMediaUrl: jest.fn(),
}));

const useLexicalComposerContextMock = useLexicalComposerContext as jest.Mock;
const parseStandaloneMediaUrlMock = parseStandaloneMediaUrl as jest.Mock;

describe("StandaloneImageUrlPreviewPlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseStandaloneMediaUrlMock.mockImplementation((token: string) =>
      token.endsWith(".png") || token.endsWith(".gif")
        ? { type: "image", url: token, alt: "Media" }
        : null
    );
  });

  it("converts standalone image URL token on space key", () => {
    const commandHandlers = new Map<string, (event?: any) => boolean>();
    const editor = {
      registerCommand: jest.fn(
        (
          command: string,
          handler: (event?: any) => boolean,
          priority: number
        ) => {
          if (priority === COMMAND_PRIORITY_CRITICAL) {
            commandHandlers.set(command, handler);
          }
          return () => {};
        }
      ),
      update: (fn: () => void) => fn(),
    };
    useLexicalComposerContextMock.mockReturnValue([editor]);

    const urlTextNode = {
      __isTextNode: true as const,
      getTextContent: () => "https://example.com/cat.gif",
      replace: jest.fn(),
    };
    getSelectionMock.mockReturnValue({
      isCollapsed: () => true,
      anchor: {
        getNode: () => urlTextNode,
        offset: "https://example.com/cat.gif".length,
      },
    });

    render(<StandaloneImageUrlPreviewPlugin />);

    const preventDefault = jest.fn();
    const handled = commandHandlers.get(KEY_SPACE_COMMAND)?.({
      preventDefault,
    });

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(urlTextNode.replace).toHaveBeenCalled();
    expect(createImageNodeMock).toHaveBeenCalledWith(
      expect.objectContaining({ src: "https://example.com/cat.gif" })
    );
  });

  it("converts pasted standalone image URLs into preview image node", () => {
    const commandHandlers = new Map<string, (event?: any) => boolean>();
    const editor = {
      registerCommand: jest.fn(
        (command: string, handler: (event?: any) => boolean) => {
          commandHandlers.set(command, handler);
          return () => {};
        }
      ),
      update: (fn: () => void) => fn(),
    };
    useLexicalComposerContextMock.mockReturnValue([editor]);

    const insertNodes = jest.fn();
    getSelectionMock.mockReturnValue({
      isCollapsed: () => true,
      insertNodes,
      anchor: { getNode: () => null, offset: 0 },
    });

    render(<StandaloneImageUrlPreviewPlugin />);

    const preventDefault = jest.fn();
    const handled = commandHandlers.get(PASTE_COMMAND)?.({
      preventDefault,
      clipboardData: {
        files: [],
        getData: () => "https://example.com/banner.png",
      },
    });

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(insertNodes).toHaveBeenCalledWith([
      expect.objectContaining({ src: "https://example.com/banner.png" }),
    ]);
  });
});
