jest.mock("@lexical/markdown", () => ({
  __esModule: true,
  $convertToMarkdownString: jest.fn(),
}));

import {
  exportDropMarkdown,
  normalizeDropMarkdown,
} from "@/components/waves/drops/normalizeDropMarkdown";
import type { EditorState } from "lexical";

const BLANK_PARAGRAPH_SENTINEL = "\u2063__BLANK_PARAGRAPH__\u2063";

const {
  $convertToMarkdownString: convertToMarkdownStringMock,
} = jest.requireMock("@lexical/markdown") as {
  $convertToMarkdownString: jest.Mock;
};

const createEditorStateStub = (): EditorState =>
  ({
    read: (fn: () => string) => fn(),
  } as unknown as EditorState);

describe("exportDropMarkdown", () => {
  let editorState: EditorState;

  beforeEach(() => {
    editorState = createEditorStateStub();
    convertToMarkdownStringMock.mockReset();
  });

  it("returns markdown unchanged when no blank markers are present", () => {
    convertToMarkdownStringMock.mockReturnValue("First\n\nSecond");
    expect(exportDropMarkdown(editorState, [])).toBe("First\n\nSecond");
  });

  it("collapses a single blank paragraph marker into one additional newline", () => {
    convertToMarkdownStringMock.mockReturnValue(
      `First\n\n${BLANK_PARAGRAPH_SENTINEL}\n\nSecond`
    );
    expect(exportDropMarkdown(editorState, [])).toBe("First\n\n\nSecond");
  });

  it("collapses multiple blank markers into the correct newline count", () => {
    convertToMarkdownStringMock.mockReturnValue(
      `First\n\n${BLANK_PARAGRAPH_SENTINEL}\n\n${BLANK_PARAGRAPH_SENTINEL}\n\nSecond`
    );
    expect(exportDropMarkdown(editorState, [])).toBe("First\n\n\n\nSecond");
  });

  it("preserves trailing blank paragraphs", () => {
    convertToMarkdownStringMock.mockReturnValue(
      `First\n\n${BLANK_PARAGRAPH_SENTINEL}`
    );
    expect(exportDropMarkdown(editorState, [])).toBe("First\n\n\n");
  });

  it("preserves multiple trailing blank paragraphs", () => {
    convertToMarkdownStringMock.mockReturnValue(
      `First\n\n${BLANK_PARAGRAPH_SENTINEL}\n\n${BLANK_PARAGRAPH_SENTINEL}`
    );
    expect(exportDropMarkdown(editorState, [])).toBe("First\n\n\n\n");
  });

});

describe("normalizeDropMarkdown", () => {
  it("normalizes CRLF to LF", () => {
    expect(normalizeDropMarkdown("line1\r\nline2")).toBe("line1\nline2");
  });
});
