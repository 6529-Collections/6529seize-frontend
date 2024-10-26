import PrimaryButton from "../../utils/button/PrimaryButton";
import { ActiveDropAction, ActiveDropState } from "./WaveDetailedContent";
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
  activeDrop: ActiveDropState | null;
  onCancelReplyQuote: () => void;
  wave: ApiWave;
  drop: CreateDropConfig | null;
  isStormMode: boolean;
  setDrop: React.Dispatch<React.SetStateAction<CreateDropConfig | null>>;
  setIsStormMode: React.Dispatch<React.SetStateAction<boolean>>;
  submitDrop: (dropRequest: ApiCreateDropRequest) => void;
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
  activeDrop: ActiveDropState | null
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
  };
};

const CreateDropContent: React.FC<CreateDropContentProps> = ({
  activeDrop,
  onCancelReplyQuote,
  wave,
  drop,
  isStormMode,
  setDrop,
  setIsStormMode,
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
        activeDrop
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
            <button
              type="button"
              className="tw-size-9 tw-flex tw-items-center tw-justify-center tw-border-t tw-border-b-0 tw-border-x-0 tw-border-solid tw-border-iron-600 tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 hover:tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 active:tw-text-iron-300 active:tw-bg-iron-700 active:tw-border-iron-700 tw-transform tw-transition-transform tw-duration-300 tw-ease-in-out active:tw-scale-90"
            >
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-transition-colors tw-duration-300 tw-ease-in-out group-active:tw-fill-current"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.12514 11.4002C3.19352 11.4002 1.62207 9.8287 1.62207 7.89708C1.62207 7.6076 1.62207 6.72658 3.13123 4.34465C3.84008 3.2259 4.53816 2.3146 4.56755 2.2764L5.12514 1.55029L5.68274 2.2764C5.71213 2.31464 6.41025 3.2259 7.11906 4.34465C8.62826 6.72658 8.62826 7.6076 8.62826 7.89708C8.62826 9.8287 7.05676 11.4002 5.12514 11.4002ZM5.12514 3.89111C4.12193 5.30934 3.02825 7.14112 3.02825 7.89708C3.02825 9.05329 3.96894 9.99397 5.12514 9.99397C6.2814 9.99397 7.22208 9.05329 7.22208 7.89708C7.22208 7.14117 6.12836 5.30934 5.12514 3.89111Z"
                  fill="currentColor"
                />
                <path
                  d="M19.6382 7.67056C18.1275 7.67056 16.8986 6.44156 16.8986 4.93095C16.8986 4.11799 17.542 3.00843 18.026 2.24454C18.5461 1.42362 19.059 0.75418 19.0806 0.726057L19.6382 0L20.1958 0.726104C20.2173 0.754227 20.7302 1.42366 21.2504 2.24459C21.7344 3.00847 22.3778 4.11804 22.3778 4.931C22.3778 6.44161 21.1488 7.67056 19.6382 7.67056ZM19.6349 2.35151C18.8008 3.55702 18.3047 4.5788 18.3047 4.93095C18.3047 5.66624 18.9029 6.26439 19.6382 6.26439C20.3734 6.26439 20.9716 5.6662 20.9716 4.93095C20.9716 4.84761 20.9278 4.36276 20.0625 2.99718C19.9159 2.76572 19.7689 2.54593 19.6349 2.35151Z"
                  fill="currentColor"
                />
                <path
                  d="M13.1227 24.0002C9.68884 24.0002 6.89514 21.2065 6.89514 17.7726C6.89514 16.3719 7.86123 14.137 9.76656 11.1298C11.1487 8.94825 12.5079 7.17407 12.5651 7.09964L13.1227 6.37354L13.6803 7.09964C13.7375 7.17412 15.0966 8.9483 16.4788 11.1298C18.3841 14.137 19.3502 16.3719 19.3502 17.7726C19.3503 21.2066 16.5566 24.0002 13.1227 24.0002ZM13.1228 8.70146C11.3941 11.0634 8.30132 15.7152 8.30132 17.7726C8.30132 20.4311 10.4642 22.594 13.1227 22.594C15.7813 22.594 17.9441 20.4311 17.9441 17.7726C17.9441 15.7137 14.8515 11.0629 13.1228 8.70146Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <PrimaryButton
              onClicked={onDrop}
              loading={submitting}
              disabled={!canSubmit}
              padding="tw-px-2.5 lg:tw-px-3.5 tw-py-2.5"
            >
              <span className="tw-hidden lg:tw-inline">Drop</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="tw-size-5 lg:tw-hidden"
              >
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
    </div>
  );
};

export default memo(CreateDropContent);
