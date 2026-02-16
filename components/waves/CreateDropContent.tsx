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
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getOptimisticDropId } from "@/helpers/waves/drop.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { DropPrivileges } from "@/hooks/useDropPriviledges";
import { selectEditingDropId } from "@/store/editSlice";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";
import { AnimatePresence, motion } from "framer-motion";
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
import { useSelector } from "react-redux";
import { AuthContext } from "../auth/Auth";
import { HASHTAG_TRANSFORMER } from "../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../drops/create/lexical/transformers/ImageTransformer";
import { MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/MentionTransformer";
import { WAVE_MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/WaveMentionTransformer";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import CreateDropActions from "./CreateDropActions";
import { CreateDropContentFiles } from "./CreateDropContentFiles";
import CreateDropContentRequirements from "./CreateDropContentRequirements";
import { CreateDropDropModeToggle } from "./CreateDropDropModeToggle";
import type { CreateDropInputHandles } from "./CreateDropInput";
import CreateDropInput from "./CreateDropInput";
import CreateDropMetadata from "./CreateDropMetadata";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import { CreateDropSubmit } from "./CreateDropSubmit";

import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { MAX_DROP_UPLOAD_FILES } from "@/helpers/Helpers";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { WsMessageType } from "@/helpers/Types";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { useWave } from "@/hooks/useWave";
import { useWebSocket } from "@/services/websocket";
import throttle from "lodash/throttle";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { EMOJI_TRANSFORMER } from "../drops/create/lexical/transformers/EmojiTransformer";
import { multiPartUpload } from "./create-wave/services/multiPartUpload";
import type { DropMutationBody } from "./CreateDrop";
import { generateMetadataId, useDropMetadata } from "./hooks/useDropMetadata";
import { convertMetadataToDropMetadata } from "./utils/convertMetadataToDropMetadata";
import {
  hasCurrentDropPartContent,
  shouldUseInitialDropConfig,
} from "./utils/createDropContentSubmission";
import type { MissingRequirements } from "./utils/getMissingRequirements";
import { getMissingRequirements } from "./utils/getMissingRequirements";
import { validateCurationDropInput } from "./utils/validateCurationDropUrl";

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
  readonly submitDrop: (dropRequest: DropMutationBody) => void;
  readonly privileges: DropPrivileges;
}

const CONTAINER_WIDTH_THRESHOLD = 500;

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
}: {
  readonly markdown: string | null;
  readonly files: File[];
  readonly parts: CreateDropPart[];
  readonly hasMetadata: boolean;
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

  return hasMetadata;
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
}

const generateMediaForPart = async (
  media: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
) => {
  setUploadingFiles((prev) => [
    ...prev,
    { file: media, isUploading: true, progress: 0 },
  ]);
  return await multiPartUpload({
    file: media,
    path: "drop",
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === media ? { ...uf, progress } : uf))
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));
  });
};

