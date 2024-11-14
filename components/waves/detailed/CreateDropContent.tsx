import PrimaryButton from "../../utils/button/PrimaryButton";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import CreateDropInput, { CreateDropInputHandles } from "./CreateDropInput";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  DropMedia,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { MENTION_TRANSFORMER } from "../../drops/create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../../drops/create/lexical/transformers/ImageTransformer";
import { AuthContext } from "../../auth/Auth";
import { commonApiPost } from "../../../services/api/common-api";
import { ApiCreateDropRequest } from "../../../generated/models/ApiCreateDropRequest";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { getOptimisticDropId } from "../../../helpers/waves/drop.helpers";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropMetadata from "./CreateDropMetadata";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveMetadataType } from "../../../generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "../../../generated/models/ApiWaveParticipationRequirement";
import CreateDropContentRequirements from "./CreateDropContentRequirements";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { CreateDropContentFiles } from "./CreateDropContentFiles";
import CreateDropActions from "./CreateDropActions";
import { createBreakpoint } from "react-use";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { ApiDropType } from "../../../generated/models/ApiDropType";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { ActiveDropAction, ActiveDropState } from "./chat/WaveChat";

export type CreateDropMetadataType =
  | {
      key: string;
      readonly type: ApiWaveMetadataType.String;
      value: string | null;
      readonly required: boolean;
    }
  | {
      key: string;
      readonly type: ApiWaveMetadataType.Number;
      value: number | null;
      readonly required: boolean;
    }
  | {
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
  readonly submitDrop: (dropRequest: ApiCreateDropRequest) => void;
}

interface MissingRequirements {
  metadata: string[];
  media: ApiWaveParticipationRequirement[];
}

const useBreakpoint = createBreakpoint({ MD: 640, S: 0 });

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

