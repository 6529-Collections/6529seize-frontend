"use client";

import { buildDropSubmissionMetadata } from "@/components/waves/utils/buildDropSubmissionMetadata";
import type {
  CreateDropConfig,
  CreateDropPart,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { ApiCreateDropPollRequest } from "@/generated/models/ApiCreateDropPollRequest";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { EditorState } from "lexical";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CreateDropInputHandles } from "../CreateDropInput";
import type { CreateDropPollDraft } from "../CreateDropPoll";
import {
  buildCurrentDrop,
  buildGifDrop,
  buildInitialDrop,
  getReplyTo,
  handleDropPart,
} from "./content-helpers";
import type { CreateDropMetadataType, ScopedValueState } from "./types";

type MutableCurrentRef<T> = {
  current: T;
};

export const useCreateDropDraftState = ({
  metadata,
  initialMetadata,
  selectedIdentity,
  isIdentitySubmissionExperience,
  isDropMode,
  canCreatePoll,
  pollRequest,
  getMarkdown,
  files,
  drop,
  activeDrop,
  hasMetadata,
  hasValidPoll,
  isSafeWallet,
  address,
  canMentionAll,
  currentPartMentionedGroups,
  submitting,
  setDrop,
  setFiles,
  setEditorState,
  setMetadata,
  setPollDraftState,
  setMetadataOpenState,
  setShowOptionsState,
  resetIdentitySubmissionState,
  shouldAnimateOptionsRef,
  closeOnNextInputRef,
  shouldCollapseOptionsAfterMarkdownSyncRef,
}: {
  readonly metadata: CreateDropMetadataType[];
  readonly initialMetadata: CreateDropMetadataType[];
  readonly selectedIdentity: string | null;
  readonly isIdentitySubmissionExperience: boolean;
  readonly isDropMode: boolean;
  readonly canCreatePoll: boolean;
  readonly pollRequest: ApiCreateDropPollRequest | null;
  readonly getMarkdown: string | null;
  readonly files: File[];
  readonly drop: CreateDropConfig | null;
  readonly activeDrop: ActiveDropState | null;
  readonly hasMetadata: boolean;
  readonly hasValidPoll: boolean;
  readonly isSafeWallet: boolean;
  readonly address: string | null | undefined;
  readonly canMentionAll: boolean;
  readonly currentPartMentionedGroups: ApiDropGroupMention[];
  readonly submitting: boolean;
  readonly setDrop: Dispatch<SetStateAction<CreateDropConfig | null>>;
  readonly setFiles: Dispatch<SetStateAction<File[]>>;
  readonly setEditorState: Dispatch<SetStateAction<EditorState | null>>;
  readonly setMetadata: Dispatch<SetStateAction<CreateDropMetadataType[]>>;
  readonly setPollDraftState: Dispatch<
    SetStateAction<ScopedValueState<CreateDropPollDraft> | null>
  >;
  readonly setMetadataOpenState: Dispatch<
    SetStateAction<ScopedValueState<boolean> | null>
  >;
  readonly setShowOptionsState: Dispatch<
    SetStateAction<ScopedValueState<boolean> | null>
  >;
  readonly resetIdentitySubmissionState: () => void;
  readonly shouldAnimateOptionsRef: MutableCurrentRef<boolean>;
  readonly closeOnNextInputRef: MutableCurrentRef<boolean>;
  readonly shouldCollapseOptionsAfterMarkdownSyncRef: MutableCurrentRef<boolean>;
}) => {
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<
    Omit<MentionedUser, "current_handle">[]
  >([]);
  const [mentionedWaves, setMentionedWaves] = useState<MentionedWave[]>([]);
  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);
  const createDropInputRef = useRef<CreateDropInputHandles | null>(null);
  const shouldRefocusAfterChatSubmitRef = useRef(false);

  const onReferencedNft = (newNft: ReferencedNft) => {
    setReferencedNfts([
      ...referencedNfts.filter(
        (i) => !(i.token === newNft.token && i.contract === newNft.contract)
      ),
      newNft,
    ]);
  };

  const onMentionedUser = (newUser: Omit<MentionedUser, "current_handle">) => {
    setMentionedUsers((curr) => {
      return [...curr, newUser];
    });
  };

  const onMentionedWave = (newWave: MentionedWave) => {
    setMentionedWaves((curr) => {
      return [...curr, newWave];
    });
  };

  const getSubmissionMetadata = useCallback(() => {
    return buildDropSubmissionMetadata({
      metadata,
      identity:
        isIdentitySubmissionExperience && isDropMode ? selectedIdentity : null,
    });
  }, [isDropMode, isIdentitySubmissionExperience, metadata, selectedIdentity]);

  const getPollRequest = () => {
    if (!canCreatePoll) {
      return null;
    }

    return pollRequest;
  };

  const getInitialDrop = (): CreateDropConfig | null => {
    return buildInitialDrop({
      markdown: getMarkdown,
      filesLength: files.length,
      drop,
      activeDrop,
      pollRequest: getPollRequest(),
      hasMetadata,
      hasValidPoll,
      metadata: getSubmissionMetadata(),
      isDropMode,
      isSafeWallet,
      address,
      canMentionAll,
    });
  };

  const createGifDrop = (gif: string): CreateDropConfig => {
    return buildGifDrop({
      gif,
      drop,
      activeDrop,
      files,
      replyTo: getReplyTo(activeDrop),
      pollRequest: getPollRequest(),
      isDropMode,
      canMentionAll,
      metadata: getSubmissionMetadata(),
      isSafeWallet,
      address,
    });
  };

  const createCurrentDrop = (
    markdown: string | null,
    allMentions: CreateDropConfig["mentioned_users"],
    allNfts: ReferencedNft[],
    allWaves: NonNullable<CreateDropConfig["mentioned_waves"]>,
    currentMentionedGroups: NonNullable<CreateDropPart["mentioned_groups"]>
  ): CreateDropConfig => {
    return buildCurrentDrop({
      markdown,
      files,
      drop,
      activeDrop,
      allMentions,
      allNfts,
      allWaves,
      currentMentionedGroups,
      pollRequest: getPollRequest(),
      hasMetadata,
      hasValidPoll,
      isDropMode,
      canMentionAll,
      metadata: getSubmissionMetadata(),
      isSafeWallet,
      address,
    });
  };

  const getUpdatedDrop = (): CreateDropConfig => {
    const initialDrop = getInitialDrop();
    if (initialDrop) {
      return initialDrop;
    }

    const markdown = getMarkdown;
    const existingMentions = drop?.mentioned_users ?? [];
    const existingNfts = drop?.referenced_nfts ?? [];
    const existingWaves = drop?.mentioned_waves ?? [];
    const { updatedMentions, updatedNfts, updatedWaves, updatedMarkdown } =
      handleDropPart({
        markdown,
        existingMentions,
        existingNfts,
        existingWaves,
        mentionedUsers,
        referencedNfts,
        mentionedWaves,
      });

    return createCurrentDrop(
      updatedMarkdown,
      updatedMentions,
      updatedNfts,
      updatedWaves,
      currentPartMentionedGroups
    );
  };

  const updateDropStateAndClearInput = (newDrop: CreateDropConfig) => {
    setDrop(newDrop);
    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
    createDropInputRef.current?.clearEditorState();
    setFiles([]);
  };

  const finalizeAndAddDropPart = (): CreateDropConfig => {
    const updatedDrop = getUpdatedDrop();
    updateDropStateAndClearInput(updatedDrop);
    return updatedDrop;
  };

  const refreshState = () => {
    createDropInputRef.current?.clearEditorState();
    setEditorState(null);
    setMetadata(initialMetadata);
    setPollDraftState(null);
    setMentionedUsers([]);
    setMentionedWaves([]);
    setReferencedNfts([]);
    setDrop(null);
    setMetadataOpenState(null);
    resetIdentitySubmissionState();
    setShowOptionsState(null);
    shouldAnimateOptionsRef.current = false;
    closeOnNextInputRef.current = false;
    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
    setDropEditorRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!shouldRefocusAfterChatSubmitRef.current || submitting) {
      return;
    }

    shouldRefocusAfterChatSubmitRef.current = false;
    const frameId = requestAnimationFrame(() => {
      createDropInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [dropEditorRefreshKey, submitting]);

  return {
    createDropInputRef,
    shouldRefocusAfterChatSubmitRef,
    dropEditorRefreshKey,
    onReferencedNft,
    onMentionedUser,
    onMentionedWave,
    getUpdatedDrop,
    createGifDrop,
    finalizeAndAddDropPart,
    refreshState,
  };
};
