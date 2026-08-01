/**
 * `@lexical/markdown` imports text-match transformers by doing
 * `textContent.match(importRegExp)` and then splitting the text node at
 * `match.index`. With a `g` flag `String.prototype.match` returns every match and
 * `index` is `undefined`, so the split falls back to offset 0 and lands in the
 * wrong place: any token that is not at the very start of the text was silently
 * left as literal markup.
 *
 * These tests drive the real Lexical engine, so they fail against the previous
 * global regexes and pass against the fixed ones.
 */
jest.unmock("lexical");

import { $convertFromMarkdownString } from "@lexical/markdown";
import { createEditor, $getRoot, type LexicalEditor } from "lexical";

import { MentionNode } from "@/components/drops/create/lexical/nodes/MentionNode";
import { WaveMentionNode } from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import { HashtagNode } from "@/components/drops/create/lexical/nodes/HashtagNode";
import { MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/WaveMentionTransformer";
import { HASHTAG_TRANSFORMER } from "@/components/drops/create/lexical/transformers/HastagTransformer";
import type { Transformer } from "@lexical/markdown";
import type { Klass, LexicalNode } from "lexical";

const importMarkdown = (
  markdown: string,
  transformers: Transformer[],
  nodes: Klass<LexicalNode>[]
): { text: string; editor: LexicalEditor } => {
  const editor = createEditor({
    nodes,
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () => {
      $convertFromMarkdownString(markdown, transformers);
    },
    { discrete: true }
  );
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return { text, editor };
};

const countNodes = (
  editor: LexicalEditor,
  predicate: (node: LexicalNode) => boolean
): number => {
  let count = 0;
  editor.getEditorState().read(() => {
    count = $getRoot().getAllTextNodes().filter(predicate).length;
  });
  return count;
};

describe("markdown import splits tokens at the right offset", () => {
  describe("user mentions", () => {
    const importMentions = (markdown: string) =>
      importMarkdown(markdown, [MENTION_TRANSFORMER], [MentionNode]);

    it("converts a mention that is not at the start of the text", () => {
      const { text, editor } = importMentions("hey @[bob] take a look");

      expect(text).toBe("hey @bob take a look");
      expect(countNodes(editor, (n) => n instanceof MentionNode)).toBe(1);
    });

    it("converts every mention in a run of them", () => {
      const { text, editor } = importMentions(
        "@[alice] @[bob] @[carol] please review"
      );

      expect(text).toBe("@alice @bob @carol please review");
      expect(countNodes(editor, (n) => n instanceof MentionNode)).toBe(3);
    });

    it("converts mentions separated by prose", () => {
      const { text } = importMentions(
        "ping @[alice] about it, then tell @[carol]"
      );

      expect(text).toBe("ping @alice about it, then tell @carol");
    });

    it("leaves surrounding text untouched when there are no mentions", () => {
      const { text, editor } = importMentions("no mentions here at all");

      expect(text).toBe("no mentions here at all");
      expect(countNodes(editor, (n) => n instanceof MentionNode)).toBe(0);
    });

    it("does not convert an unbracketed handle", () => {
      const { text, editor } = importMentions("hello @bob");

      expect(text).toBe("hello @bob");
      expect(countNodes(editor, (n) => n instanceof MentionNode)).toBe(0);
    });
  });

  describe("wave mentions", () => {
    it("converts a wave mention that is not at the start of the text", () => {
      const { text, editor } = importMarkdown(
        "check #[Some Wave] later",
        [WAVE_MENTION_TRANSFORMER],
        [WaveMentionNode]
      );

      expect(text).toBe("check #Some Wave later");
      expect(countNodes(editor, (n) => n instanceof WaveMentionNode)).toBe(1);
    });

    it("converts several wave mentions in one line", () => {
      const { editor } = importMarkdown(
        "#[Wave One] and #[Wave Two] both",
        [WAVE_MENTION_TRANSFORMER],
        [WaveMentionNode]
      );

      expect(countNodes(editor, (n) => n instanceof WaveMentionNode)).toBe(2);
    });
  });

  describe("nft references", () => {
    it("converts a reference that is not at the start of the text", () => {
      const { editor } = importMarkdown(
        "look at $[card] here",
        [HASHTAG_TRANSFORMER],
        [HashtagNode]
      );

      expect(countNodes(editor, (n) => n instanceof HashtagNode)).toBe(1);
    });

    it("converts several references in one line", () => {
      const { editor } = importMarkdown(
        "$[one] then $[two] then $[three]",
        [HASHTAG_TRANSFORMER],
        [HashtagNode]
      );

      expect(countNodes(editor, (n) => n instanceof HashtagNode)).toBe(3);
    });
  });

  describe("regex flags", () => {
    it.each([
      ["MENTION_TRANSFORMER", MENTION_TRANSFORMER],
      ["WAVE_MENTION_TRANSFORMER", WAVE_MENTION_TRANSFORMER],
      ["HASHTAG_TRANSFORMER", HASHTAG_TRANSFORMER],
    ])(
      "%s keeps importRegExp non-global so match.index survives",
      (_name, transformer) => {
        const textMatch = transformer as Extract<
          Transformer,
          { importRegExp: RegExp }
        >;
        expect(textMatch.importRegExp.global).toBe(false);
        expect(textMatch.regExp.global).toBe(false);
      }
    );
  });
});