const uploadFileWithProgress = (
  url: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void
): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(
          new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
          })
        );
      } else {
        reject(new Error(`HTTP error! status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    xhr.send(file);
  });
};

const generateMediaForPart = async (
  media: File,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>
): Promise<DropMedia> => {
  try {
    setUploadingFiles((prev) => [
      ...prev,
      { file: media, isUploading: true, progress: 0 },
    ]);

    const prep = await commonApiPost<
      {
        content_type: string;
        file_name: string;
        file_size: number;
      },
      {
        upload_url: string;
        content_type: string;
        media_url: string;
      }
    >({
      endpoint: "drop-media/prep",
      body: {
        content_type: media.type,
        file_name: media.name,
        file_size: media.size,
      },
    });

    const response = await uploadFileWithProgress(
      prep.upload_url,
      media,
      prep.content_type,
      (progress) => {
        setUploadingFiles((prev) =>
          prev.map((uf) => (uf.file === media ? { ...uf, progress } : uf))
        );
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));

    return {
      url: prep.media_url,
      mime_type: prep.content_type,
    };
  } catch (error) {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== media));
    throw new Error(
      `Error uploading ${media.name}: ${(error as Error).message}`
    );
  }
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
  connectedProfile: IProfileAndConsolidations | null,
  wave: {
    id: string;
    name: string;
    picture: string | null;
    description_drop: { id: string };
    participation: { authenticated_user_eligible: boolean };
    voting: { authenticated_user_eligible: boolean };
    chat: { authenticated_user_eligible: boolean };
  },
  activeDrop: ActiveDropState | null,
  dropType: ApiDropType
): ApiDrop | null => {
  if (!connectedProfile?.profile) {
    return null;
  }

  const getReplyTo = () => {
    if (activeDrop?.action === ActiveDropAction.REPLY) {
      return {
        drop_id: activeDrop.drop.id,
        drop_part_id: activeDrop.partId,
        is_deleted: false,
      };
    }
    return undefined;
  };

  return {
    id: getOptimisticDropId(),
    serial_no: 1,
    reply_to: getReplyTo(),
    wave: {
      id: wave.id,
      name: wave.name,
      picture: wave.picture ?? "",
      description_drop_id: wave.description_drop.id,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
    },
    author: {
      id: connectedProfile.profile.external_id,
      handle: connectedProfile.profile.handle,
      pfp: connectedProfile.profile.pfp_url ?? null,
      banner1_color: connectedProfile.profile.banner_1 ?? null,
      banner2_color: connectedProfile.profile.banner_2 ?? null,
      cic: connectedProfile.cic.cic_rating,
      rep: connectedProfile.rep,
      tdh: connectedProfile.consolidation.tdh,
      level: connectedProfile.level,
      subscribed_actions: [],
      archived: false,
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
}) => {
  const breakpoint = useBreakpoint();
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop } = useContext(ReactQueryWrapperContext);

  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showOptions, setShowOptions] = useState(breakpoint === "MD");
  useEffect(() => setShowOptions(breakpoint === "MD"), [breakpoint]);

  const isParticipatory = wave.wave.type !== ApiWaveType.Chat;

  const getMarkdown = useMemo(
    () =>
      editorState?.read(() =>
        $convertToMarkdownString([
          ...TRANSFORMERS,
          MENTION_TRANSFORMER,
          HASHTAG_TRANSFORMER,
          IMAGE_TRANSFORMER,
        ])
      ) ?? null,
    [editorState]
  );

  const getCanSubmitStorm = () => {
    const markdown = getMarkdown;
    if (markdown?.length && markdown.length > 240) {
      return false;
    }
    return true;
  };

  const getCanSubmit = () =>
    !!(!!getMarkdown || !!files.length || !!drop?.parts.length) &&
    !!(drop?.parts.length ? getCanSubmitStorm() : true);

  const getHaveMarkdownOrFile = () => !!getMarkdown || !!files.length;

  const getIsDropLimit = () =>
    (drop?.parts.reduce(
      (acc, part) => acc + (part.content?.length ?? 0),
      getMarkdown?.length ?? 0
    ) ?? 0) >= 24000;

  const getCanAddPart = () => getHaveMarkdownOrFile() && !getIsDropLimit();
  const canSubmit = useMemo(() => getCanSubmit(), [getMarkdown, files, drop]);
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

  const initialMetadata = useMemo(() => {
    return wave.participation.required_metadata.map((md) => ({
      key: md.name,
      type: md.type,
      value: null,
      required: true,
    }));
  }, [wave.participation.required_metadata]);

  const [metadata, setMetadata] =
    useState<CreateDropMetadataType[]>(initialMetadata);

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
      return {
        title: null,
        reply_to: getReplyTo(),
        parts: drop?.parts.length ? drop.parts : [],
        mentioned_users: drop?.mentioned_users ?? [],
        referenced_nfts: drop?.referenced_nfts ?? [],
        metadata: convertMetadataToDropMetadata(metadata),
        drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      };
    }
    return null;
  };

  const createCurrentDrop = (
    markdown: string | null,
    allMentions: ApiDropMentionedUser[],
    allNfts: ReferencedNft[]
  ): CreateDropConfig => {
    return {
      title: null,
      drop_type: isDropMode ? ApiDropType.Participatory : ApiDropType.Chat,
      reply_to: getReplyTo(),
      parts: [
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
      mentioned_users: allMentions,
      referenced_nfts: allNfts,
      metadata: convertMetadataToDropMetadata(metadata),
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
      const optimisticDrop = getOptimisticDrop(
        requestBody,
        connectedProfile,
        wave,
        activeDrop,
        isDropMode ? ApiDropType.Participatory : ApiDropType.Chat
      );
      if (optimisticDrop) {
        addOptimisticDrop({ drop: optimisticDrop });
      }
      !!getMarkdown?.length && createDropInputRef.current?.clearEditorState();
      setFiles([]);
      refreshState();
      submitDrop(requestBody);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isRequiredMetadataMissing = (item: CreateDropMetadataType): boolean => {
    return (
      item.required &&
      (item.value === null || item.value === undefined || item.value === "")
    );
  };

  const isMediaTypeMatching = (
    file: File,
    mediaType: ApiWaveParticipationRequirement
  ): boolean => {
    switch (mediaType) {
      case ApiWaveParticipationRequirement.Image:
        return file.type.startsWith("image/");
      case ApiWaveParticipationRequirement.Audio:
        return file.type.startsWith("audio/");
      case ApiWaveParticipationRequirement.Video:
        return file.type.startsWith("video/");
      default:
        return false;
    }
  };

  const getMissingRequirements = useMemo(() => {
    const getMissingMetadata = () =>
      metadata
        .filter(isRequiredMetadataMissing)
        .map((item) => item.key as string);

    const getMissingMedia = () =>
      wave.participation.required_media.filter(
        (media) => !files.some((file) => isMediaTypeMatching(file, media))
      );

    return (): MissingRequirements => ({
      metadata: getMissingMetadata(),
      media: getMissingMedia(),
    });
  }, [metadata, files, wave.participation.required_media]);

  const [missingRequirements, setMissingRequirements] =
    useState<MissingRequirements>({
      metadata: [],
      media: [],
    });

  useEffect(() => {
    setMissingRequirements(getMissingRequirements());
  }, [metadata, files, getMissingRequirements]);

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

  useEffect(() => {
    if (!activeDrop) {
      return;
    }
    const timer = setTimeout(() => {
      createDropInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeDrop]);

  const handleFileChange = (newFiles: File[]) => {
    let updatedFiles = [...files, ...newFiles];
    let removedCount = 0;

    if (updatedFiles.length > 4) {
      removedCount = updatedFiles.length - 4;
      updatedFiles = updatedFiles.slice(-4);

      setToast({
        message: `File limit exceeded. The ${removedCount} oldest file${
          removedCount > 1 ? "s were" : " was"
        } removed to maintain the 4-file limit. New files have been added.`,
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
          />
          <div className="tw-flex-grow tw-w-full">
            <CreateDropInput
              key={dropEditorRefreshKey}
              ref={createDropInputRef}
              editorState={editorState}
              type={activeDrop?.action ?? null}
              submitting={submitting}
              isStormMode={isStormMode}
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
            {isParticipatory && (
              <Tippy
                content={<span className="tw-text-xs">Drop Mode</span>}
                placement="top">
                <button
                  type="button"
                  onClick={() => onDropModeChange(!isDropMode)}
                  className={`tw-cursor-pointer tw-flex-shrink-0 tw-size-8 tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 tw-transform tw-transition tw-duration-300 tw-ease-in-out active:tw-scale-90 ${
                    isDropMode
                      ? "tw-bg-indigo-600 tw-text-white desktop-hover:hover:tw-bg-indigo-500 active:tw-bg-indigo-700 focus-visible:tw-outline-indigo-500 tw-ring-2 tw-ring-indigo-400/40 tw-ring-offset-1 tw-ring-offset-iron-900"
                      : "tw-bg-iron-800 tw-backdrop-blur-sm tw-text-iron-500 desktop-hover:hover:tw-bg-iron-700 active:tw-bg-iron-700/90 focus-visible:tw-outline-iron-700 tw-ring-1 tw-ring-iron-700/50"
                  }`}>
                  <svg
                    className="tw-size-4 tw-flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8.62826 7.89684C8.62826 7.60735 8.62826 6.72633 7.11906 4.34441C6.41025 3.22565 5.71213 2.3144 5.68274 2.27615L5.12514 1.55005L4.56755 2.27615C4.53816 2.3144 3.84008 3.2257 3.13123 4.34441C1.62207 6.72633 1.62207 7.60735 1.62207 7.89684C1.62207 9.82846 3.19352 11.3999 5.12514 11.3999C7.05676 11.3999 8.62826 9.82846 8.62826 7.89684Z"
                      fill="currentColor"
                    />
                    <path
                      d="M21.2502 2.24459C20.7301 1.42366 20.2173 0.754227 20.1956 0.726104L19.638 0L19.0805 0.726104C19.0589 0.754227 18.546 1.42366 18.0259 2.24459C17.5419 3.00847 16.8984 4.11804 16.8984 4.931C16.8984 6.44166 18.1274 7.67061 19.638 7.67061C21.1487 7.67061 22.3777 6.44161 22.3777 4.931C22.3777 4.11799 21.7342 3.00847 21.2502 2.24459Z"
                      fill="currentColor"
                    />
                    <path
                      d="M13.6806 7.0994L13.1231 6.37329L12.5655 7.0994C12.5083 7.17388 11.1491 8.94805 9.76692 11.1295C7.8616 14.1367 6.89551 16.3717 6.89551 17.7724C6.89551 21.2063 9.68921 24 13.1231 24C16.557 24 19.3506 21.2063 19.3506 17.7724C19.3506 16.3717 18.3845 14.1367 16.4792 11.1295C15.097 8.94805 13.7379 7.17388 13.6806 7.0994Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </Tippy>
            )}
            <PrimaryButton
              onClicked={onDrop}
              loading={submitting}
              disabled={!canSubmit}
              padding="tw-px-2.5 lg:tw-px-3.5 tw-py-2.5">
              <span className="tw-hidden lg:tw-inline">Drop</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-size-5 lg:tw-hidden">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </PrimaryButton>
          </div>
        </div>
      </div>
      <CreateDropContentRequirements
        canSubmit={canSubmit}
        wave={wave}
        missingMedia={missingRequirements.media}
        missingMetadata={missingRequirements.metadata}
        onOpenMetadata={() => setIsMetadataOpen(true)}
        setFiles={handleFileChange}
        disabled={submitting}
      />
      <AnimatePresence>
        {isMetadataOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}>
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
    </div>
  );
};

export default memo(CreateDropContent);
