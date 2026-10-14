import { renderHook } from "@testing-library/react";

import { useCreateDropDraftState } from "@/components/waves/create-drop-content/useCreateDropDraftState";

describe("restored wave mention submission", () => {
  it("includes editor-derived wave metadata in the drop request", () => {
    const { result } = renderHook(() =>
      useCreateDropDraftState({
        metadata: [],
        initialMetadata: [],
        selectedIdentity: null,
        isIdentitySubmissionExperience: false,
        isDropMode: false,
        canCreatePoll: false,
        pollRequest: null,
        getMarkdown: "check out #[test from desktop-web]",
        files: [],
        drop: null,
        activeDrop: null,
        hasMetadata: false,
        hasValidPoll: false,
        isSafeWallet: false,
        address: null,
        canMentionAll: false,
        currentPartMentionedGroups: [],
        currentPartMentionedUsers: [],
        currentPartMentionedWaves: [
          {
            wave_id: "wave-1",
            wave_name_in_content: "test from desktop-web",
          },
        ],
        currentPartReferencedNfts: [],
        submitting: false,
        setDrop: jest.fn(),
        setFiles: jest.fn(),
        setEditorState: jest.fn(),
        setMetadata: jest.fn(),
        setPollDraftState: jest.fn(),
        setMetadataOpenState: jest.fn(),
        setShowOptionsState: jest.fn(),
        resetIdentitySubmissionState: jest.fn(),
        closeOnNextInputRef: { current: false },
      })
    );

    const drop = result.current.getUpdatedDrop();

    expect(drop.mentioned_waves).toEqual([
      {
        wave_id: "wave-1",
        wave_name_in_content: "test from desktop-web",
      },
    ]);
  });
});
