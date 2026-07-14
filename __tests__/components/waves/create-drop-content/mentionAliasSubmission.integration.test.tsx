jest.unmock("lexical");

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical";
import { act, renderHook } from "@testing-library/react";
import { MentionNode } from "@/components/drops/create/lexical/nodes/MentionNode";
import { expandPlainAliasTokens } from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";
import { useCreateDropDraftState } from "@/components/waves/create-drop-content/useCreateDropDraftState";
import { exportComposerMarkdown } from "@/components/waves/create-drop-content/exportComposerMarkdown";

describe("mention alias submission", () => {
  it("carries expanded alias members into the updated drop", async () => {
    const setDrop = jest.fn();
    const { result } = renderHook(() =>
      useCreateDropDraftState({
        metadata: [],
        initialMetadata: [],
        selectedIdentity: null,
        isIdentitySubmissionExperience: false,
        isDropMode: false,
        canCreatePoll: false,
        pollRequest: null,
        getMarkdown: "@frens",
        files: [],
        drop: null,
        activeDrop: null,
        hasMetadata: false,
        hasValidPoll: false,
        isSafeWallet: false,
        address: null,
        canMentionAll: false,
        currentPartMentionedGroups: [],
        submitting: false,
        setDrop,
        setFiles: jest.fn(),
        setEditorState: jest.fn(),
        setMetadata: jest.fn(),
        setPollDraftState: jest.fn(),
        setMetadataOpenState: jest.fn(),
        setShowOptionsState: jest.fn(),
        resetIdentitySubmissionState: jest.fn(),
        shouldAnimateOptionsRef: { current: false },
        closeOnNextInputRef: { current: false },
        shouldCollapseOptionsAfterMarkdownSyncRef: { current: false },
      })
    );
    const editor = createEditor({
      namespace: "mention-alias-submission-test",
      nodes: [MentionNode],
      onError: (error) => {
        throw error;
      },
    });
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode("hello @frens"))
        );
      },
      { discrete: true }
    );

    let expandedEditorState = editor.getEditorState();
    await act(async () => {
      expandedEditorState = await expandPlainAliasTokens({
        editor,
        aliases: [
          {
            id: "alias-1",
            alias: "frens",
            members: [
              { profile_id: "profile-alice", handle: "alice", pfp: null },
              { profile_id: "profile-bob", handle: "bob", pfp: null },
            ],
          },
        ],
        onSelect: result.current.onMentionedUser,
      });
    });

    const expandedMarkdown = exportComposerMarkdown(expandedEditorState, false);
    expect(expandedMarkdown).toBe("hello @[alice] @[bob]");

    const drop = result.current.getUpdatedDrop(expandedMarkdown);
    expect(drop.mentioned_users).toEqual([
      {
        mentioned_profile_id: "profile-alice",
        handle_in_content: "alice",
      },
      {
        mentioned_profile_id: "profile-bob",
        handle_in_content: "bob",
      },
    ]);
  });
});
