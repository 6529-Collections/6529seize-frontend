import type {
  CreateDropConfig,
  CreateDropPart,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { ApiCreateDropPollRequest } from "@/generated/models/ApiCreateDropPollRequest";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { MAX_DROP_UPLOAD_FILES } from "@/helpers/Helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { getMentionedGroupsFromParts } from "@/helpers/waves/drop-group-mentions";
import {
  isAttachmentUploadFile,
  validateAttachmentUploadFile,
} from "@/services/uploads/attachmentUploadMimeType";
import {
  ActiveDropAction,
  type ActiveDropState,
} from "@/types/dropInteractionTypes";
import type React from "react";
import {
  hasCurrentDropPartContent,
  shouldUseInitialDropConfig,
} from "../utils/createDropContentSubmission";
import type {
  CreateDropMetadataType,
  MutableCurrentRef,
  ScopedValueState,
} from "./types";

const getFileIdentity = (file: File): string =>
  [file.name, file.size, file.type, file.lastModified].join(":");

let fallbackDropPartClientId = 0;

const createDropPartClientId = (): string => {
  if (
    globalThis.crypto !== undefined &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  fallbackDropPartClientId += 1;
  return `wave-drop-part-${Date.now()}-${fallbackDropPartClientId}`;
};

export const normalizeIdentityValue = (identity: string | null | undefined) =>
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

export const hasMetadataContent = (
  metadata: CreateDropMetadataType[]
): boolean => metadata.some((item) => isMetadataValuePresent(item.value));

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

const getCanSubmitStorm = (markdown: string | null): boolean =>
  (markdown?.length ?? 0) <= 240;

export const canSubmitDrop = ({
  markdown,
  files,
  parts,
  hasMetadata,
  hasValidPoll,
  hasPendingInlineImageUpload,
  hasMetadataValidationErrors,
  hasPollValidationError,
}: {
  readonly markdown: string | null;
  readonly files: File[];
  readonly parts: CreateDropPart[];
  readonly hasMetadata: boolean;
  readonly hasValidPoll: boolean;
  readonly hasPendingInlineImageUpload: boolean;
  readonly hasMetadataValidationErrors: boolean;
  readonly hasPollValidationError: boolean;
}): boolean =>
  hasSubmissionContent({
    markdown,
    files,
    parts,
    hasMetadata,
    hasPoll: hasValidPoll,
  }) &&
  !hasPendingInlineImageUpload &&
  !hasMetadataValidationErrors &&
  !hasPollValidationError &&
  !!(parts.length ? getCanSubmitStorm(markdown) : true);

const getIsDropLimit = (
  drop: CreateDropConfig | null,
  markdown: string | null
): boolean =>
  (drop?.parts.reduce(
    (acc, part) => acc + (part.content?.length ?? 0),
    markdown?.length ?? 0
  ) ?? 0) >= 24000;

export const canAddDropPart = ({
  markdown,
  files,
  drop,
  hasPendingInlineImageUpload,
}: {
  readonly markdown: string | null;
  readonly files: File[];
  readonly drop: CreateDropConfig | null;
  readonly hasPendingInlineImageUpload: boolean;
}): boolean =>
  ((markdown?.trim().length ?? 0) > 0 || files.length > 0) &&
  !hasPendingInlineImageUpload &&
  !getIsDropLimit(drop, markdown);

export const canSubmitComposerAction = ({
  canAddPart,
  canSubmit,
  editingPartIndex,
  isStormMode,
}: {
  readonly canAddPart: boolean;
  readonly canSubmit: boolean;
  readonly editingPartIndex: number | null;
  readonly isStormMode: boolean;
}): boolean =>
  isStormMode && (editingPartIndex !== null || canAddPart)
    ? canAddPart
    : canSubmit;

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

export const handleDropPart = ({
  markdown,
  existingMentions,
  existingNfts,
  existingWaves,
  mentionedUsers,
  referencedNfts,
  mentionedWaves,
}: {
  readonly markdown: string | null;
  readonly existingMentions: ApiDropMentionedUser[];
  readonly existingNfts: ReferencedNft[];
  readonly existingWaves: ApiMentionedWave[];
  readonly mentionedUsers: Omit<MentionedUser, "current_handle">[];
  readonly referencedNfts: ReferencedNft[];
  readonly mentionedWaves: MentionedWave[];
}): HandleDropPartResult => {
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

export const getReplyTo = (activeDrop: ActiveDropState | null) => {
  if (activeDrop?.action === ActiveDropAction.REPLY) {
    return {
      drop_id: activeDrop.drop.id,
      drop_part_id: activeDrop.partId,
    };
  }
  return undefined;
};

export const buildInitialDrop = ({
  markdown,
  filesLength,
  drop,
  activeDrop,
  pollRequest,
  hasMetadata,
  hasValidPoll,
  metadata,
  isDropMode,
  isSafeWallet,
  address,
  canMentionAll,
}: {
  readonly markdown: string | null;
  readonly filesLength: number;
  readonly drop: CreateDropConfig | null;
  readonly activeDrop: ActiveDropState | null;
  readonly pollRequest: ApiCreateDropPollRequest | null;
  readonly hasMetadata: boolean;
  readonly hasValidPoll: boolean;
  readonly metadata: CreateDropConfig["metadata"];
  readonly isDropMode: boolean;
  readonly isSafeWallet: boolean;
  readonly address: string | null | undefined;
  readonly canMentionAll: boolean;
}): CreateDropConfig | null => {
  if (shouldUseInitialDropConfig(markdown, filesLength)) {
    const baseParts = drop !== null && drop.parts.length > 0 ? drop.parts : [];
    const replyTo = getReplyTo(activeDrop);
    const replyToObj = replyTo ? { reply_to: replyTo } : {};
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
      metadata,
      signature: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      is_safe_signature: isSafeWallet,
      signer_address: address ?? "",
    };
  }
  return null;
};

export const buildGifDrop = ({
  gif,
  drop,
  activeDrop,
  files,
  replyTo,
  pollRequest,
  isDropMode,
  canMentionAll,
  metadata,
  isSafeWallet,
  address,
}: {
  readonly gif: string;
  readonly drop: CreateDropConfig | null;
  readonly activeDrop: ActiveDropState | null;
  readonly files: File[];
  readonly replyTo: ReturnType<typeof getReplyTo>;
  readonly pollRequest: ApiCreateDropPollRequest | null;
  readonly isDropMode: boolean;
  readonly canMentionAll: boolean;
  readonly metadata: CreateDropConfig["metadata"];
  readonly isSafeWallet: boolean;
  readonly address: string | null | undefined;
}): CreateDropConfig => {
  const pollObj = pollRequest ? { poll: pollRequest } : {};
  const parts: CreateDropPart[] = [
    ...(drop?.parts ?? []),
    {
      clientId: createDropPartClientId(),
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
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...pollObj,
    parts,
    mentioned_users: [],
    mentioned_groups: getMentionedGroupsFromParts(parts, canMentionAll),
    mentioned_waves: [],
    referenced_nfts: [],
    metadata,
    signature: null,
    is_safe_signature: isSafeWallet,
    signer_address: address ?? "",
  };
};

export const buildCurrentDrop = ({
  markdown,
  files,
  drop,
  activeDrop,
  allMentions,
  allNfts,
  allWaves,
  currentMentionedGroups,
  pollRequest,
  hasMetadata,
  hasValidPoll,
  isDropMode,
  canMentionAll,
  metadata,
  isSafeWallet,
  address,
}: {
  readonly markdown: string | null;
  readonly files: File[];
  readonly drop: CreateDropConfig | null;
  readonly activeDrop: ActiveDropState | null;
  readonly allMentions: ApiDropMentionedUser[];
  readonly allNfts: ReferencedNft[];
  readonly allWaves: ApiMentionedWave[];
  readonly currentMentionedGroups: ApiDropGroupMention[];
  readonly pollRequest: ApiCreateDropPollRequest | null;
  readonly hasMetadata: boolean;
  readonly hasValidPoll: boolean;
  readonly isDropMode: boolean;
  readonly canMentionAll: boolean;
  readonly metadata: CreateDropConfig["metadata"];
  readonly isSafeWallet: boolean;
  readonly address: string | null | undefined;
}): CreateDropConfig => {
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
            clientId: createDropPartClientId(),
            content: (markdown?.length ?? 0) > 0 ? markdown : null,
            quoted_drop: quotedDrop,
            media: availableFiles,
            mentioned_groups: currentMentionedGroups,
          },
        ];

  const parts = ensurePartsWithFallback(
    nonCurationParts,
    hasMetadata || hasValidPoll
  );
  const pollObj = pollRequest ? { poll: pollRequest } : {};
  const replyTo = getReplyTo(activeDrop);
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
    metadata,
    signature: null,
    is_safe_signature: isSafeWallet,
    signer_address: address ?? "",
  };
};

