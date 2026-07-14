jest.unmock("lexical");

import { CodeNode } from "@lexical/code";
import { LinkNode, $createLinkNode } from "@lexical/link";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical";
import {
  $createMentionNode,
  $isMentionNode,
  MentionNode,
} from "@/components/drops/create/lexical/nodes/MentionNode";
import { expandPlainAliasTokens } from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";
import type { MentionAlias } from "@/entities/IMentionAlias";

const alias: MentionAlias = {
  id: "alias-1",
  alias: "frens",
  members: [
    { profile_id: "profile-alice", handle: "alice", pfp: null },
    { profile_id: "profile-bob", handle: "bob", pfp: null },
  ],
};

const createTestEditor = () =>
  createEditor({
    namespace: "mention-alias-expansion-test",
    nodes: [MentionNode, CodeNode, LinkNode],
    onError: (error) => {
      throw error;
    },
  });

describe("expandPlainAliasTokens", () => {
  it("expands plain aliases while skipping code and links", async () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        const plain = $createParagraphNode().append(
          $createTextNode("hello @frens")
        );
        const code = new CodeNode().append($createTextNode("@frens"));
        const linked = $createParagraphNode().append(
          $createLinkNode("https://example.com").append(
            $createTextNode("@frens")
          )
        );
        $getRoot().append(plain, code, linked);
      },
      { discrete: true }
    );
    const onSelect = jest.fn();

    await expandPlainAliasTokens({ editor, aliases: [alias], onSelect });

    editor.getEditorState().read(() => {
      const mentions = $getRoot().getAllTextNodes().filter($isMentionNode);
      expect(mentions.map((node) => node.getTextContent())).toEqual([
        "@alice",
        "@bob",
      ]);
      expect($getRoot().getTextContent()).toContain("@frens");
    });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("does not insert a member whose handle is already mentioned", async () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            $createMentionNode("@alice"),
            $createTextNode(" @frens")
          )
        );
      },
      { discrete: true }
    );
    const onSelect = jest.fn();

    await expandPlainAliasTokens({ editor, aliases: [alias], onSelect });

    editor.getEditorState().read(() => {
      const mentions = $getRoot().getAllTextNodes().filter($isMentionNode);
      expect(mentions.map((node) => node.getTextContent())).toEqual([
        "@alice",
        "@bob",
      ]);
    });
    expect(onSelect).toHaveBeenCalledWith({
      mentioned_profile_id: "profile-bob",
      handle_in_content: "bob",
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
