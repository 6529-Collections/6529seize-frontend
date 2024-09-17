import PrimaryButton from "../../utils/button/PrimaryButton";
import { ActiveDropAction, ActiveDropState } from "./WaveDetailedContent";
import CreateDropReplyingWrapper from "./CreateDropReplyingWrapper";
import CreateDropInput, { CreateDropInputHandles } from "./CreateDropInput";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { CreateDropRequest } from "../../../generated/models/CreateDropRequest";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";
import { Drop } from "../../../generated/models/Drop";
import { getOptimisticDropId } from "../../../helpers/waves/drop.helpers";
import { useMutation } from "@tanstack/react-query";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import FilePreview from "./FilePreview";
import { AnimatePresence, motion } from "framer-motion";
import CreateDropMetadata from "./CreateDropMetadata";
import { Wave } from "../../../generated/models/Wave";
import { WaveMetadataType } from "../../../generated/models/WaveMetadataType";
import { WaveParticipationRequirement } from "../../../generated/models/WaveParticipationRequirement";
import CreateDropContentRequirements from "./CreateDropContentRequirements";

export type CreateDropMetadataType =
  | {
      key: string;
      readonly type: WaveMetadataType.String;
      value: string | null;
      readonly required: boolean;
    }
  | {
      key: string;
      readonly type: WaveMetadataType.Number;
      value: number | null;
      readonly required: boolean;
    }
  | {
      key: string;
      readonly type: null;
      value: string | null;
      readonly required: boolean;
    };

interface CreateDropContent {
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: Wave;
  readonly drop: CreateDropConfig | null;
  readonly setDrop: (drop: CreateDropConfig | null) => void;
  readonly isStormMode: boolean;
  readonly setIsStormMode: (isStormMode: boolean) => void;
  readonly onDropCreated: () => void;
}

