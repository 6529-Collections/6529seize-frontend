import { renderHook } from "@testing-library/react";

import { useCreateDropDraftState } from "@/components/waves/create-drop-content/useCreateDropDraftState";

describe("restored NFT reference submission", () => {
  it("includes editor-derived NFT metadata in the drop request", () => {
    const { result } = renderHook(() =>
      useCreateDropDraftState({
        metadata: [],
        initialMetadata: [],
        selectedIdentity: null,
        isIdentitySubmissionExperience: false,
        isDropMode: false,
        canCreatePoll: false,
        pollRequest: null,
        getMarkdown: "look at $[Test NFT]",
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
        currentPartMentionedWaves: [],
        currentPartReferencedNfts: [
          {
            contract: "0x1234567890123456789012345678901234567890",
            token: "42",
            name: "Test NFT",
          },
        ],
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

    expect(result.current.getUpdatedDrop().referenced_nfts).toEqual([
      {
        contract: "0x1234567890123456789012345678901234567890",
        token: "42",
        name: "Test NFT",
      },
    ]);
  });
});
