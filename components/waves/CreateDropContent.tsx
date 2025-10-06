"use client";

import dynamic from "next/dynamic";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import CreateDropInput, { CreateDropInputHandles } from "./CreateDropInput";
import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useSelector } from "react-redux";
import { selectEditingDropId } from "@/store/editSlice";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "@/entities/IDrop";
import { $convertToMarkdownString } from "@lexical/markdown";
import { MENTION_TRANSFORMER } from "../drops/create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../drops/create/lexical/transformers/ImageTransformer";
import { AuthContext } from "../auth/Auth";
import { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { getOptimisticDropId } from "@/helpers/waves/drop.helpers";
import { ReactQueryWrapperContext } from "../react-query-wrapper/ReactQueryWrapper";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropMetadata from "./CreateDropMetadata";
import { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import CreateDropContentRequirements from "./CreateDropContentRequirements";
import { CreateDropContentFiles } from "./CreateDropContentFiles";
import CreateDropActions from "./CreateDropActions";
import { createBreakpoint } from "react-use";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  ActiveDropAction,
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import { CreateDropDropModeToggle } from "./CreateDropDropModeToggle";
import { CreateDropSubmit } from "./CreateDropSubmit";
import { DropPrivileges } from "@/hooks/useDropPriviledges";
import { SAFE_MARKDOWN_TRANSFORMERS } from "@/components/drops/create/lexical/transformers/markdownTransformers";

import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useDropMetadata, generateMetadataId } from "./hooks/useDropMetadata";
import {
  getMissingRequirements,
  MissingRequirements,
} from "./utils/getMissingRequirements";
import { EMOJI_TRANSFORMER } from "../drops/create/lexical/transformers/EmojiTransformer";
import { useDropSignature } from "@/hooks/drops/useDropSignature";
import { useWave } from "@/hooks/useWave";
import { multiPartUpload } from "./create-wave/services/multiPartUpload";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { DropMutationBody } from "./CreateDrop";
import { ProcessIncomingDropType } from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import throttle from "lodash/throttle";
import { useWebSocket } from "@/services/websocket";
import { WsMessageType } from "@/helpers/Types";
import { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { MAX_DROP_UPLOAD_FILES } from "@/helpers/Helpers";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

// Use next/dynamic for lazy loading with SSR support
const TermsSignatureFlow = dynamic(() => import("../terms/TermsSignatureFlow"));

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

const useBreakpoint = createBreakpoint({ MD: 640, S: 0 });

const isMetadataValuePresent = (value: string | number | null): boolean => {
  if (value === null || value === undefined) {
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
  return referencedNfts.filter((nft) => markdown?.includes(`#[${nft.name}]`));
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

const convertMetadataToDropMetadata = (
  metadata: CreateDropMetadataType[]
): DropMetadata[] => {
  return metadata
    .filter(
      (
        md
      ): md is CreateDropMetadataType & {
        key: NonNullable<CreateDropMetadataType["key"]>;
        value: NonNullable<CreateDropMetadataType["value"]>;
      } =>
        md.key !== null &&
        md.key !== undefined &&
        md.value !== null &&
        md.value !== undefined
    )
    .map((md) => ({
      data_key: md.key,
      data_value: `${md.value}`,
    }));
};

type HandleDropPartResult = {
  updatedMentions: ApiDropMentionedUser[];
  updatedNfts: ReferencedNft[];
  updatedMarkdown: string;
};

const handleDropPart = (
  markdown: string | null,
  existingMentions: ApiDropMentionedUser[],
  existingNfts: ReferencedNft[],
  mentionedUsers: Omit<MentionedUser, "current_handle">[],
  referencedNfts: ReferencedNft[]
): HandleDropPartResult => {
  const partMentions = getPartMentions(markdown, mentionedUsers);
  const updatedMentions = getUpdatedMentions(partMentions, existingMentions);

  const partNfts = getPartNfts(markdown, referencedNfts);
  const updatedNfts = getUpdatedNfts(partNfts, existingNfts);

  const updatedMarkdown = markdown ?? "";

  return {
    updatedMentions,
    updatedNfts,
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
  const uploadResponse = await multiPartUpload({
    file: media,
    path: "drop",
    onProgress: (progress) =>
      setUploadingFiles((prev) =>
        prev.map((uf) => (uf.file === media ? { ...uf, progress } : uf))
      ),
  }).finally(() => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));
  });
  return uploadResponse;
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
    throw new Error(`Error generating parts: ${(error as Error).message}`);
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
      period?: { min: number | null; max: number | null };
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

  return {
    id: getOptimisticDropId(),
    serial_no: Date.now(),
    reply_to: getReplyTo(),
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
      active_main_stage_submission_ids: connectedProfile.active_main_stage_submission_ids,
      winner_main_stage_drop_ids: connectedProfile.winner_main_stage_drop_ids ?? [],
      pfp: connectedProfile.pfp ?? null,
      banner1_color: connectedProfile.banner1 ?? null,
      banner2_color: connectedProfile.banner2 ?? null,
      cic: connectedProfile.cic,
      rep: connectedProfile.rep,
      tdh: connectedProfile.tdh,
      tdh_rate: connectedProfile.tdh_rate,
      level: connectedProfile.level,
      subscribed_actions: [],
      archived: false,
      primary_address: connectedProfile.primary_wallet ?? null,
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
  const breakpoint = useBreakpoint();
  const { isApp } = useDeviceInfo();
  const editingDropId = useSelector(selectEditingDropId);
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);
  const { processIncomingDrop } = useMyStream();
  const { signDrop } = useDropSignature();
  const { isMemesWave } = useWave(wave);

  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showOptions, setShowOptions] = useState(breakpoint === "MD");
  useEffect(() => setShowOptions(breakpoint === "MD"), [breakpoint]);

  const isParticipatory = wave.wave.type !== ApiWaveType.Chat;

  const { metadata, setMetadata, initialMetadata } = useDropMetadata({
    isDropMode,
    requiredMetadata: wave.participation.required_metadata,
  });

  const hasMetadata = useMemo(
    () => hasMetadataContent(metadata),
    [metadata]
  );

  const getMarkdown = useMemo(
    () =>
      editorState?.read(() =>
        $convertToMarkdownString([
          ...SAFE_MARKDOWN_TRANSFORMERS,
          MENTION_TRANSFORMER,
          HASHTAG_TRANSFORMER,
          IMAGE_TRANSFORMER,
          EMOJI_TRANSFORMER,
        ])
      ) ?? null,
    [editorState]
  );

  const throttleHandle = useMemo(() => {
    return throttle(() => {
      send(WsMessageType.USER_IS_TYPING, { wave_id: wave.id });
    }, 4000);
  }, []);

  useEffect(() => {
    if (getMarkdown?.length) {
      throttleHandle();
    }
  }, [getMarkdown]);

  const getCanSubmitStorm = () => {
    const markdown = getMarkdown;
    if (markdown?.length && markdown.length > 240) {
      return false;
    }
    return true;
  };

  const getCanSubmit = () => {
    const dropParts = drop?.parts ?? [];

    return (
      hasSubmissionContent({
        markdown: getMarkdown,
        files,
        parts: dropParts,
        hasMetadata,
      }) && !!(dropParts.length ? getCanSubmitStorm() : true)
    );
  };

  const getHaveMarkdownOrFile = () => !!getMarkdown || !!files.length;

  const getIsDropLimit = () =>
    (drop?.parts.reduce(
      (acc, part) => acc + (part.content?.length ?? 0),
      getMarkdown?.length ?? 0
    ) ?? 0) >= 24000;

  const getCanAddPart = () => getHaveMarkdownOrFile() && !getIsDropLimit();
  const canSubmit = useMemo(() => getCanSubmit(), [getMarkdown, files, drop, hasMetadata]);
  const canAddPart = useMemo(() => getCanAddPart(), [getMarkdown, files, drop]);

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

  const createDropInputRef = useRef<CreateDropInputHandles | null>(null);

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
    if (!markdown?.length && !files.length) {
      const baseParts = drop?.parts.length ? drop.parts : [];
      return {
        title: null,
        reply_to: getReplyTo(),
        parts: ensurePartsWithFallback(baseParts, hasMetadata),
        mentioned_users: drop?.mentioned_users ?? [],
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

  const createGifDrop = (gif: string): CreateDropConfig => {
    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      reply_to: getReplyTo(),
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
          media: files,
        },
      ],
      mentioned_users: [],
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
    allNfts: ReferencedNft[]
  ): CreateDropConfig => {
    const parts = ensurePartsWithFallback(
      [
        ...(drop?.parts ?? []),
        {
          content: markdown?.length ? markdown : null,
          quoted_drop:
            activeDrop?.action === ActiveDropAction.QUOTE
              ? {
                drop_id: activeDrop.drop.id,
                drop_part_id: activeDrop.partId,
              }
              : null,
          media: files,
        },
      ],
      hasMetadata
    );

    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      reply_to: getReplyTo(),
      parts,
      mentioned_users: allMentions,
      referenced_nfts: allNfts,
      metadata: convertMetadataToDropMetadata(metadata),
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
    const { updatedMentions, updatedNfts, updatedMarkdown } = handleDropPart(
      markdown,
      drop?.mentioned_users ?? [],
      drop?.referenced_nfts ?? [],
      mentionedUsers,
      referencedNfts
    );

    return createCurrentDrop(updatedMarkdown, updatedMentions, updatedNfts);
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

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const refreshState = () => {
    createDropInputRef.current?.clearEditorState();
    setEditorState(null);
    setMetadata(initialMetadata);
    setMentionedUsers([]);
    setReferencedNfts([]);
    setDrop(null);
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
        signature?: string;
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

      const requestBody: ApiCreateDropRequest = {
        ...dropRequest,
        mentioned_users: filterMentionedUsers({
          mentionedUsers: dropRequest.mentioned_users,
          parts: dropRequest.parts,
        }),
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
      (document.activeElement as HTMLElement)?.blur();
      if (isApp) {
        import("@capacitor/core").then(({ Capacitor }) => {
          if (Capacitor.getPlatform() === "android") {
            import("@capacitor/keyboard").then(({ Keyboard }) => {
              Keyboard.hide().catch(() => { });
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
    if (
      missingRequirements.metadata.length ||
      missingRequirements.media.length
    ) {
      return;
    }
    await prepareAndSubmitDrop(getUpdatedDrop());
  };

  const onGifDrop = async (gif: string): Promise<void> => {
    if (submitting) {
      return;
    }
    await prepareAndSubmitDrop(createGifDrop(gif));
  };

  const focusInputWithDelay = (delay: number) => {
    setTimeout(() => {
      createDropInputRef.current?.focus();
    }, delay);
  };

  useEffect(() => {
    if (!activeDrop) {
      return;
    }

    if (isApp) {
      // Mobile app: Complex focus handling to prevent keyboard issues
      const focusInput = () => {
        if (!createDropInputRef.current) return;

        // Use requestAnimationFrame to wait for next paint
        requestAnimationFrame(() => {
          // Then focus after a delay for mobile stability
          focusInputWithDelay(300);
        });
      };

      const timer = setTimeout(focusInput, 200);
      return () => clearTimeout(timer);
    } else {
      // Desktop/web: Keep original simple behavior
      const timer = setTimeout(() => {
        createDropInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeDrop, isApp]);

  const handleFileChange = (newFiles: File[]) => {
    let updatedFiles = [...files, ...newFiles];
    let removedCount = 0;

    if (updatedFiles.length > MAX_DROP_UPLOAD_FILES) {
      removedCount = updatedFiles.length - MAX_DROP_UPLOAD_FILES;
      updatedFiles = updatedFiles.slice(-MAX_DROP_UPLOAD_FILES);

      setToast({
        message: `File limit exceeded. The ${removedCount} oldest file${removedCount > 1 ? "s were" : " was"
          } removed to maintain the ${MAX_DROP_UPLOAD_FILES}-file limit. New files have been added.`,
        type: "warning",
      });
    }

    setFiles(updatedFiles);
  };

  const handleEditorStateChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    if (breakpoint === "S") {
      setShowOptions(false);
    }
  };

  const removeFile = (file: File, partIndex?: number) => {
    if (partIndex !== undefined) {
      // Remove file from a specific part
      setDrop((prevDrop) => {
        if (!prevDrop) return null;
        const newParts = [...prevDrop.parts];
        newParts[partIndex] = {
          ...newParts[partIndex],
          media: newParts[partIndex].media.filter((f) => f !== file),
        };
        return { ...prevDrop, parts: newParts };
      });
    } else {
      // Remove file from the current files array
      setFiles((prevFiles) => prevFiles.filter((f) => f !== file));
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
  }, [drop?.parts]);

  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  const onAddMetadataClick = () => {
    setIsMetadataOpen(true);
  };

  const closeMetadata = () => {
    setIsMetadataOpen(false);
  };

  const onChangeKey = (params: { index: number; newKey: string }) => {
    setMetadata((prev) => {
      const newMetadata = [...prev];
      newMetadata[params.index].key = params.newKey;
      return newMetadata;
    });
  };

  const onChangeValue = (params: {
    index: number;
    newValue: string | number | null;
  }) => {
    setMetadata((prev) => {
      const newMetadata = [...prev];
      newMetadata[params.index].value = params.newValue;
      return newMetadata;
    });
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

  return (
    <div className="tw-flex-grow">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        submitting={submitting}
        onCancelReplyQuote={onCancelReplyQuote}
        dropId={dropId}
      />
      <div className="tw-flex tw-items-end tw-w-full">
        <div className="tw-w-full tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
          <CreateDropActions
            isStormMode={isStormMode}
            canAddPart={canAddPart}
            submitting={submitting}
            showOptions={showOptions}
            isRequiredMetadataMissing={!!missingRequirements.metadata.length}
            isRequiredMediaMissing={!!missingRequirements.media.length}
            handleFileChange={handleFileChange}
            onAddMetadataClick={onAddMetadataClick}
            breakIntoStorm={breakIntoStorm}
            setShowOptions={setShowOptions}
            onGifDrop={onGifDrop}
          />
          <div className="tw-flex-grow tw-w-full">
            <CreateDropInput
              waveId={wave.id}
              key={dropEditorRefreshKey}
              ref={createDropInputRef}
              editorState={editorState}
              type={activeDrop?.action ?? null}
              submitting={submitting}
              isStormMode={isStormMode}
              isDropMode={isDropMode}
              canSubmit={canSubmit}
              onEditorState={handleEditorStateChange}
              onReferencedNft={onReferencedNft}
              onMentionedUser={onMentionedUser}
              onDrop={onDrop}
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
      {isDropMode && (
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
        {isMetadataOpen && (
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
      <CreateDropContentFiles
        parts={drop?.parts ?? []}
        files={files}
        uploadingFiles={uploadingFiles}
        removeFile={removeFile}
        disabled={submitting}
      />

      {/* Terms of Service Flow - Modal will render when needed */}
      <React.Suspense fallback={<div>Loading Terms...</div>}>
        <TermsSignatureFlow />
      </React.Suspense>
    </div>
  );
};

export default memo(CreateDropContent);

// Export internal helpers for testing
export {
  handleDropPart,
  convertMetadataToDropMetadata,
  hasMetadataContent,
  hasSubmissionContent,
  ensurePartsWithFallback,
};
