import { render } from "@testing-library/react";
import React, { createRef } from "react";
import InsertTextPlugin, {
  type InsertTextPluginHandles,
} from "@/components/drops/create/lexical/plugins/InsertTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

jest.mock("@lexical/react/LexicalComposerContext");

const selectEndMock = jest.fn();
const getRootMock = jest.fn(() => ({
  selectEnd: selectEndMock,
}));
const getSelectionMock = jest.fn();
const insertNodesMock = jest.fn();
const isRangeSelectionMock = jest.fn((selection: unknown) =>
  Boolean(
    (selection as { readonly __isRangeSelection?: boolean } | null)
      ?.__isRangeSelection
  )
);
const isTextNodeMock = jest.fn((node: unknown) =>
  Boolean((node as { readonly __isTextNode?: boolean } | null)?.__isTextNode)
);

jest.mock("lexical", () => ({
  $createTextNode: jest.fn((text: string) => ({
    __isTextNode: true,
    text,
    insertAfter: jest.fn(),
    selectEnd: jest.fn(),
  })),
  $getRoot: () => getRootMock(),
  $getSelection: () => getSelectionMock(),
  $insertNodes: (...args: unknown[]) => insertNodesMock(...args),
  $isRangeSelection: (selection: unknown) => isRangeSelectionMock(selection),
  $isTextNode: (node: unknown) => isTextNodeMock(node),
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

const useCtx = useLexicalComposerContext as jest.Mock;

type MockSelection = {
  readonly __isRangeSelection: true;
  readonly anchor: {
    readonly getNode: () => {
      readonly __isTextNode: true;
      getTextContent: () => string;
    };
    readonly offset: number;
  };
  readonly isCollapsed: () => boolean;
  readonly insertRawText: jest.Mock;
};

const createSelection = ({
  text,
  offset,
  collapsed = true,
}: {
  readonly text: string;
  readonly offset: number;
  readonly collapsed?: boolean;
}): MockSelection => {
  const node = {
    __isTextNode: true as const,
    getTextContent: () => text,
  };

  return {
    __isRangeSelection: true as const,
    anchor: {
      getNode: () => node,
      offset,
    },
    isCollapsed: () => collapsed,
    insertRawText: jest.fn(),
  };
};

describe("InsertTextPlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserts text with smart spacing when needed", () => {
    const selection = createSelection({ text: "helloworld", offset: 5 });
    getSelectionMock.mockReturnValue(selection);

    const update = jest.fn((fn: () => void) => fn());
    useCtx.mockReturnValue([{ update }]);

    const ref = createRef<InsertTextPluginHandles>();
    render(<InsertTextPlugin ref={ref} />);

    ref.current?.insertTextAtCursor("https://media.tenor.com/abc/tenor.gif", {
      smartSpacing: true,
    });

    expect(selection.insertRawText).toHaveBeenCalledWith(
      " https://media.tenor.com/abc/tenor.gif "
    );
  });

  it("falls back to end selection when no cursor selection exists", () => {
    const fallbackSelection = createSelection({ text: "hello", offset: 5 });
    getSelectionMock
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(fallbackSelection);

    selectEndMock.mockImplementation(() => {
      return undefined;
    });

    const update = jest.fn((fn: () => void) => fn());
    useCtx.mockReturnValue([{ update }]);

    const ref = createRef<InsertTextPluginHandles>();
    render(<InsertTextPlugin ref={ref} />);

    ref.current?.insertTextAtCursor("https://media.tenor.com/abc/tenor.gif");

    expect(selectEndMock).toHaveBeenCalled();
    expect(fallbackSelection.insertRawText).toHaveBeenCalledWith(
      "https://media.tenor.com/abc/tenor.gif"
    );
  });

  it("inserts preview image node for URL insertion", () => {
    const selection = createSelection({ text: "hello", offset: 5 });
    getSelectionMock.mockReturnValue(selection);

    const update = jest.fn((fn: () => void) => fn());
    useCtx.mockReturnValue([{ update }]);

    const ref = createRef<InsertTextPluginHandles>();
    render(<InsertTextPlugin ref={ref} />);

    ref.current?.insertImagePreviewFromUrl("https://example.com/cat.gif", {
      smartSpacing: true,
    });

    expect(createImageNodeMock).toHaveBeenCalledWith(
      expect.objectContaining({ src: "https://example.com/cat.gif" })
    );
    expect(insertNodesMock).toHaveBeenCalled();
  });
});