export default function CreateDropContent({
  activeDrop,
  rootDropId,
  onCancelReplyQuote,
  wave,
  isStormMode,
  onDropCreated,
  drop,
  setDrop,
  setIsStormMode,
}: CreateDropContent) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { addOptimisticDrop, waitAndInvalidateDrops } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [files, setFiles] = useState<File[]>([]);

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

  const getIsCharsLimit = () => {
    const markDown = getMarkdown;
    if (!!markDown?.length && markDown.length > 240) {
      return true;
    }
    return false;
  };

  const getCanAddPart = () =>
    getHaveMarkdownOrFile() && !getIsDropLimit() && !getIsCharsLimit();
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

  const clearInputState = () => {
    createDropInputRef.current?.clearEditorState();
    setFiles([]);
  };

  const convertMetadataToDropMetadata = (): DropMetadata[] => {
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

  const onDropPart = (): CreateDropConfig => {
    const markdown = getMarkdown;
    if (!markdown?.length && !files.length) {
      const currentDrop: CreateDropConfig = {
        title: null,
        reply_to:
          activeDrop?.action === ActiveDropAction.REPLY
            ? {
                drop_id: activeDrop.drop.id,
                drop_part_id: activeDrop.partId,
              }
            : rootDropId
            ? {
                drop_id: rootDropId,
                drop_part_id: 1,
              }
            : undefined,
        parts: drop?.parts.length ? drop.parts : [],
        mentioned_users: drop?.mentioned_users ?? [],
        referenced_nfts: drop?.referenced_nfts ?? [],
        metadata: convertMetadataToDropMetadata(),
      };
      setDrop(currentDrop);
      clearInputState();
      return currentDrop;
    }
    const mentions = mentionedUsers.filter((user) =>
      markdown?.includes(`@[${user.handle_in_content}]`)
    );
    const partMentions = mentions.map((mention) => ({
      ...mention,
    }));
    const notAddedMentions = partMentions.filter(
      (mention) =>
        !drop?.mentioned_users.some(
          (existing) =>
            existing.mentioned_profile_id === mention.mentioned_profile_id
        )
    );
    const allMentions = [...(drop?.mentioned_users ?? []), ...notAddedMentions];
    const partNfts = referencedNfts.filter((nft) =>
      markdown?.includes(`#[${nft.name}]`)
    );
    const notAddedNfts = partNfts.filter(
      (nft) =>
        !drop?.referenced_nfts.some(
          (existing) =>
            existing.contract === nft.contract && existing.token === nft.token
        )
    );
    const allNfts = [...(drop?.referenced_nfts ?? []), ...notAddedNfts];
    const currentDrop: CreateDropConfig = {
      title: null,
      reply_to:
        activeDrop?.action === ActiveDropAction.REPLY
          ? {
              drop_id: activeDrop.drop.id,
              drop_part_id: activeDrop.partId,
            }
          : rootDropId
          ? {
              drop_id: rootDropId,
              drop_part_id: 1,
            }
          : undefined,
      parts: drop?.parts.length ? drop.parts : [],
      mentioned_users: allMentions,
      referenced_nfts: allNfts,
      metadata: convertMetadataToDropMetadata(),
    };

    currentDrop.parts.push({
      content: markdown?.length ? markdown : null,
      quoted_drop:
        activeDrop?.action === ActiveDropAction.QUOTE
          ? {
              drop_id: activeDrop.drop.id,
              drop_part_id: activeDrop.partId,
            }
          : null,
      media: files,
    });
    setDrop(currentDrop);
    clearInputState();
    return currentDrop;
  };

  const generateMediaForPart = async (media: File): Promise<DropMedia> => {
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
    const myHeaders = new Headers({ "Content-Type": prep.content_type });
    await fetch(prep.upload_url, {
      method: "PUT",
      headers: myHeaders,
      body: media,
    });
    return {
      url: prep.media_url,
      mime_type: prep.content_type,
    };
  };

  const generatePart = async (
    part: CreateDropPart
  ): Promise<CreateDropRequestPart> => {
    const media = await Promise.all(
      part.media.map((media) => generateMediaForPart(media))
    );
    return {
      ...part,
      media,
    };
  };

  const generateParts = async ({
    parts,
  }: {
    readonly parts: CreateDropPart[];
  }): Promise<CreateDropRequestPart[]> => {
    try {
      return await Promise.all(parts.map((part) => generatePart(part)));
    } catch (error) {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      return [];
    }
  };

  const filterMentionedUsers = ({
    mentionedUsers,
    parts,
  }: {
    readonly mentionedUsers: DropMentionedUser[];
    readonly parts: CreateDropPart[];
  }): DropMentionedUser[] =>
    mentionedUsers.filter((user) =>
      parts.some((part) =>
        part.content?.includes(`@[${user.handle_in_content}]`)
      )
    );

  const getOptimisticDrop = (dropRequest: CreateDropRequest): Drop | null => {
    if (!connectedProfile?.profile) {
      return null;
    }

    return {
      id: getOptimisticDropId(),
      serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
      reply_to:
        activeDrop?.action === ActiveDropAction.REPLY
          ? {
              drop_id: activeDrop.drop.id,
              drop_part_id: activeDrop.partId,
              is_deleted: false,
            }
          : rootDropId
          ? {
              drop_id: rootDropId,
              drop_part_id: 1,
              is_deleted: false,
            }
          : undefined,
      wave: {
        id: wave.id,
        name: wave.name,
        picture: wave.picture ?? "",
        description_drop_id: wave.description_drop.id,
        authenticated_user_eligible_to_participate:
          wave.participation.authenticated_user_eligible,
        authenticated_user_eligible_to_vote:
          wave.voting.authenticated_user_eligible,
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

  const [dropEditorRefreshKey, setDropEditorRefreshKey] = useState(0);

  const refreshState = () => {
    setDropEditorRefreshKey((prev) => prev + 1);
    setMetadata(initialMetadata);
    setMentionedUsers([]);
    setReferencedNfts([]);
    setDrop(null);
  };

  const addDropMutation = useMutation({
    mutationFn: async (body: CreateDropRequest) =>
      await commonApiPost<CreateDropRequest, Drop>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (response: Drop) => {
      refreshState();
      onDropCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      waitAndInvalidateDrops();
      setSubmitting(false);
    },
  });

  // TODO: add required metadata & media validations for wave participation
  const submitDrop = async (dropRequest: CreateDropConfig) => {
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

    const parts = await generateParts({ parts: dropRequest.parts });
    if (!parts.length) {
      setSubmitting(false);
      return;
    }

    const requestBody: CreateDropRequest = {
      ...dropRequest,
      mentioned_users: filterMentionedUsers({
        mentionedUsers: dropRequest.mentioned_users,
        parts: dropRequest.parts,
      }),
      wave_id: wave.id,
      parts,
    };
    const optimisticDrop = getOptimisticDrop(requestBody);
    if (optimisticDrop) {
      addOptimisticDrop({ drop: optimisticDrop, rootDropId });
    }
    await addDropMutation.mutateAsync(requestBody);
  };

  const [missingRequiredMetadataKeys, setMissingRequiredMetadataKeys] =
    useState<string[]>([]);

  const getMissingRequiredMetadataKeys = (): string[] => {
    const missingRequiredFields = metadata.filter(
      (item) =>
        item.required &&
        (item.value === null || item.value === undefined || item.value === "")
    );

    const missingKeys = missingRequiredFields.map((item) => item.key as string);
    return missingKeys;
  };

  useEffect(() => {
    setMissingRequiredMetadataKeys(getMissingRequiredMetadataKeys());
  }, [metadata]);

  const getMissingRequiredMedia = (): WaveParticipationRequirement[] => {
    if (!wave.participation.required_media.length) {
      return [];
    }
    return wave.participation.required_media.filter(
      (media) =>
        !files.some((file) => {
          switch (media) {
            case WaveParticipationRequirement.Image:
              return file.type.startsWith("image/");
            case WaveParticipationRequirement.Audio:
              return file.type.startsWith("audio/");
            case WaveParticipationRequirement.Video:
              return file.type.startsWith("video/");
            default:
              return false;
          }
        })
    );
  };
  const [missingRequiredMedia, setMissingRequiredMedia] = useState<
    WaveParticipationRequirement[]
  >(getMissingRequiredMedia());

  useEffect(() => {
    setMissingRequiredMedia(getMissingRequiredMedia());
  }, [files]);

  const onDrop = async (): Promise<void> => {
    if (missingRequiredMedia.length || missingRequiredMetadataKeys.length) {
      return;
    }
    const currentDrop = onDropPart();
    await submitDrop(currentDrop);
  };

  // Focus the editor on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      createDropInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Focus the editor when activeDrop changes
  useEffect(() => {
    const timer = setTimeout(() => {
      createDropInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeDrop]);

  const handleFileChange = (newFiles: File[]) => {
    if (newFiles.length > 4) {
      setToast({
        message: "You can only upload up to 4 files at a time",
        type: "error",
      });
      return;
    }
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  useEffect(() => {
    if (!drop) {
      setIsStormMode(false);
      return;
    }

    if (!drop.parts.length) {
      // If no parts are left, exit storm mode
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

  return (
    <div className="tw-flex-grow">
      <CreateDropReplyingWrapper
        activeDrop={activeDrop}
        onCancelReplyQuote={onCancelReplyQuote}
      />
      <div className="tw-flex tw-items-end">
        <div className="tw-flex-grow">
          <CreateDropInput
            key={dropEditorRefreshKey}
            ref={createDropInputRef}
            editorState={editorState}
            type={activeDrop?.action ?? null}
            drop={drop}
            isStormMode={isStormMode}
            setIsStormMode={setIsStormMode}
            canSubmit={canSubmit}
            isRequiredMetadataMissing={!!missingRequiredMetadataKeys.length}
            isRequiredMediaMissing={!!missingRequiredMedia.length}
            canAddPart={canAddPart}
            onEditorState={setEditorState}
            onReferencedNft={onReferencedNft}
            onMentionedUser={onMentionedUser}
            setFiles={handleFileChange}
            onDropPart={onDropPart}
            onDrop={onDrop}
            onAddMetadataClick={onAddMetadataClick}
          />
        </div>
        <div className="tw-ml-3">
          <PrimaryButton
            onClicked={onDrop}
            loading={submitting}
            disabled={!canSubmit}
          >
            Drop
          </PrimaryButton>
        </div>
      </div>
      <CreateDropContentRequirements
        canSubmit={canSubmit}
        wave={wave}
        missingMedia={missingRequiredMedia}
        missingMetadata={missingRequiredMetadataKeys}
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
              onRemoveMetadata={onRemoveMetadata}
              closeMetadata={closeMetadata}
              metadata={metadata}
              missingRequiredMetadataKeys={missingRequiredMetadataKeys}
              onChangeKey={onChangeKey}
              onChangeValue={onChangeValue}
              onAddMetadata={onAddMetadata}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!!files.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FilePreview files={files} removeFile={removeFile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
