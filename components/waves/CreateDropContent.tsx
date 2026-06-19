"use client";
import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import type {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { selectEditingDropId, setEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type { EditorState } from "lexical";
import dynamic from "next/dynamic";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../auth/Auth";
import { HASHTAG_TRANSFORMER } from "../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../drops/create/lexical/transformers/ImageTransformer";
import { MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/WaveMentionTransformer";
import { GROUP_MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/GroupMentionTransformer";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import CreateDropActions from "./CreateDropActions";
import { CreateDropContentFiles } from "./CreateDropContentFiles";
import CreateDropContentRequirements from "./CreateDropContentRequirements";
import type { CreateDropInputHandles } from "./CreateDropInput";
import CreateDropInput from "./CreateDropInput";
import CreateDropMetadata from "./CreateDropMetadata";
import CreateDropPoll, {
  createDefaultDropPollDraft,
  validateCreateDropPollDraft,
  type CreateDropPollDraft,
} from "./CreateDropPoll";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import { CreateDropSubmit } from "./CreateDropSubmit";
import SlowModeChatNotice from "./SlowModeChatNotice";

import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import { MAX_DROP_UPLOAD_FILES } from "@/helpers/Helpers";
import { WsMessageType } from "@/helpers/Types";
import { isReservedIdentitySubmissionMetadataKey } from "@/helpers/waves/identity-submission-metadata";
import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { useWebSocket } from "@/services/websocket";
import throttle from "lodash/throttle";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import CreateDropIdentityField from "./CreateDropIdentityField";
import CreateDropIdentityPickerContent from "./CreateDropIdentityPickerContent";
import CreateDropIdentityPickerModal from "./CreateDropIdentityPickerModal";
import { EMOJI_TRANSFORMER } from "../drops/create/lexical/transformers/EmojiTransformer";
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from "./create-wave/services/multiPartUpload";
import {
  isAttachmentUploadFile,
  validateAttachmentUploadFile,
} from "@/services/uploads/attachmentUploadMimeType";
import type { DropMutationBody } from "./CreateDrop";
import { generateMetadataId, useDropMetadata } from "./hooks/useDropMetadata";
import {
  hasCurrentDropPartContent,
  shouldUseInitialDropConfig,
} from "./utils/createDropContentSubmission";
import {
  hasPendingInlineImageUploadDrop,
  hasPendingInlineImageUploadMarkdown,
} from "@/helpers/waves/inline-image-upload.helpers";
import type { MissingRequirements } from "./utils/getMissingRequirements";
import { getMissingRequirements } from "./utils/getMissingRequirements";
import { getOptimisticDrop } from "./utils/getOptimisticDrop";
import { toApiCreateDropPart } from "./utils/createDropRequestPart";
import { buildDropSubmissionMetadata } from "./utils/buildDropSubmissionMetadata";
import { getIdentitySubmissionMetadataErrors } from "./utils/identitySubmissionMetadataValidation";
import {
  getEffectiveIdentitySubmitAttempt,
  getEffectiveSelectedIdentity,
  getIdentitySubmissionScopeKey,
} from "./utils/identitySubmissionState";
import { normalizeCurationDropInput } from "./utils/validateCurationDropUrl";
import {
  getSelectableIdentityOption,
  type SelectableIdentityOption,
} from "../utils/input/profile-search/getSelectableIdentity";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";
import type { IdentityPickerPlacement } from "./dropComposer.types";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  CHAT_LINK_RESTRICTION_MESSAGE,
  areHandlesEqual,
  isChatLinkRestrictionApplicable,
} from "@/helpers/waves/chat-link-restriction.helpers";
import { useLatestEditableChatDropTarget } from "./hooks/useLatestEditableChatDropTarget";

// Use next/dynamic for lazy loading with SSR support
const TermsSignatureFlow = dynamic(
  () => import("../terms/TermsSignatureFlow"),
  { loading: () => null }
);

export type CreateDropMetadataType =
  | {
      readonly id: string;
      key: string;
      readonly type: ApiWaveMetadataType.String;
      value: string | null;
      readonly required: boolean;
    }
  | {
      readonly id: string;
      key: string;
      readonly type: ApiWaveMetadataType.Number;
      value: number | null;
      readonly required: boolean;
    }
  | {
      readonly id: string;
      key: string;
      readonly type: null;
      value: string | null;
      readonly required: boolean;
    };

type ScopedValueState<T> = {
  readonly scopeKey: string;
  readonly value: T;
};

interface CreateDropContentProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: ApiWave;
  readonly drop: CreateDropConfig | null;
  readonly isStormMode: boolean;
  readonly isDropMode: boolean;
  readonly dropId: string | null;
  readonly setDrop: React.Dispatch<
    React.SetStateAction<CreateDropConfig | null>
  >;
  readonly setIsStormMode: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onDropModeChange: (newIsDropMode: boolean) => void;
  readonly onSwitchToDropModeWithUrl: (url: string) => void;
  readonly submitDrop: (dropRequest: DropMutationBody) => boolean;
  readonly dropModeToggleExitLabel: string | null;
  readonly canExitDropMode: boolean;
  readonly isChatBlockedBySlowMode: boolean;
  readonly submissionExperience: WaveSubmissionExperience;
  readonly canSubmitCurationUrl?: boolean | undefined;
  readonly curationUrlSubmitRestrictionMessage?: string | null | undefined;
  readonly externalAttachmentDrop?:
    | {
        readonly token: number;
        readonly files: File[];
      }
    | null
    | undefined;
  readonly onExternalAttachmentDropConsumed?: (() => void) | undefined;
  readonly termsSignatureFlowEnabled?: boolean | undefined;
  readonly identityPickerPlacement?: IdentityPickerPlacement | undefined;
}

const CONTAINER_WIDTH_THRESHOLD = 500;
const SELECT_OTHER_IDENTITY_ERROR = "Select someone else to nominate.";

function CreateDropInlineIdentityPickerPanel({
  mode,
  selectedIdentity,
  disabled,
  errorMessage,
  canClose,
  onClose,
  onSelect,
}: {
  readonly mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  readonly selectedIdentity: SelectableIdentityOption | null;
  readonly disabled: boolean;
  readonly errorMessage: string | null;
  readonly canClose: boolean;
  readonly onClose: () => void;
  readonly onSelect: (selection: SelectableIdentityOption) => void;
}) {
  return (
    <div
      className="tw-mb-3 tw-rounded-2xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/80 tw-p-4 tw-shadow-lg"
      data-testid="identity-picker-inline"
    >
      <div className="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-4">
        <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-tracking-tight tw-text-iron-50">
          Select identity
        </h3>
        {canClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="tw-flex tw-h-7 tw-w-7 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-white/5 tw-p-0 tw-text-iron-400 tw-transition-colors disabled:tw-cursor-not-allowed desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white"
            aria-label="Close identity picker"
            title="Close identity picker"
          >
            <XMarkIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <CreateDropIdentityPickerContent
        mode={mode}
        selectedIdentity={selectedIdentity}
        disabled={disabled}
        errorMessage={errorMessage}
        onSelect={onSelect}
      />
    </div>
  );
}

const getFileIdentity = (file: File): string =>
  [file.name, file.size, file.type, file.lastModified].join(":");

const normalizeIdentityValue = (identity: string | null | undefined) =>
  identity?.trim().toLowerCase() ?? null;

const isMetadataValuePresent = (value: string | number | null): boolean => {
  if (value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
};

const hasMetadataContent = (metadata: CreateDropMetadataType[]): boolean =>
  metadata.some((item) => isMetadataValuePresent(item.value));

const hasSubmissionContent = ({
  markdown,
  files,
  parts,
  hasMetadata,
  hasPoll,
}: {
  readonly markdown: string | null;
  readonly files: File[];
  readonly parts: CreateDropPart[];
  readonly hasMetadata: boolean;
  readonly hasPoll: boolean;
}): boolean => {
  if (markdown && markdown.trim().length > 0) {
    return true;
  }

  if (files.length > 0) {
    return true;
  }

  if (parts.length > 0) {
    return true;
  }

  if (hasMetadata) {
    return true;
  }

  return hasPoll;
};

const ensurePartsWithFallback = (
  parts: CreateDropPart[],
  shouldAddPlaceholder: boolean
): CreateDropPart[] => {
  if (parts.length > 0 || !shouldAddPlaceholder) {
    return parts;
  }

  return [
    {
      content: null,
      quoted_drop: null,
      media: [],
    },
  ];
};

const getPartMentions = (
  markdown: string | null,
  mentionedUsers: Omit<MentionedUser, "current_handle">[]
) => {
  return mentionedUsers.filter((user) =>
    markdown?.includes(`@[${user.handle_in_content}]`)
  );
};

const getUpdatedMentions = (
  partMentions: Omit<MentionedUser, "current_handle">[],
  existingMentions: ApiDropMentionedUser[]
) => {
  const notAddedMentions = partMentions.filter(
    (mention) =>
      !existingMentions.some(
        (existing) =>
          existing.mentioned_profile_id === mention.mentioned_profile_id
      )
  );
  return [...existingMentions, ...notAddedMentions];
};

const getPartNfts = (
  markdown: string | null,
  referencedNfts: ReferencedNft[]
) => {
  return referencedNfts.filter((nft) => markdown?.includes(`$[${nft.name}]`));
};

const getUpdatedNfts = (
  partNfts: ReferencedNft[],
  existingNfts: ReferencedNft[]
) => {
  const notAddedNfts = partNfts.filter(
    (nft) =>
      !existingNfts.some(
        (existing) =>
          existing.contract === nft.contract && existing.token === nft.token
      )
  );
  return [...existingNfts, ...notAddedNfts];
};

const getPartWaves = (
  markdown: string | null,
  mentionedWaves: MentionedWave[]
) =>
  mentionedWaves.filter((wave) =>
    markdown?.includes(`#[${wave.wave_name_in_content}]`)
  );

const getUpdatedWaves = (
  partWaves: MentionedWave[],
  existingWaves: ApiMentionedWave[]
) => {
  const notAddedWaves = partWaves.filter(
    (wave) =>
      !existingWaves.some((existing) => existing.wave_id === wave.wave_id)
  );
  return [...existingWaves, ...notAddedWaves];
};

type HandleDropPartResult = {
  updatedMentions: ApiDropMentionedUser[];
  updatedNfts: ReferencedNft[];
  updatedWaves: ApiMentionedWave[];
  updatedMarkdown: string;
};

const handleDropPart = (
  markdown: string | null,
  existingMentions: ApiDropMentionedUser[],
  existingNfts: ReferencedNft[],
  existingWaves: ApiMentionedWave[],
  mentionedUsers: Omit<MentionedUser, "current_handle">[],
  referencedNfts: ReferencedNft[],
  mentionedWaves: MentionedWave[]
): HandleDropPartResult => {
  const partMentions = getPartMentions(markdown, mentionedUsers);
  const updatedMentions = getUpdatedMentions(partMentions, existingMentions);

  const partNfts = getPartNfts(markdown, referencedNfts);
  const updatedNfts = getUpdatedNfts(partNfts, existingNfts);

  const partWaves = getPartWaves(markdown, mentionedWaves);
  const updatedWaves = getUpdatedWaves(partWaves, existingWaves);

  const updatedMarkdown = markdown ?? "";

  return {
    updatedMentions,
    updatedNfts,
    updatedWaves,
    updatedMarkdown,
  };
};

export interface UploadingFile {
  file: File;
  isUploading: boolean;
  progress: number;
  phase: "uploading" | "processing";
}

const generateMediaForPart = async (
  media: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
) => {
  setUploadingFiles((prev) => [
    ...prev,
    { file: media, isUploading: true, progress: 0, phase: "uploading" },
  ]);
  return await multiPartUpload({
    file: media,
    path: "drop",
    waitForReady: false,
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === media ? { ...uf, progress } : uf))
      ),
    onProcessing: () =>
      setUploadingFiles((prev) =>
        prev.map((uf) =>
          uf.file === media ? { ...uf, progress: 100, phase: "processing" } : uf
        )
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));
  });
};