const generatePart = async (
  part: CreateDropPart,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<CreateDropRequestPart> => {
  const media = await Promise.all(
    part.media.map((media) => generateMediaForPart(media, setUploadingFiles))
  );
  return {
    ...part,
    media,
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
    if (message.includes("content_type")) {
      throw new Error("File type not supported. Please use MP4 for videos.");
    }
    throw new Error("Error uploading file. Please try again.");
  }
};

const getOptimisticDrop = (
  dropRequest: ApiCreateDropRequest,
  connectedProfile: ApiIdentity | null,
  wave: {
    id: string;
    name: string;
    pinned: boolean;
    picture: string | null;
    description_drop: { id: string };
    participation: { authenticated_user_eligible: boolean };
    voting: {
      authenticated_user_eligible: boolean;
      credit_type: ApiWaveCreditType;
      period?: { min: number | null; max: number | null } | undefined;
      forbid_negative_votes: boolean;
    };
    chat: { authenticated_user_eligible: boolean };
  },
  activeDrop: ActiveDropState | null,
  dropType: ApiDropType
): ApiDrop | null => {
  if (!connectedProfile?.id || !connectedProfile.handle) {
    return null;
  }

  const getReplyTo = (): ApiReplyToDropResponse | undefined => {
    if (activeDrop?.action === ActiveDropAction.REPLY) {
      return {
        drop_id: activeDrop.drop.id,
        drop_part_id: activeDrop.partId,
        is_deleted: false,
        drop: activeDrop.drop,
      };
    }
    return undefined;
  };

  const replyTo = getReplyTo();
  const replyToObj = replyTo ? { reply_to: replyTo } : {};

  return {
    id: getOptimisticDropId(),
    serial_no: Date.now(),
    ...replyToObj,
    wave: {
      id: wave.id,
      name: wave.name,
      pinned: wave.pinned,
      picture: wave.picture ?? "",
      description_drop_id: wave.description_drop.id,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      voting_credit_type: wave.voting.credit_type,
      voting_period_start: wave.voting.period?.min ?? null,
      voting_period_end: wave.voting.period?.max ?? null,
      visibility_group_id: null,
      participation_group_id: null,
      chat_group_id: null,
      voting_group_id: null,
      admin_group_id: null,
      admin_drop_deletion_enabled: false,
      authenticated_user_admin: false,
      forbid_negative_votes: wave.voting.forbid_negative_votes,
    },
    author: {
      id: connectedProfile.id,
      handle: connectedProfile.handle,
      active_main_stage_submission_ids:
        connectedProfile.active_main_stage_submission_ids,
      winner_main_stage_drop_ids: connectedProfile.winner_main_stage_drop_ids,
      pfp: connectedProfile.pfp,
      banner1_color: getBannerColorValue(connectedProfile.banner1),
      banner2_color: getBannerColorValue(connectedProfile.banner2),
      cic: connectedProfile.cic,
      rep: connectedProfile.rep,
      tdh: connectedProfile.tdh,
      tdh_rate: connectedProfile.tdh_rate,
      xtdh: connectedProfile.xtdh,
      xtdh_rate: connectedProfile.xtdh_rate,
      level: connectedProfile.level,
      subscribed_actions: [],
      archived: false,
      primary_address: connectedProfile.primary_wallet,
      is_wave_creator: connectedProfile.is_wave_creator,
    },
    created_at: Date.now(),
    updated_at: null,
    title: dropRequest.title ?? null,
    parts: dropRequest.parts.map((part, i) => ({
      part_id: i + 1,
      content: part.content ?? null,
      media: part.media.map((media) => ({
        url: media.url,
        mime_type: media.mime_type,
      })),
      quoted_drop: part.quoted_drop
        ? {
            ...part.quoted_drop,
            is_deleted: false,
          }
        : null,
      replies_count: 0,
      quotes_count: 0,
    })),
    parts_count: dropRequest.parts.length,
    referenced_nfts: dropRequest.referenced_nfts,
    mentioned_users: dropRequest.mentioned_users,
    mentioned_waves: dropRequest.mentioned_waves ?? [],
    metadata: dropRequest.metadata,
    rating: 0,
    top_raters: [],
    raters_count: 0,
    context_profile_context: null,
    subscribed_actions: [],
    drop_type: dropType,
    rank: null,
    realtime_rating: 0,
    is_signed: false,
    rating_prediction: 0,
    reactions: [],
    boosts: 0,
    hide_link_preview: false,
  };
};

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
  submitDrop,
  privileges,
}) => {
  const { isSafeWallet, address } = useSeizeConnectContext();
  const { send } = useWebSocket();
  const { isApp } = useDeviceInfo();
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  const hasUserToggledOptionsRef = useRef(false);
  const prevWaveIdRef = useRef(wave.id);
  const [isWideContainer, setIsWideContainer] = useState(false);
  const editingDropId = useSelector(selectEditingDropId);
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const { signDrop } = useDropSignature();
  const { isMemesWave, isCurationWave } = useWave(wave);

  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [userShowOptions, setUserShowOptions] = useState(false);
  const closeOnNextInputRef = useRef(false);
  const isWaveChanged = prevWaveIdRef.current !== wave.id;
  if (isWaveChanged) {
    prevWaveIdRef.current = wave.id;
    hasUserToggledOptionsRef.current = false;
  }
  const showOptions = isWideContainer || (userShowOptions && !isWaveChanged);

  useEffect(() => {
    setUserShowOptions(false);
    closeOnNextInputRef.current = false;
  }, [wave.id]);

  useLayoutEffect(() => {
    const container = actionsContainerRef.current;
    if (!container) return;

    const measureWidth = () => {
      const width = container.getBoundingClientRect().width;
      const isWide = width >= CONTAINER_WIDTH_THRESHOLD;
      setIsWideContainer((prev) => (prev === isWide ? prev : isWide));
    };

    measureWidth();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const width = entry.contentRect.width;
        const isWide = width >= CONTAINER_WIDTH_THRESHOLD;
        setIsWideContainer((prev) => (prev === isWide ? prev : isWide));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const isParticipatory = wave.wave.type !== ApiWaveType.Chat;

  const { metadata, setMetadata, initialMetadata } = useDropMetadata({
    isDropMode,
    requiredMetadata: wave.participation.required_metadata,
  });

  const hasMetadata = useMemo(() => hasMetadataContent(metadata), [metadata]);

  const getMarkdown = useMemo(
    () =>
      editorState
        ? exportDropMarkdown(editorState, [
            ...SAFE_MARKDOWN_TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
            WAVE_MENTION_TRANSFORMER,
            IMAGE_TRANSFORMER,
            EMOJI_TRANSFORMER,
          ])
        : null,
    [editorState]
  );

  const isCurationDropMode = isCurationWave && isDropMode;
  const isStormModeActive = isStormMode && !isCurationDropMode;

  const curationDropInputValidation = useMemo(() => {
    if (!isCurationDropMode) {
      return null;
    }

    const input = getMarkdown?.trim() ?? "";
    if (!input.length) {
      return null;
    }

    return validateCurationDropInput(input);
  }, [getMarkdown, isCurationDropMode]);

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

  const getCanSubmit = () => {
    const dropParts = isCurationDropMode ? [] : (drop?.parts ?? []);

    if (isCurationDropMode) {
      return (
        (getMarkdown?.trim().length ?? 0) > 0 && !curationDropInputValidation
      );
    }

    return (
      hasSubmissionContent({
        markdown: getMarkdown,
        files,
        parts: dropParts,
        hasMetadata,
      }) && !!(dropParts.length ? getCanSubmitStorm() : true)
    );
  };

  const getHaveMarkdownOrFile = () =>
    !!getMarkdown || (!isCurationDropMode && files.length > 0);

  const getIsDropLimit = () =>
    (drop?.parts.reduce(
      (acc, part) => acc + (part.content?.length ?? 0),
      getMarkdown?.length ?? 0
    ) ?? 0) >= 24000;

  const getCanAddPart = () => {
    if (isCurationDropMode) {
      return false;
    }
    return getHaveMarkdownOrFile() && !getIsDropLimit();
  };
  const canSubmit = getCanSubmit();
  const canAddPart = getCanAddPart();

  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);

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
  const isInitialMountRef = useRef(true);

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
      return {
        title: null,
        ...replyToObj,
        parts: ensurePartsWithFallback(baseParts, hasMetadata),
        mentioned_users: drop?.mentioned_users ?? [],
        mentioned_waves: drop?.mentioned_waves ?? [],
        referenced_nfts: drop?.referenced_nfts ?? [],
        metadata: convertMetadataToDropMetadata(metadata),
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
    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      ...replyToObj,
      parts: [
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
          media: isCurationDropMode ? [] : files,
        },
      ],
      mentioned_users: [],
      mentioned_waves: [],
      referenced_nfts: [],
      metadata: [],
      signature: null,
      is_safe_signature: isSafeWallet,
      signer_address: address ?? "",
    };
  };

  const createCurrentDrop = (
    markdown: string | null,
    allMentions: ApiDropMentionedUser[],
    allNfts: ReferencedNft[],
    allWaves: ApiMentionedWave[]
  ): CreateDropConfig => {
    const availableFiles = isCurationDropMode ? [] : files;
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
            },
          ];

    const newParts = isCurationDropMode
      ? [
          {
            content: markdown ?? null,
            quoted_drop: quotedDrop,
            media: [],
          },
        ]
      : nonCurationParts;

    const parts = isCurationDropMode
      ? newParts
      : ensurePartsWithFallback(newParts, hasMetadata);
    const replyTo = getReplyTo();
    const replyToObj = replyTo ? { reply_to: replyTo } : {};
    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      ...replyToObj,
      parts,
      mentioned_users: allMentions,
      mentioned_waves: allWaves,
      referenced_nfts: allNfts,
      metadata: isCurationDropMode
        ? []
        : convertMetadataToDropMetadata(metadata),
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
    const existingMentions = isCurationDropMode
      ? []
      : (drop?.mentioned_users ?? []);
    const existingNfts = isCurationDropMode
      ? []
      : (drop?.referenced_nfts ?? []);
    const existingWaves = isCurationDropMode
      ? []
      : (drop?.mentioned_waves ?? []);
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
      updatedWaves
    );
  };

  const updateDropStateAndClearInput = (newDrop: CreateDropConfig) => {
    setDrop(newDrop);
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

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const refreshState = () => {
    createDropInputRef.current?.clearEditorState();
    setEditorState(null);
    setMetadata(initialMetadata);
    setMentionedUsers([]);
    setMentionedWaves([]);
    setReferencedNfts([]);
    setDrop(null);
    setUserShowOptions(false);
    closeOnNextInputRef.current = false;
    setDropEditorRefreshKey((prev) => prev + 1);
  };

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

    if (isCurationDropMode) {
      const hasTooManyParts = dropRequest.parts.length !== 1;
      const hasMedia = dropRequest.parts.some((part) => part.media.length > 0);
      const curationText = dropRequest.parts[0]?.content?.trim() ?? "";
      const curationValidation = validateCurationDropInput(curationText);

      if (hasTooManyParts || hasMedia || curationValidation) {
        setToast({
          message:
            curationValidation?.helperText ??
            "Curation drops only support one HTTPS URL and no media.",
          type: "error",
        });
        return;
      }
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
      const parts = await generateParts(dropRequest.parts, setUploadingFiles);
      if (!parts.length) {
        setSubmitting(false);
        return;
      }

      if (
        isCurationDropMode &&
        (parts.length !== 1 || parts.some((part) => part.media.length > 0))
      ) {
        setToast({
          message: "Curation drops only support one HTTPS URL and no media.",
          type: "error",
        });
        setSubmitting(false);
        return;
      }

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
        metadata: isCurationDropMode ? [] : dropRequest.metadata,
        wave_id: wave.id,
        parts,
      };

      const updatedDropRequest = await getUpdatedDropRequest(requestBody);
      if (!updatedDropRequest) {
        setSubmitting(false);
        return;
      }

      const optimisticDrop = getOptimisticDrop(
        updatedDropRequest,
        connectedProfile,
        wave,
        activeDrop,
        isDropMode ? ApiDropType.Participatory : ApiDropType.Chat
      );

      if (optimisticDrop) {
        addOptimisticDrop({ drop: optimisticDrop });
        setTimeout(
          () =>
            processIncomingDrop(
              optimisticDrop,
              ProcessIncomingDropType.DROP_INSERT
            ),
          0
        );
      }
      !!getMarkdown?.length && createDropInputRef.current?.clearEditorState();
      (document.activeElement as HTMLElement).blur();
      if (isApp) {
        import("@capacitor/core").then(({ Capacitor }) => {
          if (Capacitor.getPlatform() === "android") {
            import("@capacitor/keyboard").then(({ Keyboard }) => {
              Keyboard.hide().catch(() => {});
            });
          }
        });
      }
      setFiles([]);
      refreshState();

      submitDrop({
        drop: updatedDropRequest,
        dropId: optimisticDrop?.id ?? null,
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMissingRequirementsResult = useMemo(() => {
    return () =>
      getMissingRequirements(
        isDropMode,
        metadata,
        files,
        wave.participation.required_media
      );
  }, [metadata, files, wave.participation.required_media, isDropMode]);

  const [missingRequirements, setMissingRequirements] =
    useState<MissingRequirements>({
      metadata: [],
      media: [],
    });

  useEffect(() => {
    setMissingRequirements(getMissingRequirementsResult());
  }, [metadata, files, getMissingRequirementsResult]);

  const onDrop = async (): Promise<void> => {
    if (submitting) {
      return;
    }

    if (isCurationDropMode) {
      if ((getMarkdown?.trim().length ?? 0) === 0) {
        return;
      }
      if (curationDropInputValidation) {
        return;
      }
      await prepareAndSubmitDrop(getUpdatedDrop());
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
    if (isCurationDropMode) {
      setToast({
        message: "GIFs are disabled for curation drops.",
        type: "error",
      });
      return;
    }
    await prepareAndSubmitDrop(createGifDrop(gif));
  };

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
    if (isCurationDropMode) {
      if (newFiles.length) {
        setToast({
          message: "File uploads are disabled for curation drops.",
          type: "error",
        });
      }
      return;
    }

    let updatedFiles = [...files, ...newFiles];
    let removedCount = 0;

    if (updatedFiles.length > MAX_DROP_UPLOAD_FILES) {
      removedCount = updatedFiles.length - MAX_DROP_UPLOAD_FILES;
      updatedFiles = updatedFiles.slice(-MAX_DROP_UPLOAD_FILES);

      setToast({
        message: `File limit exceeded. The ${removedCount} oldest file${
          removedCount > 1 ? "s were" : " was"
        } removed to maintain the ${MAX_DROP_UPLOAD_FILES}-file limit. New files have been added.`,
        type: "warning",
      });
    }

    setFiles(updatedFiles);
    if (!isWideContainer) {
      setUserShowOptions(false);
      closeOnNextInputRef.current = false;
    }
  };

  const handleSetShowOptions = useCallback(
    (next: boolean) => {
      hasUserToggledOptionsRef.current = true;
      setUserShowOptions(next);
      if (isWideContainer) {
        closeOnNextInputRef.current = false;
        return;
      }
      closeOnNextInputRef.current = next;
    },
    [isWideContainer]
  );

  const handleEditorStateChange = useCallback(
    (newEditorState: EditorState) => {
      setEditorState(newEditorState);
      if (!isWideContainer && closeOnNextInputRef.current) {
        setUserShowOptions(false);
        closeOnNextInputRef.current = false;
      }
    },
    [isWideContainer]
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
      setUserShowOptions(false);
      closeOnNextInputRef.current = false;
    },
    [isWideContainer]
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

  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  const onAddMetadataClick = () => {
    setIsMetadataOpen(true);
  };

  const closeMetadata = () => {
    setIsMetadataOpen(false);
  };

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
    if (isCurationDropMode) {
      return;
    }
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

  return (
    <div className="tw-flex-grow">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        submitting={submitting}
        onCancelReplyQuote={onCancelReplyQuote}
        dropId={dropId}
      />
      <div className="tw-flex tw-w-full tw-items-end">
        <div
          ref={actionsContainerRef}
          className="tw-flex tw-w-full tw-items-center tw-gap-x-2 lg:tw-gap-x-3"
        >
          {!isCurationDropMode && (
            <CreateDropActions
              isStormMode={isStormModeActive}
              canAddPart={canAddPart}
              submitting={submitting}
              showOptions={showOptions}
              animateOptions={
                !isWideContainer &&
                hasUserToggledOptionsRef.current &&
                !isWaveChanged
              }
              isRequiredMetadataMissing={!!missingRequirements.metadata.length}
              isRequiredMediaMissing={!!missingRequirements.media.length}
              handleFileChange={handleFileChange}
              onAddMetadataClick={onAddMetadataClick}
              breakIntoStorm={breakIntoStorm}
              setShowOptions={handleSetShowOptions}
              onGifDrop={onGifDrop}
            />
          )}
          <div className="tw-w-full tw-flex-grow">
            <CreateDropInput
              waveId={wave.id}
              key={dropEditorRefreshKey}
              ref={createDropInputRef}
              editorState={editorState}
              type={activeDrop?.action ?? null}
              submitting={submitting}
              isStormMode={isStormModeActive}
              isDropMode={isDropMode}
              canSubmit={canSubmit}
              onEditorState={handleEditorStateChange}
              onEditorBlur={handleEditorBlur}
              onReferencedNft={onReferencedNft}
              onMentionedUser={onMentionedUser}
              onMentionedWave={onMentionedWave}
              onDrop={onDrop}
              hasValidationError={!!curationDropInputValidation}
              validationHelperText={curationDropInputValidation?.helperText}
            />
          </div>
        </div>
        <div className="tw-ml-2 lg:tw-ml-3">
          <div className="tw-flex tw-items-center tw-gap-x-3">
            {isParticipatory && !dropId && !isMemesWave && (
              <CreateDropDropModeToggle
                isDropMode={isDropMode}
                onDropModeChange={onDropModeChange}
                privileges={privileges}
              />
            )}
            <CreateDropSubmit
              submitting={submitting}
              canSubmit={canSubmit}
              onDrop={onDrop}
              isDropMode={isDropMode}
            />
          </div>
        </div>
      </div>
      {isDropMode && !isCurationDropMode && (
        <CreateDropContentRequirements
          canSubmit={canSubmit}
          wave={wave}
          missingMedia={missingRequirements.media}
          missingMetadata={missingRequirements.metadata}
          onOpenMetadata={() => setIsMetadataOpen(true)}
          setFiles={handleFileChange}
          disabled={submitting}
        />
      )}
      <AnimatePresence>
        {!isCurationDropMode && isMetadataOpen && (
          <motion.div
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
              onChangeKey={onChangeKey}
              onChangeValue={onChangeValue}
              onAddMetadata={onAddMetadata}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {!isCurationDropMode && (
        <CreateDropContentFiles
          parts={drop?.parts ?? []}
          files={files}
          uploadingFiles={uploadingFiles}
          removeFile={removeFile}
          disabled={submitting}
        />
      )}
      <TermsSignatureFlow />
    </div>
  );
};

export default memo(CreateDropContent);
