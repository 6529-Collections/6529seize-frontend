import { render } from "@testing-library/react";
import React, { createRef } from "react";
import type { ClearEditorPluginHandles } from "@/components/drops/create/lexical/plugins/ClearEditorPlugin";
import ClearEditorPlugin from "@/components/drops/create/lexical/plugins/ClearEditorPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

jest.mock("@lexical/react/LexicalComposerContext");

const clearMock = jest.fn();
const appendMock = jest.fn();
const selectMock = jest.fn();
const mockSetSelection = jest.fn();

const mockParagraphNode = {
  select: selectMock,
};

jest.mock("lexical", () => ({
  $getRoot: jest.fn(() => ({
    clear: clearMock,
    append: appendMock,
  })),
  $createParagraphNode: jest.fn(() => mockParagraphNode),
  $setSelection: (selection: null) => mockSetSelection(selection),
}));

const useCtx = useLexicalComposerContext as jest.Mock;

describe("ClearEditorPlugin", () => {
  it("clears the draft without stealing focus from another control", () => {
    const update = jest.fn((fn: () => void) => fn());
    useCtx.mockReturnValue([{ update, getRootElement: () => null }]);
    const ref = createRef<ClearEditorPluginHandles>();
    render(<ClearEditorPlugin ref={ref} />);
    ref.current!.clearEditorState();
    expect(update).toHaveBeenCalled();
    expect(clearMock).toHaveBeenCalled();
    expect(appendMock).toHaveBeenCalledWith(mockParagraphNode);
    expect(selectMock).not.toHaveBeenCalled();
    expect(mockSetSelection).toHaveBeenCalledWith(null);
  });
});