const generateAttachmentForPart = async (
  attachment: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
) => {
  setUploadingFiles((prev) => [
    ...prev,
    { file: attachment, isUploading: true, progress: 0, phase: "uploading" },
  ]);
  return await multiPartAttachmentUpload({
    file: attachment,
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === attachment ? { ...uf, progress } : uf))
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== attachment));
  });
};

const generatePart = async (
  part: CreateDropPart,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<CreateDropRequestPart> => {
  const mediaFiles = part.media.filter((file) => !isAttachmentUploadFile(file));
  const attachmentFiles = part.media.filter(isAttachmentUploadFile);
  const media = await Promise.all(
    mediaFiles.map((media) => generateMediaForPart(media, setUploadingFiles))
  );
  const uploadedAttachments = await Promise.all(
    attachmentFiles.map((attachment) =>
      generateAttachmentForPart(attachment, setUploadingFiles)
    )
  );
  const badAttachment = uploadedAttachments.find(
    (attachment) => attachment.status === ApiAttachmentStatus.Bad
  );
  if (badAttachment) {
    throw new Error(
      badAttachment.error_reason ??
        `${badAttachment.file_name} failed attachment validation.`
    );
  }
  return {
    content: part.content,
    quoted_drop: part.quoted_drop,
    media,
    attachments: uploadedAttachments.map((attachment) => ({
      attachment_id: attachment.attachment_id,
    })),
    uploaded_attachments: uploadedAttachments,
  };
};

const generateParts = async (
  parts: CreateDropPart[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<CreateDropRequestPart[]> => {
  try {
    return await Promise.all(
      parts.map((part) => generatePart(part, setUploadingFiles))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("content_type") ||
      message.includes("Unsupported file type")
    ) {
      throw new Error("File type not supported.");
    }
    throw new Error("Error uploading file. Please try again.");
  }
};

const toApiCreateDropParts = (
  parts: CreateDropRequestPart[]
): ApiCreateDropRequest["parts"] => parts.map(toApiCreateDropPart);

const CreateDropContent: React.FC<CreateDropContentProps> = ({
  activeDrop,
  onCancelReplyQuote,
  wave,
  drop,
  isStormMode,
  isDropMode,
  dropId,
  setDrop,
  setIsStormMode,
  onDropModeChange,
  onSwitchToDropModeWithUrl,
  submitDrop,
  dropModeToggleExitLabel,
  canExitDropMode,
  isChatBlockedBySlowMode,
  submissionExperience,
  canSubmitCurationUrl = true,
  curationUrlSubmitRestrictionMessage = null,
  externalAttachmentDrop,
  onExternalAttachmentDropConsumed,
  termsSignatureFlowEnabled = true,
  identityPickerPlacement = "modal",
}) => {
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { send } = useWebSocket();
  const { isApp } = useDeviceInfo();
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  const [actionsContainerElement, setActionsContainerElement] =
    useState<HTMLDivElement | null>(null);
  const shouldAnimateOptionsRef = useRef(false);
  const prevWaveIdRef = useRef(wave.id);
  const [isWideContainer, setIsWideContainer] = useState(false);
  const dispatch = useDispatch();
  const editingDropId = useSelector(selectEditingDropId);
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useAuth();
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const waveChatScroll = useWaveChatScrollOptional();
  const { signDrop } = useDropSignature();

  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [metadataOpenState, setMetadataOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [pollDraftState, setPollDraftState] =
    useState<ScopedValueState<CreateDropPollDraft> | null>(null);
  const [showOptionsState, setShowOptionsState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [selectedIdentityState, setSelectedIdentityState] =
    useState<ScopedValueState<SelectableIdentityOption | null> | null>(null);
  const [hasAttemptedIdentitySubmitState, setHasAttemptedIdentitySubmitState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerOpenState, setIdentityPickerOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerAutoOpenState, setIdentityPickerAutoOpenState] =
    useState<ScopedValueState<boolean> | null>(null);
  const [identityPickerErrorMessageState, setIdentityPickerErrorMessageState] =
    useState<ScopedValueState<string | null> | null>(null);
  const closeOnNextInputRef = useRef(false);
  const shouldCollapseOptionsAfterMarkdownSyncRef = useRef(false);
  const prevIsDropModeRef = useRef(isDropMode);
  const [dropModeSessionEpoch, setDropModeSessionEpoch] = useState(0);
  const isWaveChanged = prevWaveIdRef.current !== wave.id;
  if (isWaveChanged) {
    prevWaveIdRef.current = wave.id;
    shouldAnimateOptionsRef.current = false;
    closeOnNextInputRef.current = false;
    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
  }
  const dropModeSessionScopeKey = `${wave.id}:drop-mode:${dropModeSessionEpoch}`;
  const showOptions =
    showOptionsState?.scopeKey === wave.id
      ? showOptionsState.value
      : isWideContainer;

  const setActionsContainerRef = useCallback((node: HTMLDivElement | null) => {
    actionsContainerRef.current = node;
    setActionsContainerElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!actionsContainerElement) return;

    const setWidthState = (width: number) => {
      const isWide = width >= CONTAINER_WIDTH_THRESHOLD;
      setIsWideContainer((prev) => (prev === isWide ? prev : isWide));
    };

    const measureWidth = () => {
      setWidthState(actionsContainerElement.getBoundingClientRect().width);
    };

    measureWidth();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidthState(entry.contentRect.width);
      }
    });

    observer.observe(actionsContainerElement);
    return () => observer.disconnect();
  }, [actionsContainerElement]);

  useLayoutEffect(() => {
    if (prevIsDropModeRef.current && !isDropMode) {
      setDropModeSessionEpoch((prev) => prev + 1);
    }

    prevIsDropModeRef.current = isDropMode;
  }, [isDropMode]);

  const isIdentitySubmissionExperience =
    submissionExperience === WaveSubmissionExperience.IDENTITY;
  const isCurationSubmissionExperience =
    submissionExperience === WaveSubmissionExperience.CURATION_LEGACY;
  const identitySubmissionMode = isIdentitySubmissionExperience
    ? (wave.participation.submission_strategy?.config.who_can_be_submitted ??
      null)
    : null;
  const viewerIdentity = getSelectableIdentityOption(connectedProfile);
  const viewerSelectableIdentity = viewerIdentity?.value ?? null;
  const identitySubmissionScopeKey = getIdentitySubmissionScopeKey({
    waveId: wave.id,
    isIdentitySubmissionExperience,
    identitySubmissionMode,
  });
  const identitySubmissionSessionScopeKey = `${identitySubmissionScopeKey}:${dropModeSessionEpoch}`;
  const isIdentityPickerAllowed =
    isIdentitySubmissionExperience &&
    isDropMode &&
    identitySubmissionMode !== null &&
    identitySubmissionMode !==
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;
  const selectedIdentitySelection = getEffectiveSelectedIdentity({
    isIdentitySubmissionExperience,
    identitySubmissionMode,
    viewerIdentity,
    selectedIdentityState,
    scopeKey: identitySubmissionSessionScopeKey,
  });
  const selectedIdentity = selectedIdentitySelection?.value ?? null;
  const hasAttemptedIdentitySubmit = getEffectiveIdentitySubmitAttempt({
    attemptState: hasAttemptedIdentitySubmitState,
    scopeKey: identitySubmissionSessionScopeKey,
  });
  const isIdentityPickerExplicitlyOpen =
    identityPickerOpenState?.scopeKey === identitySubmissionSessionScopeKey
      ? identityPickerOpenState.value
      : false;
  const isIdentityPickerAutoOpenAllowed =
    identityPickerAutoOpenState?.scopeKey === identitySubmissionSessionScopeKey
      ? identityPickerAutoOpenState.value
      : true;
  const identityPickerErrorMessage =
    identityPickerErrorMessageState?.scopeKey ===
    identitySubmissionSessionScopeKey
      ? identityPickerErrorMessageState.value
      : null;
  const isIdentityPickerOpen =
    isIdentityPickerAllowed &&
    (isIdentityPickerExplicitlyOpen ||
      (!selectedIdentitySelection && isIdentityPickerAutoOpenAllowed));
  const canDismissIdentityPicker =
    selectedIdentitySelection !== null || canExitDropMode;
  const isMetadataOpen =
    isDropMode &&
    (metadataOpenState?.scopeKey === dropModeSessionScopeKey
      ? metadataOpenState.value
      : false);
  const requiredMetadata = useMemo(() => {
    if (!isIdentitySubmissionExperience) {
      return wave.participation.required_metadata;
    }

    return wave.participation.required_metadata.filter(
      (item) => !isReservedIdentitySubmissionMetadataKey(item.name)
    );
  }, [isIdentitySubmissionExperience, wave.participation.required_metadata]);

  const { metadata, setMetadata, initialMetadata } = useDropMetadata({
    isDropMode,
    requiredMetadata,
  });
  const metadataErrorById = useMemo(
    () =>
      getIdentitySubmissionMetadataErrors({
        isIdentitySubmissionExperience:
          isIdentitySubmissionExperience && isDropMode,
        metadata,
      }),
    [isDropMode, isIdentitySubmissionExperience, metadata]
  );
  const hasMetadataValidationErrors = Object.keys(metadataErrorById).length > 0;

  const hasMetadata = useMemo(() => hasMetadataContent(metadata), [metadata]);
  const canMentionAll = wave.wave.authenticated_user_eligible_for_admin;
  const canCreatePoll = canMentionAll === true && !isDropMode;
  const pollDraft =
    canCreatePoll && pollDraftState?.scopeKey === wave.id
      ? pollDraftState.value
      : null;
  const pollValidation = useMemo(
    () => validateCreateDropPollDraft(pollDraft),
    [pollDraft]
  );
  const hasPoll = pollDraft !== null;
  const hasValidPoll = pollValidation.request !== null;
  const hasPollValidationError = hasPoll && pollValidation.error !== null;

  const getMarkdown = useMemo(
    () =>
      editorState
        ? normalizeTypedEmojiShortcuts(
            exportDropMarkdown(editorState, [
              ...SAFE_MARKDOWN_TRANSFORMERS,
              MENTION_TRANSFORMER,
              ...(canMentionAll ? [GROUP_MENTION_TRANSFORMER] : []),
              HASHTAG_TRANSFORMER,
              WAVE_MENTION_TRANSFORMER,
              IMAGE_TRANSFORMER,
              EMOJI_TRANSFORMER,
            ])
          )
        : null,
    [canMentionAll, editorState]
  );
  const collapseOptions = useCallback(() => {
    shouldAnimateOptionsRef.current = true;
    setShowOptionsState((current) =>
      current?.scopeKey === wave.id && current.value === false
        ? current
        : { scopeKey: wave.id, value: false }
    );
    closeOnNextInputRef.current = false;
  }, [wave.id]);
  useLayoutEffect(() => {
    if (!shouldCollapseOptionsAfterMarkdownSyncRef.current) {
      return;
    }

    shouldCollapseOptionsAfterMarkdownSyncRef.current = false;

    if ((getMarkdown?.trim().length ?? 0) === 0) {
      return;
    }

    collapseOptions();
  }, [collapseOptions, getMarkdown]);
  const currentPartMentionedGroups = useMemo(
    () =>
      editorState
        ? getMentionedGroupsFromEditorState(editorState, canMentionAll)
        : [],
    [canMentionAll, editorState]
  );

  const isStormModeActive = isStormMode;

  const sendTyping = React.useCallback(() => {
    send(WsMessageType.USER_IS_TYPING, { wave_id: wave.id });
  }, [send, wave.id]);

  const throttleHandle = useMemo(() => {
    return throttle(sendTyping, 4000);
  }, [sendTyping]);

  useEffect(() => {
    if (!getMarkdown?.length) {
      return;
    }
    throttleHandle();
  }, [getMarkdown, throttleHandle]);

  const getCanSubmitStorm = () => {
    const markdown = getMarkdown;
    if (markdown?.length && markdown.length > 240) {
      return false;
    }
    return true;
  };

  const hasPendingInlineImageUpload = useMemo(
    () =>
      hasPendingInlineImageUploadMarkdown(getMarkdown) ||
      (drop ? hasPendingInlineImageUploadDrop(drop) : false),
    [drop, getMarkdown]
  );

  const getCanSubmit = () => {
    const dropParts = drop?.parts ?? [];

    return (
      hasSubmissionContent({
        markdown: getMarkdown,
        files,
        parts: dropParts,
        hasMetadata,
        hasPoll: hasValidPoll,
      }) &&
      !hasPendingInlineImageUpload &&
      !hasMetadataValidationErrors &&
      !hasPollValidationError &&
      !!(dropParts.length ? getCanSubmitStorm() : true)
    );
  };

  const getHaveMarkdownOrFile = () => !!getMarkdown || files.length > 0;

  const getIsDropLimit = () =>
    (drop?.parts.reduce(
      (acc, part) => acc + (part.content?.length ?? 0),
      getMarkdown?.length ?? 0
    ) ?? 0) >= 24000;

  const getCanAddPart = () =>
    getHaveMarkdownOrFile() &&
    !hasPendingInlineImageUpload &&
    !getIsDropLimit();
  const isSlowModeSubmitBlocked = isChatBlockedBySlowMode && !isDropMode;
  const isChatLinksRestrictionActive = isChatLinkRestrictionApplicable({
    dropType: ApiDropType.Chat,
    linksDisabled: wave.chat.links_disabled === true,
    isWaveAdmin: wave.wave.authenticated_user_eligible_for_admin === true,
    isWaveCreator: areHandlesEqual(
      connectedProfile?.handle,
      wave.author.handle
    ),
  });
  const hasChatContentWithLink = useMemo(() => {
    if (!isChatLinksRestrictionActive || isDropMode) {
      return false;
    }

    const contentParts = [
      getMarkdown,
      ...(drop?.parts.map((part) => part.content ?? null) ?? []),
    ];

    return contentParts.some(containsDisallowedLink);
  }, [drop?.parts, getMarkdown, isChatLinksRestrictionActive, isDropMode]);
  const isLinksSubmitBlocked = hasChatContentWithLink;
  const canSubmit =
    getCanSubmit() && !isSlowModeSubmitBlocked && !isLinksSubmitBlocked;
  const canAddPart = getCanAddPart();
  const latestEditableChatDropTarget = useLatestEditableChatDropTarget({
    waveId: wave.id,
    connectedProfile,
    isProxyMode: Boolean(activeProfileProxy),
  });
  const canEditLastDropWithArrow =
    !isDropMode &&
    !isStormModeActive &&
    !submitting &&
    editingDropId === null &&
    activeDrop === null &&
    (getMarkdown?.trim().length ?? 0) === 0 &&
    files.length === 0 &&
    (drop?.parts.length ?? 0) === 0 &&
    latestEditableChatDropTarget !== null;
  const handleRequestEditLastDrop = useCallback((): boolean => {
    if (!canEditLastDropWithArrow || !latestEditableChatDropTarget) {
      return false;
    }

    dispatch(setEditingDropId(latestEditableChatDropTarget.id));
    waveChatScroll?.requestScrollToSerialNo({
      waveId: wave.id,
      serialNo: latestEditableChatDropTarget.serialNo,
    });
    return true;
  }, [
    canEditLastDropWithArrow,
    dispatch,
    latestEditableChatDropTarget,
    wave.id,
    waveChatScroll,
  ]);
  const normalizedCurationDropUrl = useMemo(() => {
    if (!isCurationSubmissionExperience || isDropMode) {
      return null;
    }
    return normalizeCurationDropInput(getMarkdown ?? "");
  }, [getMarkdown, isCurationSubmissionExperience, isDropMode]);
  const showCurationDropModeWarning =
    !isDropMode &&
    !!normalizedCurationDropUrl &&
    isCurationSubmissionExperience &&
    (canSubmitCurationUrl || !!curationUrlSubmitRestrictionMessage);

  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
  const lastExternalAttachmentDropTokenRef = useRef<number | null>(null);

  const onReferencedNft = (newNft: ReferencedNft) => {
    setReferencedNfts([
      ...referencedNfts.filter(
        (i) => !(i.token === newNft.token && i.contract === newNft.contract)
      ),
      newNft,
    ]);
  };

  const [mentionedUsers, setMentionedUsers] = useState<
    Omit<MentionedUser, "current_handle">[]
  >([]);

  const onMentionedUser = (newUser: Omit<MentionedUser, "current_handle">) => {
    setMentionedUsers((curr) => {
      return [...curr, newUser];
    });
  };

  const [mentionedWaves, setMentionedWaves] = useState<MentionedWave[]>([]);

  const onMentionedWave = (newWave: MentionedWave) => {
    setMentionedWaves((curr) => {
      return [...curr, newWave];
    });
  };

  const createDropInputRef = useRef<CreateDropInputHandles | null>(null);
  const shouldRefocusAfterChatSubmitRef = useRef(false);
  const isInitialMountRef = useRef(true);

  const identityValidationMessage = useMemo(() => {
    if (!isIdentitySubmissionExperience || !isDropMode) {
      return null;
    }

    if (
      identitySubmissionMode ===
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself
    ) {
      return viewerSelectableIdentity
        ? null
        : "We couldn't determine your identity for this submission.";
    }

    if (!selectedIdentity) {
      return "Select an identity to nominate.";
    }

    if (
      identitySubmissionMode ===
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers &&
      normalizeIdentityValue(selectedIdentity) ===
        normalizeIdentityValue(viewerSelectableIdentity)
    ) {
      return SELECT_OTHER_IDENTITY_ERROR;
    }

    return null;
  }, [
    identitySubmissionMode,
    isDropMode,
    isIdentitySubmissionExperience,
    selectedIdentity,
    viewerSelectableIdentity,
  ]);

  const showIdentityValidationMessage =
    !!identityValidationMessage &&
    (hasAttemptedIdentitySubmit ||
      (selectedIdentity !== null &&
        identitySubmissionMode ===
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers) ||
      identitySubmissionMode ===
        ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself);

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

    return pollValidation.request;
  };

  const getReplyTo = () => {
    if (activeDrop?.action === ActiveDropAction.REPLY) {
      return {
        drop_id: activeDrop.drop.id,
        drop_part_id: activeDrop.partId,
      };
    }
    return undefined;
  };

  const getInitialDrop = (): CreateDropConfig | null => {
    const markdown = getMarkdown;
    if (shouldUseInitialDropConfig(markdown, files.length)) {
      const baseParts = drop?.parts.length ? drop.parts : [];
      const replyTo = getReplyTo();
      const replyToObj = replyTo ? { reply_to: replyTo } : {};
      const pollRequest = getPollRequest();
      const pollObj = pollRequest ? { poll: pollRequest } : {};
      return {
        title: null,
        ...replyToObj,
        ...pollObj,
        parts: ensurePartsWithFallback(baseParts, hasMetadata || hasValidPoll),
        mentioned_users: drop?.mentioned_users ?? [],
        mentioned_groups: getMentionedGroupsFromParts(baseParts, canMentionAll),
        mentioned_waves: drop?.mentioned_waves ?? [],
        referenced_nfts: drop?.referenced_nfts ?? [],
        metadata: getSubmissionMetadata(),
        signature: null,
        drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
        is_safe_signature: isSafeWallet,
        signer_address: address ?? "",
      };
    }
    return null;
  };

  const replyTo = getReplyTo();
  const replyToObj = replyTo ? { reply_to: replyTo } : {};

  const createGifDrop = (gif: string): CreateDropConfig => {
    const pollRequest = getPollRequest();
    const pollObj = pollRequest ? { poll: pollRequest } : {};
    const parts: CreateDropPart[] = [
      ...(drop?.parts ?? []),
      {
        content: gif,
        quoted_drop:
          activeDrop?.action === ActiveDropAction.QUOTE
            ? {
                drop_id: activeDrop.drop.id,
                drop_part_id: activeDrop.partId,
              }
            : null,
        media: files,
        mentioned_groups: [],
      },
    ];

    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      ...replyToObj,
      ...pollObj,
      parts,
      mentioned_users: [],
      mentioned_groups: getMentionedGroupsFromParts(parts, canMentionAll),
      mentioned_waves: [],
      referenced_nfts: [],
      metadata: getSubmissionMetadata(),
      signature: null,
      is_safe_signature: isSafeWallet,
      signer_address: address ?? "",
    };
  };

  const createCurrentDrop = (
    markdown: string | null,
    allMentions: ApiDropMentionedUser[],
    allNfts: ReferencedNft[],
    allWaves: ApiMentionedWave[],
    currentMentionedGroups: ApiDropGroupMention[]
  ): CreateDropConfig => {
    const availableFiles = files;
    const hasPartsInDrop = (drop?.parts.length ?? 0) > 0;
    const hasCurrentContent = hasCurrentDropPartContent(
      markdown,
      availableFiles.length
    );
    const quotedDrop =
      activeDrop?.action === ActiveDropAction.QUOTE
        ? {
            drop_id: activeDrop.drop.id,
            drop_part_id: activeDrop.partId,
          }
        : null;

    const nonCurationParts =
      hasPartsInDrop && !hasCurrentContent
        ? (drop?.parts ?? [])
        : [
            ...(drop?.parts ?? []),
            {
              content: markdown?.length ? markdown : null,
              quoted_drop: quotedDrop,
              media: availableFiles,
              mentioned_groups: currentMentionedGroups,
            },
          ];

    const parts = ensurePartsWithFallback(
      nonCurationParts,
      hasMetadata || hasValidPoll
    );
    const pollRequest = getPollRequest();
    const pollObj = pollRequest ? { poll: pollRequest } : {};
    const replyTo = getReplyTo();
    const replyToObj = replyTo ? { reply_to: replyTo } : {};
    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      ...replyToObj,
      ...pollObj,
      parts,
      mentioned_users: allMentions,
      mentioned_groups: getMentionedGroupsFromParts(parts, canMentionAll),
      mentioned_waves: allWaves,
      referenced_nfts: allNfts,
      metadata: getSubmissionMetadata(),
      signature: null,
      is_safe_signature: isSafeWallet,
      signer_address: address ?? "",
    };
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
      handleDropPart(
        markdown,
        existingMentions,
        existingNfts,
        existingWaves,
        mentionedUsers,
        referencedNfts,
        mentionedWaves
      );

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

  const filterMentionedUsers = ({
    mentionedUsers,
    parts,
  }: {
    readonly mentionedUsers: ApiDropMentionedUser[];
    readonly parts: CreateDropPart[];
  }): ApiDropMentionedUser[] =>
    mentionedUsers.filter((user) =>
      parts.some((part) =>
        part.content?.includes(`@[${user.handle_in_content}]`)
      )
    );

  const filterMentionedWaves = ({
    mentionedWaves: mentionedWavesList,
    parts,
  }: {
    readonly mentionedWaves: ApiMentionedWave[];
    readonly parts: CreateDropPart[];
  }): ApiMentionedWave[] =>
    mentionedWavesList.filter((w) =>
      parts.some((part) =>
        part.content?.includes(`#[${w.wave_name_in_content}]`)
      )
    );

  const filterMentionedGroups = ({
    parts,
  }: {
    readonly parts: CreateDropPart[];
  }): ApiDropGroupMention[] =>
    getMentionedGroupsFromParts(parts, canMentionAll);

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

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
    setSelectedIdentityState(null);
    setHasAttemptedIdentitySubmitState(null);
    setIdentityPickerOpenState(null);
    setIdentityPickerErrorMessageState(null);
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

  const getUpdatedDropRequest = async (
    requestBody: ApiCreateDropRequest
  ): Promise<ApiCreateDropRequest | null> => {
    if (requestBody.drop_type === ApiDropType.Chat) {
      return requestBody;
    }
    if (!wave.participation.signature_required) {
      return requestBody;
    }

    // Use direct signature if there are no terms to display
    if (!wave.participation.terms) {
      const { success, signature } = await signDrop({
        drop: requestBody,
        termsOfService: null,
      });

      if (!success || !signature) {
        return null;
      }

      return {
        ...requestBody,
        signature,
      };
    }

    // For terms that need to be displayed, use the terms flow
    return new Promise<ApiCreateDropRequest | null>((resolve) => {
      // Define callback for when signing completes
      const handleSigningComplete = (result: {
        success: boolean;
        signature?: string | undefined;
      }) => {
        if (!result.success || !result.signature) {
          resolve(null);
          return;
        }

        const updatedDropRequest = {
          ...requestBody,
          signature: result.signature,
        };
        resolve(updatedDropRequest);
      };

      // Show the terms modal through a global event
      const event = new CustomEvent("showTermsModal", {
        detail: {
          drop: requestBody,
          termsOfService: wave.participation.terms,
          onComplete: handleSigningComplete,
        },
      });
      document.dispatchEvent(event);
    });
  };
  const prepareAndSubmitDrop = async (dropRequest: CreateDropConfig) => {
    if (submitting) {
      return;
    }

    if (dropRequest.drop_type === ApiDropType.Chat && isChatBlockedBySlowMode) {
      return;
    }

    if (
      dropRequest.drop_type === ApiDropType.Chat &&
      isChatLinksRestrictionActive &&
      dropRequest.parts.some((part) => containsDisallowedLink(part.content))
    ) {
      return;
    }

    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }

    if (!dropRequest.parts.length) {
      setSubmitting(false);
      return;
    }

    try {
      const generatedParts = await generateParts(
        dropRequest.parts,
        setUploadingFiles
      );
      if (!generatedParts.length) {
        setSubmitting(false);
        return;
      }
      const parts = toApiCreateDropParts(generatedParts);

      const requestBody: ApiCreateDropRequest = {
        ...dropRequest,
        mentioned_users: filterMentionedUsers({
          mentionedUsers: dropRequest.mentioned_users,
          parts: dropRequest.parts,
        }),
        mentioned_waves: filterMentionedWaves({
          mentionedWaves: dropRequest.mentioned_waves ?? [],
          parts: dropRequest.parts,
        }),
        mentioned_groups: filterMentionedGroups({
          parts: dropRequest.parts,
        }),
        metadata: dropRequest.metadata,
        wave_id: wave.id,
        parts,
      };

      const updatedDropRequest = await getUpdatedDropRequest(requestBody);
      if (!updatedDropRequest) {
        setSubmitting(false);
        return;
      }

      const optimisticDrop = getOptimisticDrop(
        {
          ...updatedDropRequest,
          parts: updatedDropRequest.parts.map((part, index) => ({
            ...part,
            media: generatedParts[index]?.media ?? part.media,
          })),
        },
        connectedProfile,
        wave,
        activeDrop,
        isDropMode ? ApiDropType.Participatory : ApiDropType.Chat
      );

      const submitAccepted = submitDrop({
        drop: updatedDropRequest,
        dropId: optimisticDrop?.id ?? null,
        onSuccess:
          isDropMode && canExitDropMode
            ? () => handleDropModeChange(false)
            : undefined,
        onError:
          isDropMode && canExitDropMode
            ? handleDuplicateIdentitySubmissionError
            : undefined,
      });
      if (!submitAccepted) {
        return;
      }

      const shouldKeepChatFocused =
        updatedDropRequest.drop_type === ApiDropType.Chat;

      if (optimisticDrop) {
        const optimisticDropWithAttachments = {
          ...optimisticDrop,
          parts: optimisticDrop.parts.map((part, index) => ({
            ...part,
            attachments: generatedParts[index]?.uploaded_attachments ?? [],
          })),
        };
        addOptimisticDrop({ drop: optimisticDropWithAttachments });
        setTimeout(
          () =>
            processIncomingDrop(
              optimisticDropWithAttachments,
              ProcessIncomingDropType.DROP_INSERT
            ),
          0
        );
      }
      if (getMarkdown?.length) {
        shouldCollapseOptionsAfterMarkdownSyncRef.current = false;
        createDropInputRef.current?.clearEditorState();
      }
      if (shouldKeepChatFocused) {
        shouldRefocusAfterChatSubmitRef.current = true;
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if (isApp && !shouldKeepChatFocused) {
        void import("@capacitor/core").then(({ Capacitor }) => {
          if (Capacitor.getPlatform() === "android") {
            void import("@capacitor/keyboard").then(({ Keyboard }) => {
              void Keyboard.hide().catch(() => {});
            });
          }
        });
      }
      setFiles([]);
      if (isIdentityPickerAllowed) {
        setIdentityPickerAutoOpenState({
          scopeKey: identitySubmissionSessionScopeKey,
          value: false,
        });
      }
      refreshState();
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't submit this drop.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const missingRequirements = useMemo<MissingRequirements>(
    () =>
      getMissingRequirements(
        isDropMode,
        metadata,
        files,
        wave.participation.required_media
      ),
    [files, isDropMode, metadata, wave.participation.required_media]
  );

  const onDrop = async (): Promise<void> => {
    if (submitting) {
      return;
    }

    if (hasPendingInlineImageUpload) {
      return;
    }

    if (isSlowModeSubmitBlocked) {
      return;
    }

    if (isLinksSubmitBlocked) {
      return;
    }

    if (identityValidationMessage) {
      setHasAttemptedIdentitySubmitState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasMetadataValidationErrors) {
      setMetadataOpenState({
        scopeKey: dropModeSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasPollValidationError) {
      return;
    }

    if (
      missingRequirements.metadata.length ||
      missingRequirements.media.length
    ) {
      return;
    }

    const hasPartsInDrop = (drop?.parts.length ?? 0) > 0;
    const hasCurrentContent =
      (getMarkdown?.trim().length ?? 0) > 0 || files.length > 0;

    if (hasPartsInDrop && hasCurrentContent) {
      finalizeAndAddDropPart();
      return;
    }

    await prepareAndSubmitDrop(getUpdatedDrop());
  };

  const onGifDrop = async (gif: string): Promise<void> => {
    if (submitting) {
      return;
    }
    if (hasPendingInlineImageUpload) {
      return;
    }
    if (identityValidationMessage) {
      setHasAttemptedIdentitySubmitState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasMetadataValidationErrors) {
      setMetadataOpenState({
        scopeKey: dropModeSessionScopeKey,
        value: true,
      });
      return;
    }

    if (hasPollValidationError) {
      return;
    }

    await prepareAndSubmitDrop(createGifDrop(gif));
  };

  const onSwitchToDropMode = useCallback(() => {
    if (!normalizedCurationDropUrl) {
      return;
    }
    onSwitchToDropModeWithUrl(normalizedCurationDropUrl);
  }, [normalizedCurationDropUrl, onSwitchToDropModeWithUrl]);

  const focusInputWithDelay = (delay: number) => {
    setTimeout(() => {
      createDropInputRef.current?.focus();
    }, delay);
  };

  const focusMobileInput = useCallback(() => {
    if (!createDropInputRef.current) return;
    requestAnimationFrame(() => {
      focusInputWithDelay(300);
    });
  }, []);

  const focusDesktopInput = () => {
    createDropInputRef.current?.focus();
  };

  useEffect(() => {
    if (!activeDrop) {
      return;
    }

    // Skip auto-focus on initial mount in app to prevent keyboard from opening
    if (isApp && isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    isInitialMountRef.current = false;

    if (isApp) {
      const timer = setTimeout(focusMobileInput, 200);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      focusDesktopInput();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeDrop, isApp, focusMobileInput]);

  const handleFileChange = (newFiles: File[]) => {
    try {
      newFiles.forEach((file) => {
        if (isAttachmentUploadFile(file)) {
          validateAttachmentUploadFile(file);
        }
      });
    } catch (error) {
      setToast({
        type: "error",
        title: "Couldn't add this file.",
        description: "Check the file and try again.",
        details: getToastErrorDetails(error),
      });
      return;
    }

    const existingPartFiles = drop?.parts.flatMap((part) => part.media) ?? [];
    const existingFileIds = new Set(
      [...existingPartFiles, ...files].map(getFileIdentity)
    );
    const uniqueNewFiles = newFiles.filter((file) => {
      const fileId = getFileIdentity(file);
      if (existingFileIds.has(fileId)) {
        return false;
      }
      existingFileIds.add(fileId);
      return true;
    });
    const duplicateCount = newFiles.length - uniqueNewFiles.length;
    const existingCount = existingPartFiles.length;
    const total = existingCount + files.length + uniqueNewFiles.length;
    const overflow = Math.max(0, total - MAX_DROP_UPLOAD_FILES);
    const mergedFiles = [...files, ...uniqueNewFiles];
    const updatedFiles = overflow
      ? mergedFiles.slice(-MAX_DROP_UPLOAD_FILES)
      : mergedFiles;

    setFiles(updatedFiles);

    if (overflow > 0) {
      setToast({
        message: `File limit exceeded. The ${overflow} oldest file${
          overflow > 1 ? "s were" : " was"
        } removed to maintain the ${MAX_DROP_UPLOAD_FILES}-file limit. New files have been added.`,
        type: "warning",
      });
    }

    if (duplicateCount > 0) {
      setToast({
        message: `${duplicateCount} duplicate file${
          duplicateCount > 1 ? "s were" : " was"
        } skipped.`,
        type: "warning",
      });
    }

    if (!isWideContainer) {
      shouldAnimateOptionsRef.current = true;
      setShowOptionsState({ scopeKey: wave.id, value: false });
      closeOnNextInputRef.current = false;
    }
  };

  const latestHandleFileChangeRef = useRef(handleFileChange);
  latestHandleFileChangeRef.current = handleFileChange;

  useEffect(() => {
    if (!externalAttachmentDrop || externalAttachmentDrop.files.length === 0) {
      return;
    }

    if (
      lastExternalAttachmentDropTokenRef.current ===
      externalAttachmentDrop.token
    ) {
      return;
    }

    lastExternalAttachmentDropTokenRef.current = externalAttachmentDrop.token;
    latestHandleFileChangeRef.current(externalAttachmentDrop.files);
    onExternalAttachmentDropConsumed?.();
  }, [externalAttachmentDrop, onExternalAttachmentDropConsumed]);

  const handleSetShowOptions = useCallback(
    (next: boolean) => {
      shouldAnimateOptionsRef.current = true;
      setShowOptionsState({ scopeKey: wave.id, value: next });
      if (isWideContainer) {
        closeOnNextInputRef.current = false;
        return;
      }
      closeOnNextInputRef.current = next;
    },
    [isWideContainer, wave.id]
  );

  const handleEditorStateChange = useCallback(
    (newEditorState: EditorState) => {
      setEditorState(newEditorState);
      shouldCollapseOptionsAfterMarkdownSyncRef.current = true;

      if (isWideContainer) {
        return;
      }

      if (closeOnNextInputRef.current) {
        collapseOptions();
      }
    },
    [collapseOptions, isWideContainer]
  );

  const handleEditorBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (isWideContainer) {
        return;
      }
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && actionsContainerRef.current?.contains(nextTarget)) {
        return;
      }
      shouldAnimateOptionsRef.current = true;
      setShowOptionsState({ scopeKey: wave.id, value: false });
      closeOnNextInputRef.current = false;
    },
    [isWideContainer, wave.id]
  );

  const removeFile = (file: File, partIndex?: number) => {
    if (partIndex === undefined) {
      // Remove file from the current files array
      setFiles((prevFiles) => prevFiles.filter((f) => f !== file));
    } else {
      // Remove file from a specific part
      setDrop((prevDrop) => {
        if (!prevDrop) return null;

        const newParts = [...prevDrop.parts];
        const part = newParts[partIndex];
        if (!part) return prevDrop;
        newParts[partIndex] = {
          ...part,
          media: part.media.filter((f) => f !== file),
        };
        return { ...prevDrop, parts: newParts };
      });
    }
  };

  useEffect(() => {
    if (!drop) {
      setIsStormMode(false);
      return;
    }

    if (!drop.parts.length) {
      setIsStormMode(false);
    }
  }, [drop, setIsStormMode]);

  const openMetadata = useCallback(() => {
    setMetadataOpenState({
      scopeKey: dropModeSessionScopeKey,
      value: true,
    });
  }, [dropModeSessionScopeKey]);

  const closeMetadata = useCallback(() => {
    setMetadataOpenState({
      scopeKey: dropModeSessionScopeKey,
      value: false,
    });
  }, [dropModeSessionScopeKey]);

  const togglePoll = useCallback(() => {
    if (!canCreatePoll) {
      return;
    }

    setPollDraftState((current) =>
      current?.scopeKey === wave.id
        ? null
        : {
            scopeKey: wave.id,
            value: createDefaultDropPollDraft(),
          }
    );
  }, [canCreatePoll, wave.id]);

  const updatePollDraft = useCallback(
    (value: CreateDropPollDraft) => {
      setPollDraftState({
        scopeKey: wave.id,
        value,
      });
    },
    [wave.id]
  );

  const removePoll = useCallback(() => {
    setPollDraftState(null);
  }, []);

  const handleDropModeChange = useCallback(
    (newIsDropMode: boolean) => {
      if (!newIsDropMode) {
        closeMetadata();
      }
      onDropModeChange(newIsDropMode);
    },
    [closeMetadata, onDropModeChange]
  );

  const openIdentityPicker = useCallback(() => {
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: true,
    });
  }, [identitySubmissionSessionScopeKey]);

  const closeIdentityPicker = useCallback(() => {
    if (!selectedIdentitySelection && !canExitDropMode) {
      return;
    }

    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    if (!selectedIdentitySelection) {
      handleDropModeChange(false);
    }
  }, [
    canExitDropMode,
    handleDropModeChange,
    identitySubmissionSessionScopeKey,
    selectedIdentitySelection,
  ]);

  const closeIdentitySelectionPanel = useCallback(() => {
    setIdentityPickerAutoOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerOpenState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: false,
    });
    setIdentityPickerErrorMessageState({
      scopeKey: identitySubmissionSessionScopeKey,
      value: null,
    });
    handleDropModeChange(false);
  }, [handleDropModeChange, identitySubmissionSessionScopeKey]);

  const handleDuplicateIdentitySubmissionError = useCallback(
    (error: unknown) => {
      if (!canExitDropMode) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message.toLowerCase()
          : String(error).toLowerCase();
      const isDuplicateIdentityError =
        message.includes("identity") &&
        (message.includes("already been voted") ||
          message.includes("already voted") ||
          message.includes("already been nominated") ||
          message.includes("already nominated"));

      if (isDuplicateIdentityError) {
        handleDropModeChange(false);
      }
    },
    [canExitDropMode, handleDropModeChange]
  );

  const handleIdentitySelection = useCallback(
    (selection: SelectableIdentityOption) => {
      if (
        identitySubmissionMode ===
          ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers &&
        normalizeIdentityValue(selection.value) ===
          normalizeIdentityValue(viewerSelectableIdentity)
      ) {
        setIdentityPickerErrorMessageState({
          scopeKey: identitySubmissionSessionScopeKey,
          value: SELECT_OTHER_IDENTITY_ERROR,
        });
        return;
      }

      setSelectedIdentityState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: selection,
      });
      setIdentityPickerAutoOpenState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
      setHasAttemptedIdentitySubmitState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
      setIdentityPickerErrorMessageState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: null,
      });
      setIdentityPickerOpenState({
        scopeKey: identitySubmissionSessionScopeKey,
        value: false,
      });
    },
    [
      identitySubmissionMode,
      identitySubmissionSessionScopeKey,
      viewerSelectableIdentity,
    ]
  );

  const onChangeKey = (params: { index: number; newKey: string }) => {
    setMetadata((prev) =>
      prev.map((item, i) =>
        i === params.index ? { ...item, key: params.newKey } : item
      )
    );
  };

  const onChangeValue = (params: {
    index: number;
    newValue: string | number | null;
  }) => {
    setMetadata((prev) =>
      prev.map((item, i) => {
        if (i !== params.index) return item;
        if (item.type === ApiWaveMetadataType.Number) {
          if (params.newValue === null || params.newValue === "") {
            return { ...item, value: null };
          }
          const parsedValue = Number(params.newValue);
          return {
            ...item,
            value: Number.isNaN(parsedValue) ? null : parsedValue,
          };
        }

        if (item.type === ApiWaveMetadataType.String) {
          if (typeof params.newValue === "string") {
            return { ...item, value: params.newValue };
          }
          return { ...item, value: String(params.newValue) };
        }

        return item;
      })
    );
  };

  const onAddMetadata = () => {
    setMetadata([
      ...metadata,
      {
        id: generateMetadataId(),
        key: "",
        type: null,
        value: null,
        required: false,
      },
    ]);
  };

  const onRemoveMetadata = (index: number) => {
    setMetadata((prev) => {
      const newMetadata = [...prev];
      newMetadata.splice(index, 1);
      return newMetadata;
    });
  };

  const breakIntoStorm = () => {
    finalizeAndAddDropPart();
    setIsStormMode(true);
  };

  // Clear active reply/quote when entering edit mode on mobile
  useEffect(() => {
    if (isApp && editingDropId && activeDrop) {
      onCancelReplyQuote();
    }
  }, [isApp, editingDropId, activeDrop, onCancelReplyQuote]);

  const isChatClosed =
    wave.wave.type === ApiWaveType.Chat && !wave.chat.enabled;

  if (isChatClosed) {
    return (
      <div className="tw-w-full tw-flex-grow tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-center tw-text-sm tw-font-medium tw-text-iron-500">
        Wave is closed
      </div>
    );
  }

  const shouldShowIdentitySubmissionControls =
    isIdentitySubmissionExperience &&
    isDropMode &&
    identitySubmissionMode !== null;
  const showInlineIdentityPicker =
    shouldShowIdentitySubmissionControls &&
    identityPickerPlacement === "inline" &&
    (!selectedIdentitySelection || isIdentityPickerOpen);
  const showIdentityField =
    shouldShowIdentitySubmissionControls && !showInlineIdentityPicker;
  const showModalIdentityPicker =
    shouldShowIdentitySubmissionControls &&
    identityPickerPlacement === "modal" &&
    identitySubmissionMode !==
      ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself;
  const showComposer = !showInlineIdentityPicker;

  return (
    <div className="tw-flex-grow">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        submitting={submitting}
        onCancelReplyQuote={onCancelReplyQuote}
        dropId={dropId}
      />
      {showIdentityField && (
        <CreateDropIdentityField
          mode={identitySubmissionMode}
          selectedIdentity={selectedIdentitySelection}
          selfIdentity={viewerIdentity}
          disabled={submitting}
          errorMessage={
            showIdentityValidationMessage ? identityValidationMessage : null
          }
          onOpenPicker={openIdentityPicker}
          onClosePanel={
            canExitDropMode && dropModeToggleExitLabel === null
              ? closeIdentitySelectionPanel
              : undefined
          }
        />
      )}
      {showInlineIdentityPicker && (
        <CreateDropInlineIdentityPickerPanel
          mode={identitySubmissionMode}
          selectedIdentity={selectedIdentitySelection}
          disabled={submitting}
          errorMessage={identityPickerErrorMessage}
          canClose={canDismissIdentityPicker}
          onClose={closeIdentityPicker}
          onSelect={handleIdentitySelection}
        />
      )}
      {showModalIdentityPicker && (
        <CreateDropIdentityPickerModal
          isOpen={isIdentityPickerOpen}
          mode={identitySubmissionMode}
          selectedIdentity={selectedIdentitySelection}
          disabled={submitting}
          errorMessage={identityPickerErrorMessage}
          canClose={canDismissIdentityPicker}
          onClose={closeIdentityPicker}
          onSelect={handleIdentitySelection}
        />
      )}
      {showComposer && (
        <>
          <div className="tw-flex tw-w-full tw-items-end">
            <div
              ref={setActionsContainerRef}
              className="tw-grid tw-w-full tw-grid-cols-[auto_minmax(0,1fr)] tw-items-center tw-gap-x-2 lg:tw-gap-x-3"
            >
              <div className="tw-col-start-2 tw-row-start-1 tw-min-w-0">
                <SlowModeChatNotice wave={wave} isDropMode={isDropMode} />
                {isLinksSubmitBlocked && (
                  <p
                    className="tw-mb-2 tw-mt-0 tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-400"
                    aria-live="polite"
                  >
                    {CHAT_LINK_RESTRICTION_MESSAGE}
                  </p>
                )}
              </div>
              <div className="tw-col-start-1 tw-row-start-2 tw-mb-1 tw-self-end">
                <CreateDropActions
                  isStormMode={isStormModeActive}
                  isDropMode={isDropMode}
                  canAddPart={canAddPart}
                  submitting={submitting}
                  showOptions={showOptions}
                  animateOptions={
                    shouldAnimateOptionsRef.current &&
                    showOptionsState?.scopeKey === wave.id
                  }
                  isRequiredMetadataMissing={
                    !!missingRequirements.metadata.length
                  }
                  isRequiredMediaMissing={!!missingRequirements.media.length}
                  canCreatePoll={canCreatePoll}
                  isPollActive={hasPoll}
                  handleFileChange={handleFileChange}
                  onAddMetadataClick={openMetadata}
                  onTogglePoll={togglePoll}
                  breakIntoStorm={breakIntoStorm}
                  setShowOptions={handleSetShowOptions}
                  onGifDrop={onGifDrop}
                />
              </div>
              <div className="tw-col-start-2 tw-row-start-2 tw-w-full tw-min-w-0">
                <CreateDropInput
                  waveId={wave.id}
                  key={dropEditorRefreshKey}
                  ref={createDropInputRef}
                  editorState={editorState}
                  type={activeDrop?.action ?? null}
                  submitting={submitting}
                  isStormMode={isStormModeActive}
                  isDropMode={isDropMode}
                  canMentionAll={canMentionAll}
                  canSubmit={canSubmit}
                  onEditorState={handleEditorStateChange}
                  onEditorBlur={handleEditorBlur}
                  onReferencedNft={onReferencedNft}
                  onMentionedUser={onMentionedUser}
                  onMentionedWave={onMentionedWave}
                  onAttachmentFiles={handleFileChange}
                  canEditLastDropWithArrow={canEditLastDropWithArrow}
                  onRequestEditLastDrop={handleRequestEditLastDrop}
                  onDrop={onDrop}
                />
                {pollDraft && (
                  <CreateDropPoll
                    draft={pollDraft}
                    disabled={submitting}
                    validationError={pollValidation.error}
                    onChange={updatePollDraft}
                    onRemove={removePoll}
                  />
                )}
                {showCurationDropModeWarning && (
                  <div className="tw-mt-2 tw-text-[11px] tw-leading-4 tw-text-amber-200/90">
                    This looks like a curation URL.{" "}
                    {canSubmitCurationUrl ? (
                      <button
                        type="button"
                        className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-medium tw-text-amber-300 tw-underline tw-transition desktop-hover:hover:tw-text-amber-100"
                        onClick={onSwitchToDropMode}
                      >
                        Submit it as a drop
                      </button>
                    ) : (
                      <span>{curationUrlSubmitRestrictionMessage}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="tw-ml-2 lg:tw-ml-3">
              <div className="tw-flex tw-items-center tw-gap-x-3">
                <CreateDropSubmit
                  submitting={submitting}
                  canSubmit={canSubmit}
                  onDrop={onDrop}
                  isDropMode={isDropMode}
                  disabledTooltip={
                    isLinksSubmitBlocked ? CHAT_LINK_RESTRICTION_MESSAGE : null
                  }
                />
              </div>
            </div>
          </div>
          {isDropMode && (
            <CreateDropContentRequirements
              canSubmit={canSubmit}
              wave={wave}
              missingMedia={missingRequirements.media}
              missingMetadata={missingRequirements.metadata}
              onOpenMetadata={openMetadata}
              setFiles={handleFileChange}
              disabled={submitting}
            />
          )}
          <LazyMotion features={domAnimation}>
            <AnimatePresence>
              {isDropMode && isMetadataOpen && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CreateDropMetadata
                    disabled={submitting}
                    onRemoveMetadata={onRemoveMetadata}
                    closeMetadata={closeMetadata}
                    metadata={metadata}
                    missingRequiredMetadataKeys={missingRequirements.metadata}
                    metadataErrorById={metadataErrorById}
                    onChangeKey={onChangeKey}
                    onChangeValue={onChangeValue}
                    onAddMetadata={onAddMetadata}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </LazyMotion>
          <CreateDropContentFiles
            parts={drop?.parts ?? []}
            files={files}
            uploadingFiles={uploadingFiles}
            removeFile={removeFile}
            disabled={submitting}
          />
        </>
      )}
      <TermsSignatureFlow enabled={termsSignatureFlowEnabled} />
    </div>
  );
};

export default memo(CreateDropContent);
