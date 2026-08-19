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
  $createGroupMentionNode,
  GroupMentionNode,
} from "@/components/drops/create/lexical/nodes/GroupMentionNode";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

const createTestEditor = () =>
  createEditor({
    namespace: "group-mention-detection-test",
    nodes: [CodeNode, LinkNode, GroupMentionNode],
    onError: (error) => {
      throw error;
    },
  });

describe("getMentionedGroupsFromEditorState", () => {
  it("detects complete plain-text tokens without autocomplete selection", () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            $createTextNode("notify @admins and @contributors")
          )
        );
      },
      { discrete: true }
    );

    expect(
      getMentionedGroupsFromEditorState(editor.getEditorState(), true)
    ).toEqual([ApiDropGroupMention.Contributors, ApiDropGroupMention.Admins]);
  });

  it.each(["@all", "notify @all.", "notify @all, now"])(
    "detects an exact global mention with punctuation in %s",
    (content) => {
      const editor = createTestEditor();
      editor.update(
        () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode(content))
          );
        },
        { discrete: true }
      );

      expect(
        getMentionedGroupsFromEditorState(editor.getEditorState(), true)
      ).toEqual([ApiDropGroupMention.All]);
    }
  );

  it("ignores global mention text inside code and links", () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        const code = new CodeNode().append($createTextNode("@devs6529"));
        const linked = $createParagraphNode().append(
          $createLinkNode("https://example.com").append($createTextNode("@all"))
        );
        $getRoot().append(
          $createParagraphNode().append($createTextNode("@admins")),
          code,
          linked
        );
      },
      { discrete: true }
    );

    expect(
      getMentionedGroupsFromEditorState(editor.getEditorState(), true)
    ).toEqual([ApiDropGroupMention.Admins]);
  });

  it("does not combine a token split across editor nodes", () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("@adm")),
          $createParagraphNode().append($createTextNode("ins"))
        );
      },
      { discrete: true }
    );

    expect(
      getMentionedGroupsFromEditorState(editor.getEditorState(), true)
    ).toEqual([]);
  });

  it("reads adjacent inline text nodes as the visible token", () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        const tokenStart = $createTextNode("@adm");
        tokenStart.toggleFormat("bold");
        $getRoot().append(
          $createParagraphNode().append(tokenStart, $createTextNode("ins"))
        );
      },
      { discrete: true }
    );

    expect(
      getMentionedGroupsFromEditorState(editor.getEditorState(), true)
    ).toEqual([ApiDropGroupMention.Admins]);
  });

  it("does not treat a group node followed by handle text as a group mention", () => {
    const editor = createTestEditor();
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append(
            $createGroupMentionNode("@all"),
            $createTextNode("expop")
          )
        );
      },
      { discrete: true }
    );

    expect(
      getMentionedGroupsFromEditorState(editor.getEditorState(), true)
    ).toEqual([]);
  });
});
