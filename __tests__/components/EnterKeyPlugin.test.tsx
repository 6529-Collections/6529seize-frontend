import React from "react";
import { render } from "@testing-library/react";
import EnterKeyPlugin from "../../components/drops/create/lexical/plugins/enter/EnterKeyPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRangeSelection,
} from "lexical";

const registerMock = jest.fn();
let commandHandler: ((event?: any) => boolean | undefined) | undefined;

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock("lexical", () => {
  const paragraphNodes: Array<{ append: jest.Mock; selectStart: jest.Mock }> = [];
  const mock = {
    KEY_ENTER_COMMAND: "enter",
    COMMAND_PRIORITY_HIGH: 0,
    $createParagraphNode: jest.fn(() => {
      const node = {
        append: jest.fn(),
        selectStart: jest.fn(),
      };
      paragraphNodes.push(node);
      return node;
    }),
    $getSelection: jest.fn(),
    $insertNodes: jest.fn(),
    $isNodeSelection: jest.fn(),
    $isRangeSelection: jest.fn(),
    __paragraphNodes: paragraphNodes,
  };

  return mock;
});

const lexicalMock = jest.requireMock("lexical") as {
  __paragraphNodes: Array<{ append: jest.Mock; selectStart: jest.Mock }>;
};

jest.mock("@lexical/list", () => ({
  $isListItemNode: jest.fn(() => false),
  $isListNode: jest.fn(() => false),
}));

jest.mock("@lexical/rich-text", () => ({
  $isHeadingNode: jest.fn(() => false),
}));

const headingMock = jest.requireMock("@lexical/rich-text");

jest.mock("../../hooks/isMobileDevice", () => jest.fn(() => false));
const isMobileMock = jest.requireMock("../../hooks/isMobileDevice");

jest.mock("../../hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  lexicalMock.__paragraphNodes.length = 0;
  commandHandler = undefined;

  registerMock.mockImplementation((_command: string, fn: (event?: any) => boolean | undefined) => {
    commandHandler = fn;
    return () => {};
  });

  (useLexicalComposerContext as jest.Mock).mockReturnValue([
    {
      registerCommand: registerMock,
      update: (fn: () => void) => fn(),
    },
  ]);
});

describe("EnterKeyPlugin", () => {
  it("returns false when disabled", () => {
    render(
      <EnterKeyPlugin disabled handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />
    );

    expect(commandHandler).toBeDefined();

    const event = { preventDefault: jest.fn(), shiftKey: false } as any;
    const result = commandHandler?.(event);

    expect(result).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("submits on enter when enabled", () => {
    const handleSubmit = jest.fn();
    render(
      <EnterKeyPlugin disabled={false} handleSubmit={handleSubmit} canSubmitWithEnter={() => true} />
    );

    const event = { preventDefault: jest.fn(), shiftKey: false } as any;
    const result = commandHandler?.(event);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("delegates to lexical on mobile", () => {
    isMobileMock.mockReturnValueOnce(true);

    render(
      <EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />
    );

    const result = commandHandler?.({ shiftKey: false } as any);

    expect(result).toBe(true);
  });

  it("inserts a paragraph for range selections on shift+enter", () => {
    const anchorParent = {};
    const firstSelection = {
      anchor: {
        getNode: () => ({
          getParent: () => null,
          getTopLevelElement: () => anchorParent,
        }),
      },
    };
    const rangeSelection = { insertParagraph: jest.fn() };

    ($getSelection as jest.Mock).mockReturnValueOnce(firstSelection).mockReturnValueOnce(rangeSelection);
    ($isRangeSelection as jest.Mock).mockReturnValue(true);
    ($isNodeSelection as jest.Mock).mockReturnValue(false);

    render(
      <EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />
    );

    const event = { preventDefault: jest.fn(), shiftKey: true } as any;
    const result = commandHandler?.(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(rangeSelection.insertParagraph).toHaveBeenCalledTimes(1);
    expect($insertNodes).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("inserts and selects a paragraph for node selections", () => {
    const nodeSelection = {};

    ($getSelection as jest.Mock)
      .mockReturnValueOnce(nodeSelection)
      .mockReturnValueOnce(nodeSelection);
    ($isRangeSelection as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    ($isNodeSelection as jest.Mock)
      .mockReturnValueOnce(true);

    render(
      <EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />
    );

    commandHandler?.({ preventDefault: jest.fn(), shiftKey: true } as any);

    expect($insertNodes).toHaveBeenCalledTimes(1);
    const paragraphNode = lexicalMock.__paragraphNodes[0];
    expect(paragraphNode.selectStart).toHaveBeenCalledTimes(1);
  });

  it("converts heading splits into paragraphs", () => {
    const headingChildren = ["child-a", "child-b"];
    const topLevelHeading = {
      getChildren: jest.fn(() => headingChildren),
      replace: jest.fn(),
    };
    const anchorNode = {
      getParent: () => null,
      getTopLevelElement: () => topLevelHeading,
      getTopLevelElementOrThrow: () => topLevelHeading,
    };
    const firstSelection = { anchor: { getNode: () => anchorNode } };
    const rangeSelection = {
      insertParagraph: jest.fn(),
      anchor: { getNode: () => anchorNode },
    };

    ($getSelection as jest.Mock)
      .mockReturnValueOnce(firstSelection)
      .mockReturnValueOnce(rangeSelection)
      .mockReturnValueOnce(rangeSelection);
    ($isRangeSelection as jest.Mock).mockReturnValue(true);
    headingMock.$isHeadingNode.mockReturnValueOnce(true).mockReturnValueOnce(true);

    render(
      <EnterKeyPlugin disabled={false} handleSubmit={jest.fn()} canSubmitWithEnter={() => true} />
    );

    const event = { preventDefault: jest.fn(), shiftKey: true } as any;
    commandHandler?.(event);

    const paragraphNode = lexicalMock.__paragraphNodes[0];

    expect(rangeSelection.insertParagraph).toHaveBeenCalledTimes(1);
    expect(paragraphNode.append).toHaveBeenCalledWith(...headingChildren);
    expect(topLevelHeading.replace).toHaveBeenCalledWith(paragraphNode);
    expect(paragraphNode.selectStart).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});
