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
  type LexicalEditor,
} from "lexical";
import ExampleTheme from "@/components/drops/create/lexical/ExampleTheme";
import {
  SAFE_MARKDOWN_TRANSFORMERS,
  SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE,
} from "@/components/drops/create/lexical/transformers/markdownTransformers";

const textTransformers = SAFE_MARKDOWN_TRANSFORMERS.filter(
  (transformer) => transformer.type === "text-format"
);

describe("editor strikethrough", () => {
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
    unregister = registerMarkdownShortcuts(editor, textTransformers);
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