export const filterMentionedUsers = ({
  mentionedUsers,
  parts,
}: {
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly parts: CreateDropPart[];
}): ApiDropMentionedUser[] =>
  mentionedUsers.filter((user) =>
    parts.some((part) => part.content?.includes(`@[${user.handle_in_content}]`))
  );

export const filterMentionedWaves = ({
  mentionedWaves: mentionedWavesList,
  parts,
}: {
  readonly mentionedWaves: ApiMentionedWave[];
  readonly parts: CreateDropPart[];
}): ApiMentionedWave[] =>
  mentionedWavesList.filter((w) =>
    parts.some((part) => part.content?.includes(`#[${w.wave_name_in_content}]`))
  );

export const getMentionedGroupsForParts = ({
  parts,
  canMentionAll,
}: {
  readonly parts: CreateDropPart[];
  readonly canMentionAll: boolean;
}): ApiDropGroupMention[] => getMentionedGroupsFromParts(parts, canMentionAll);

export const handleComposerFileChange = ({
  newFiles,
  drop,
  files,
  keepOptionsVisible,
  waveId,
  setToast,
  setFiles,
  setShowOptionsState,
  shouldAnimateOptionsRef,
  closeOnNextInputRef,
}: {
  readonly newFiles: File[];
  readonly drop: CreateDropConfig | null;
  readonly files: File[];
  readonly keepOptionsVisible: boolean;
  readonly waveId: string;
  readonly setToast: (toast: AppToastInput) => void;
  readonly setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  readonly setShowOptionsState: React.Dispatch<
    React.SetStateAction<ScopedValueState<boolean> | null>
  >;
  readonly shouldAnimateOptionsRef: MutableCurrentRef<boolean>;
  readonly closeOnNextInputRef: MutableCurrentRef<boolean>;
}) => {
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
  const allowedNewFileBudget = Math.max(
    0,
    MAX_DROP_UPLOAD_FILES - existingCount
  );
  const updatedFiles = overflow
    ? mergedFiles.slice(mergedFiles.length - allowedNewFileBudget)
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

  if (!keepOptionsVisible) {
    shouldAnimateOptionsRef.current = true;
    setShowOptionsState({ scopeKey: waveId, value: false });
    closeOnNextInputRef.current = false;
  }
};

export const createMetadataHandlers = ({
  metadata,
  setMetadata,
  generateMetadataId,
}: {
  readonly metadata: CreateDropMetadataType[];
  readonly setMetadata: React.Dispatch<
    React.SetStateAction<CreateDropMetadataType[]>
  >;
  readonly generateMetadataId: () => string;
}) => {
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
          if (params.newValue === null) {
            return { ...item, value: null };
          }
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

  return {
    onChangeKey,
    onChangeValue,
    onAddMetadata,
    onRemoveMetadata,
  };
};

export const isDuplicateIdentitySubmissionError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("identity") &&
    (message.includes("already been voted") ||
      message.includes("already voted") ||
      message.includes("already been nominated") ||
      message.includes("already nominated"))
  );
};
