jest.unmock("lexical");

import { CodeNode } from "@lexical/code";
import { LinkNode, $createLinkNode } from "@lexical/link";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical";

import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

const createTestEditor = () =>
  createEditor({
    namespace: "group-mention-detection-test",
    nodes: [CodeNode, LinkNode],
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
});
