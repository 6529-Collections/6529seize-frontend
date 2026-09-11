jest.unmock("lexical");

import {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  type LexicalEditor,
} from "lexical";

import {
  MentionNode,
  $createMentionNode,
} from "@/components/drops/create/lexical/nodes/MentionNode";
import {
  getMentionedUsersFromEditorState,
  mergeMentionedUsers,
} from "@/components/drops/create/lexical/utils/userMentionDetection";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const CAROL = "33333333-3333-4333-8333-333333333333";

const makeEditor = (): LexicalEditor =>
  createEditor({
    nodes: [MentionNode],
    onError: (error) => {
      throw error;
    },
  });

/** Builds the editor the way MentionsPlugin does when you pick a suggestion. */
const withMentions = (
  entries: readonly (
    | { readonly handle: string; readonly profileId: string | null }
    | { readonly text: string }
  )[]
): LexicalEditor => {
  const editor = makeEditor();
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      for (const entry of entries) {
        if ("text" in entry) {
          paragraph.append($createTextNode(entry.text));
        } else {
          paragraph.append(
            $createMentionNode(`@${entry.handle}`, entry.profileId)
          );
        }
      }
      $getRoot().append(paragraph);
    },
    { discrete: true }
  );
  return editor;
};

describe("getMentionedUsersFromEditorState", () => {
  it("returns nothing for an empty editor", () => {
    expect(getMentionedUsersFromEditorState(makeEditor().getEditorState())).toEqual(
      []
    );
  });

  it("reads handle and profile id off each mention node", () => {
    const editor = withMentions([
      { handle: "alice", profileId: ALICE },
      { text: " and " },
      { handle: "bob", profileId: BOB },
    ]);

    expect(getMentionedUsersFromEditorState(editor.getEditorState())).toEqual([
      { mentioned_profile_id: ALICE, handle_in_content: "alice" },
      { mentioned_profile_id: BOB, handle_in_content: "bob" },
    ]);
  });

  it("ignores plain text that merely looks like a mention", () => {
    const editor = withMentions([{ text: "@alice @[bob] hello" }]);

    expect(getMentionedUsersFromEditorState(editor.getEditorState())).toEqual([]);
  });

  it("skips mention nodes that carry no profile id", () => {
    const editor = withMentions([
      { handle: "alice", profileId: ALICE },
      { text: " " },
      { handle: "unresolved", profileId: null },
    ]);

    expect(getMentionedUsersFromEditorState(editor.getEditorState())).toEqual([
      { mentioned_profile_id: ALICE, handle_in_content: "alice" },
    ]);
  });

  it("de-duplicates a profile mentioned twice", () => {
    const editor = withMentions([
      { handle: "alice", profileId: ALICE },
      { text: " ... " },
      { handle: "alice", profileId: ALICE },
    ]);

    expect(getMentionedUsersFromEditorState(editor.getEditorState())).toHaveLength(
      1
    );
  });

  /**
   * The reported bug: a wave draft persists `editorState.toJSON()` and nothing
   * else. The session registry of "users picked from autocomplete" is not saved,
   * so after a reload it is empty — mentions have to be recoverable from the
   * editor alone or the drop posts with no `mentioned_users` and renders as
   * literal `@[handle]` text.
   */
  it("recovers mentions after the draft editor-state round trip", () => {
    const original = withMentions([
      { handle: "alice", profileId: ALICE },
      { text: " " },
      { handle: "carol", profileId: CAROL },
      { text: " please take a look" },
    ]);

    // Exactly what useWaveDraftPersistence writes to storage…
    const persisted = JSON.stringify(original.getEditorState().toJSON());

    // …and what it reads back on mount, into a brand new editor with no registry.
    const restoredEditor = makeEditor();
    restoredEditor.setEditorState(
      restoredEditor.parseEditorState(JSON.parse(persisted))
    );

    expect(
      getMentionedUsersFromEditorState(restoredEditor.getEditorState())
    ).toEqual([
      { mentioned_profile_id: ALICE, handle_in_content: "alice" },
      { mentioned_profile_id: CAROL, handle_in_content: "carol" },
    ]);
  });
});

describe("mergeMentionedUsers", () => {
  const editorMention = {
    mentioned_profile_id: ALICE,
    handle_in_content: "alice",
  };
  const registryMention = {
    mentioned_profile_id: BOB,
    handle_in_content: "bob",
  };

  it("keeps mentions found only in the session registry", () => {
    expect(mergeMentionedUsers([], [registryMention])).toEqual([
      registryMention,
    ]);
  });

  it("keeps mentions found only in the editor", () => {
    expect(mergeMentionedUsers([editorMention], [])).toEqual([editorMention]);
  });

  it("unions both sources without duplicating", () => {
    const merged = mergeMentionedUsers(
      [editorMention, registryMention],
      [registryMention]
    );

    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.mentioned_profile_id).sort()).toEqual(
      [ALICE, BOB].sort()
    );
  });

  it("prefers the editor's handle when the same profile appears in both", () => {
    const merged = mergeMentionedUsers(
      [{ mentioned_profile_id: ALICE, handle_in_content: "alice" }],
      [{ mentioned_profile_id: ALICE, handle_in_content: "stale_handle" }]
    );

    expect(merged).toEqual([
      { mentioned_profile_id: ALICE, handle_in_content: "alice" },
    ]);
  });
});
