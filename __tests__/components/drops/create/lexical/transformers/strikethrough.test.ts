jest.unmock("lexical");

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  registerMarkdownShortcuts,
} from "@lexical/markdown";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createEditor,
  DELETE_CHARACTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { registerInlineFormatEditing } from "@/components/drops/create/lexical/utils/inlineFormatEditing";
import { mergeRegister } from "@lexical/utils";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { render } from "@testing-library/react";
import { createElement } from "react";

const mockUseLexicalComposerContext = jest.fn();
jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: () => mockUseLexicalComposerContext(),
}));
import { registerRichText } from "@lexical/rich-text";
import ExampleTheme from "@/components/drops/create/lexical/ExampleTheme";
import {
  SAFE_MARKDOWN_TRANSFORMERS,
  SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE,
} from "@/components/drops/create/lexical/transformers/markdownTransformers";

const textTransformers = SAFE_MARKDOWN_TRANSFORMERS.filter(
  (transformer) => transformer.type === "text-format"
);

describe("editor inline formatting", () => {
  let editor: LexicalEditor;
  let root: HTMLDivElement;
  let unregister: () => void;

  beforeEach(() => {
    root = document.createElement("div");
    root.contentEditable = "true";
    document.body.append(root);
    editor = createEditor({
      theme: ExampleTheme,
      onError: (error) => {
        throw error;
      },
    });
    editor.setRootElement(root);
    editor.update(
      () => {
        $getRoot().append($createParagraphNode()).selectEnd();
      },
      { discrete: true }
    );
    mockUseLexicalComposerContext.mockReturnValue([editor]);
    const history = render(createElement(HistoryPlugin));
    unregister = mergeRegister(
      registerInlineFormatEditing(editor, textTransformers),
      registerMarkdownShortcuts(editor, textTransformers),
      registerRichText(editor),
      history.unmount
    );
  });

  afterEach(() => {
    unregister();
    editor.setRootElement(null);
    root.remove();
  });

  const typeText = async (text: string) => {
    for (const character of text) {
      editor.update(
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            throw new Error("Expected a text selection");
          }
          selection.insertText(character);
        },
        { discrete: true }
      );
      await Promise.resolve();
    }
  };

  const update = async (callback: () => void) => {
    editor.update(callback, { discrete: true });
    await Promise.resolve();
  };

  const backspace = () =>
    update(() => {
      editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
    });

  const selectStrike = async (start = 0, end?: number) =>
    update(() => {
      const node = $getRoot()
        .getAllTextNodes()
        .find((text) => text.hasFormat("strikethrough"));
      if (!node) throw new Error("Expected struck text");
      const selection = node.select(start, end ?? node.getTextContentSize());
      selection.format = node.getFormat();
    });

  it.each(["~test~", "~~test~~"])(
    "reverses %s with immediate Backspace",
    async (markdown) => {
      await typeText("prefix " + markdown);
      await backspace();
      expect(root.textContent).toBe("prefix " + markdown.slice(0, -1));
      expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
      await typeText("~");
      expect(
        root.querySelector(".editor-text-strikethrough")
      ).toHaveTextContent("test");
    }
  );

  it.each(["", "no strikethrough, "])(
    "clears strike after deleting the entire word following %j",
    async (prefix) => {
      await typeText(prefix + "~test~");
      await selectStrike();
      await backspace();
      await typeText("normal");
      expect(root.textContent).toBe(prefix + "normal");
      expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
    }
  );

  it("preserves strike after a partial deletion", async () => {
    await typeText("plain ~test~");
    await selectStrike(3, 4);
    await backspace();
    await typeText("ting");
    expect(root.querySelector(".editor-text-strikethrough")).toHaveTextContent(
      "testing"
    );
  });

  it.each(["*test*", "**test**", "***test***", "`test`", "==test=="])(
    "reverses the inline shortcut %s",
    async (markdown) => {
      await typeText("plain " + markdown);
      expect(root.textContent).toBe("plain test");
      await backspace();
      expect(root.textContent).toBe("plain " + markdown.slice(0, -1));
      await typeText(markdown.slice(-1));
      expect(root.textContent).toBe("plain test");
    }
  );

  it.each([
    "bold",
    "italic",
    "underline",
    "strikethrough",
    "code",
    "highlight",
    "subscript",
    "superscript",
  ] as const)(
    "clears deleted %s formatting while retaining surrounding text",
    async (format) => {
      await typeText("plain word");
      await update(() => {
        const node = $getRoot().getAllTextNodes()[0];
        if (!node) throw new Error("Expected text");
        node.select(6, 10);
        const selection = $getSelection();
        if ($isRangeSelection(selection)) selection.formatText(format);
      });
      await backspace();
      await typeText("normal");
      expect(root.textContent).toBe("plain normal");
      expect(
        editor.getEditorState().read(() =>
          $getRoot()
            .getAllTextNodes()
            .some((node) => node.hasFormat(format))
        )
      ).toBe(false);
    }
  );

  it("retains an enclosing format after deleting a nested formatted word", async () => {
    await typeText("plain ~word~");
    await update(() => {
      for (const node of $getRoot().getAllTextNodes())
        node.toggleFormat("bold");
    });
    await selectStrike();
    await backspace();
    await typeText("normal");
    expect(root.textContent).toBe("plain normal");
    expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
    expect(root.querySelector(".editor-text-bold")).toHaveTextContent(
      "plain normal"
    );
  });

  it("reverses a nested shortcut without removing its existing bold text", async () => {
    await typeText("~**test**~");
    await backspace();
    expect(root.textContent).toBe("~test");
    expect(root.querySelector(".editor-text-bold")).toHaveTextContent("test");
    expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
  });

  it("preserves text after the cursor when reversing a shortcut", async () => {
    await typeText("prefix suffix");
    await update(() => {
      $getRoot().getAllTextNodes()[0]?.select(7, 7);
    });
    await typeText("~test~");
    await backspace();
    expect(root.textContent).toBe("prefix ~testsuffix");
  });

  it.each([
    {
      name: "an explicit format command",
      change: () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
      },
    },
    {
      name: "a node style update without a text change",
      change: () => {
        $getRoot().getAllTextNodes()[0]?.setStyle("color: red");
      },
    },
    {
      name: "cursor movement away and back",
      change: () => {
        $getRoot().getAllTextNodes()[0]?.select(0, 0);
      },
    },
  ])("uses normal deletion after $name", async ({ change }) => {
    await typeText("~hi~");
    await update(change);
    await update(() => {
      $getRoot().getAllTextNodes()[0]?.selectEnd();
    });
    // Observe normal command fallthrough before jsdom's unsupported native
    // Selection.modify is reached. The shortcut must not restore old content.
    const normalDelete = jest.fn(() => true);
    const unregister = editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      normalDelete,
      COMMAND_PRIORITY_LOW
    );
    try {
      await backspace();
      expect(normalDelete).toHaveBeenCalledTimes(1);
      expect(root.textContent).toBe("hi");
    } finally {
      unregister();
    }
  });

  it("does not restore over a content update in the same command transaction", async () => {
    await typeText("~hi~");
    const normalDelete = jest.fn(() => true);
    const unregister = editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      normalDelete,
      COMMAND_PRIORITY_LOW
    );
    try {
      await update(() => {
        $getRoot().getAllTextNodes()[0]?.setStyle("color: red");
        editor.dispatchCommand(DELETE_CHARACTER_COMMAND, true);
      });
      expect(normalDelete).toHaveBeenCalledTimes(1);
      expect(root.textContent).toBe("hi");
      expect(
        editor
          .getEditorState()
          .read(() => $getRoot().getAllTextNodes()[0]?.getStyle())
      ).toBe("color: red");
    } finally {
      unregister();
    }
  });

  it("supports undo and redo of shortcut reversal", async () => {
    await typeText("~test~");
    await backspace();
    await update(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    expect(root.querySelector(".editor-text-strikethrough")).toHaveTextContent(
      "test"
    );
    await update(() => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    expect(root.textContent).toBe("~test");
    expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
  });

  it.each(["~hi~", "~~hi~~"])(
    "previews %s as it is typed and exports strikethrough",
    async (markdown) => {
      await typeText(markdown.slice(0, -1));
      expect(root.textContent).toBe(markdown.slice(0, -1));
      expect(root.querySelector(".editor-text-strikethrough")).toBeNull();

      await typeText(markdown.slice(-1));
      const struck = root.querySelector(".editor-text-strikethrough");
      expect(struck).toHaveTextContent("hi");
      expect(root.textContent).toBe("hi");
      expect(
        editor
          .getEditorState()
          .read(() => $convertToMarkdownString(textTransformers))
      ).toBe("~~hi~~");
    }
  );

  it.each([
    { name: "compose", transformers: SAFE_MARKDOWN_TRANSFORMERS },
    { name: "edit", transformers: SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE },
  ])("imports either syntax for $name", ({ transformers }) => {
    const formats = transformers.filter(
      (transformer) => transformer.type === "text-format"
    );
    editor.update(
      () => {
        $convertFromMarkdownString("~hi~ and ~~bye~~", formats);
      },
      { discrete: true }
    );
    expect(root.textContent).toBe("hi and bye");
    expect(root.querySelectorAll(".editor-text-strikethrough")).toHaveLength(2);
  });

  it.each(["~hi", "hi~", "`~hi~`"])(
    "does not import %s as strikethrough",
    (markdown) => {
      editor.update(
        () => {
          $convertFromMarkdownString(markdown, textTransformers);
        },
        { discrete: true }
      );
      expect(root.querySelector(".editor-text-strikethrough")).toBeNull();
    }
  );

  it("keeps the strike visible when combined with underline", async () => {
    await typeText("~hi~");
    editor.update(
      () => {
        $getRoot().getAllTextNodes()[0]?.toggleFormat("underline");
      },
      { discrete: true }
    );
    expect(
      root.querySelector(".editor-text-underlineStrikethrough")
    ).toHaveTextContent("hi");
  });
});
