"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type JSX,
} from "react";
import type { CreateDropCompactHandles } from "../compact/CreateDropCompact";
import CreateDropCompact from "../compact/CreateDropCompact";

import type { CreateDropFullHandles } from "../full/CreateDropFull";
import CreateDropFull from "../full/CreateDropFull";
import type { EditorState } from "lexical";
import type {
  CreateDropConfig,
  CreateDropPart,
  DropMetadata,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import { createBreakpoint } from "react-use";
import type { CreateDropType } from "../types";
import { CreateDropViewType } from "../types";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { WAVE_MENTION_TRANSFORMER } from "../lexical/transformers/WaveMentionTransformer";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWaveRequiredMetadata } from "@/generated/models/ApiWaveRequiredMetadata";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";
import { SAFE_MARKDOWN_TRANSFORMERS } from "../lexical/transformers/markdownTransformers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { WalletValidationError } from "@/errors/wallet";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";
import { hasPendingInlineImageUploadMarkdown } from "@/helpers/waves/inline-image-upload.helpers";

export enum CreateDropScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

export interface CreateDropWrapperHandles {
  requestDrop: () => CreateDropConfig;
  getDropSnapshot: () => CreateDropConfig;
}

interface CreateDropWrapperWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface CreateDropWrapperProps {
  readonly quotedDrop: {
    dropId: string;
    partId: number;
  } | null;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly mentionedUsers: Omit<MentionedUser, "current_handle">[];
  readonly mentionedWaves: MentionedWave[];
  readonly referencedNfts: ReferencedNft[];
  readonly drop: CreateDropConfig | null;
  readonly viewType: CreateDropViewType;
  readonly showSubmit: boolean;
  readonly submitOnEnter?: boolean | undefined;
  readonly showDropError?: boolean | undefined;
  readonly wave: CreateDropWrapperWaveProps | null;
  readonly waveId: string | null;
  /**
   * Pins the rendering branch regardless of breakpoint. Embedded usages
   * (the create-wave Description step) must stay inline (DESKTOP): the
   * MOBILE branch is a modal sheet that cannot host a page-flow step.
   */
  readonly forceScreenType?: CreateDropScreenType | undefined;
  readonly children: React.ReactNode;
  readonly setIsStormMode: (isStormMode: boolean) => void;
  readonly setViewType: (newV: CreateDropViewType) => void;
  readonly setDrop: (newV: CreateDropConfig) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly onMentionedWave: (newWave: MentionedWave) => void;
  readonly setReferencedNfts: (newV: ReferencedNft[]) => void;
  readonly setTitle: (newV: string | null) => void;
  readonly setMetadata: (newV: DropMetadata[]) => void;
  readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
  readonly onCanSubmitChange?:
    | ((canSubmit: boolean) => void)
    | undefined
    | undefined;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

let fallbackDropPartClientId = 0;

const createDropPartClientId = (): string => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  fallbackDropPartClientId += 1;
  return `drop-part-${Date.now()}-${fallbackDropPartClientId}`;
};

const getDropPartClientId = (part: CreateDropPart): string =>
  part.clientId ??
  (part.id !== undefined ? `${part.id}` : createDropPartClientId());

const CreateDropWrapper = forwardRef<
  CreateDropWrapperHandles,
  CreateDropWrapperProps
>(
  (
    {
      quotedDrop,
      type,
      loading,
      title,
      metadata,
      mentionedUsers,
      mentionedWaves,
      referencedNfts,
      drop,
      viewType,
      showSubmit,
      submitOnEnter = true,
      showDropError = false,
      wave: waveProps,
      waveId,
      forceScreenType,
      children,
      setIsStormMode,
      setViewType,
      setDrop,
      setReferencedNfts,
      onMentionedUser,
      onMentionedWave,
      setTitle,
      setMetadata,
      onSubmitDrop,
      onCanSubmitChange,
    },
    ref
  ) => {
    const { isSafeWallet, address, hasValidWalletAuth } =
      useSeizeConnectContext();
    const breakpoint = useBreakpoint();

    // SECURITY: Fail-fast if wallet is not properly authenticated
    useEffect(() => {
      if (!hasValidWalletAuth) {
        throw new WalletValidationError(
          "Authentication required for drop creation. Please connect and authenticate your wallet."
        );
      }

      if (!address) {
        throw new WalletValidationError(
          "Authenticated wallet address is missing. Please reconnect your wallet."
        );
      }
    }, [hasValidWalletAuth, address]);
    const [screenType, setScreenType] = useState<CreateDropScreenType>(
      forceScreenType ?? CreateDropScreenType.DESKTOP
    );
    useEffect(() => {
      // Embedded usages (the create-wave Description step) pin the inline
      // rendering: the MOBILE branch wraps the editor in a modal sheet, which
      // cannot host a page-flow step (dismissing it would kill the step).
      if (forceScreenType) {
        setScreenType(forceScreenType);
        return;
      }
      if (breakpoint === "LG") {
        setScreenType(CreateDropScreenType.DESKTOP);
      } else {
        setScreenType(CreateDropScreenType.MOBILE);
      }
    }, [breakpoint, forceScreenType]);

    const prevWaveIdRef = useRef<string | null>(waveProps?.id ?? null);
    const isWaveSwitch = prevWaveIdRef.current !== (waveProps?.id ?? null);

    useEffect(() => {
      prevWaveIdRef.current = waveProps?.id ?? null;
    }, [waveProps?.id]);

    const { data: wave, isFetching: isWaveFetching } = useQuery<ApiWave>({
      queryKey: [QueryKey.WAVE, { wave_id: waveProps?.id }],
      queryFn: async () =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveProps?.id}`,
        }),
      enabled: !!waveProps?.id,
    });

    const [editorState, setEditorState] = useState<EditorState | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    const setFilesWhenUnlocked = (newFiles: File[]) => {
      if (loading) {
        return;
      }
      setFiles(newFiles);
    };

    const setEditorStateWhenUnlocked = (newEditorState: EditorState | null) => {
      if (loading) {
        return;
      }
      setEditorState(newEditorState);
    };

    const syncUploadEditorState = (newEditorState: EditorState) => {
      setEditorState(newEditorState);
    };

    const setViewTypeWhenUnlocked = (newViewType: CreateDropViewType) => {
      if (loading) {
        return;
      }
      setViewType(newViewType);
    };

    const setTitleWhenUnlocked = (newTitle: string | null) => {
      if (loading) {
        return;
      }
      setTitle(newTitle);
    };

    const onMentionedUserWhenUnlocked = (
      newUser: Omit<MentionedUser, "current_handle">
    ) => {
      if (loading) {
        return;
      }
      onMentionedUser(newUser);
    };

    const onMentionedWaveWhenUnlocked = (newWave: MentionedWave) => {
      if (loading) {
        return;
      }
      onMentionedWave(newWave);
    };

    const onFileRemove = (file: File) => {
      if (loading) {
        return;
      }
      setFiles((prev) => prev.filter((f) => f !== file));
    };

    const onMetadataEdit = ({ data_key, data_value }: DropMetadata) => {
      if (loading) {
        return;
      }
      const index = metadata.findIndex((m) => m.data_key === data_key);
      if (index === -1) {
        setMetadata([...metadata, { data_key, data_value }]);
      } else {
        const updatedMetadata = [...metadata];
        updatedMetadata[index] = { data_key, data_value };
        setMetadata(updatedMetadata);
      }
    };
    const onMetadataRemove = (data_key: string) => {
      if (loading) {
        return;
      }
      setMetadata(metadata.filter((m) => m.data_key !== data_key));
    };

    const onReferencedNft = (newNft: ReferencedNft) => {
      if (loading) {
        return;
      }
      setReferencedNfts([
        ...referencedNfts.filter(
          (i) => !(i.token === newNft.token && i.contract === newNft.contract)
        ),
        newNft,
      ]);
    };
    const getMarkdown = () =>
      editorState
        ? exportDropMarkdown(editorState, [
            ...SAFE_MARKDOWN_TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
            WAVE_MENTION_TRANSFORMER,
            IMAGE_TRANSFORMER,
          ])
        : null;

    const getHasPendingInlineImageUpload = () =>
      hasPendingInlineImageUploadMarkdown(getMarkdown());

    const getMissingRequiredMetadata = (): ApiWaveRequiredMetadata[] => {
      if (!waveProps?.id) {
        return [];
      }

      if (!wave) {
        return [];
      }

      if (!metadata.length) {
        return wave.participation.required_metadata;
      }
      return wave.participation.required_metadata.filter((i) => {
        const item = metadata.find((j) => j.data_key === i.name);
        if (!item) {
          return true;
        }
        if (!item.data_value.length) {
          return true;
        }
        if (
          i.type === ApiWaveMetadataType.Number &&
          Number.isNaN(Number(item.data_value))
        ) {
          return true;
        }
        return false;
      });
    };

    const getRequirementFromFileType = (
      file: File
    ): ApiWaveParticipationRequirement | null => {
      if (file.type.startsWith("image/"))
        return ApiWaveParticipationRequirement.Image;
      if (file.type.startsWith("audio/"))
        return ApiWaveParticipationRequirement.Audio;
      if (file.type.startsWith("video/"))
        return ApiWaveParticipationRequirement.Video;
      return null; // Unknown or unsupported file type
    };

    const getMedias = (): File[] => {
      if (drop?.parts.length) {
        return drop.parts.reduce<File[]>(
          (acc, part) => [...acc, ...(part.media ?? [])],
          files
        );
      }
      return files;
    };

    const getMissingRequiredMedia = (): ApiWaveParticipationRequirement[] => {
      if (!waveProps?.id) {
        return [];
      }

      if (!wave) {
        return [];
      }
      if (!drop?.parts.length && !files.length) {
        return wave.participation.required_media;
      }
      const medias = getMedias();
      return wave.participation.required_media.filter(
        (i) => !medias.some((j) => getRequirementFromFileType(j) === i)
      );
    };

    const [missingMedia, setMissingMedia] = useState<
      ApiWaveParticipationRequirement[]
    >(getMissingRequiredMedia());

    const [missingMetadata, setMissingMetadata] = useState<
      ApiWaveRequiredMetadata[]
    >(getMissingRequiredMetadata());

    useEffect(() => {
      setMissingMetadata(getMissingRequiredMetadata());
    }, [waveProps, wave, drop, metadata]);

    useEffect(() => {
      setMissingMedia(getMissingRequiredMedia());
    }, [waveProps, wave, drop, files]);

    const getCanSubmitStorm = () => {
      const markdown = getMarkdown();
      if (markdown?.length && markdown.length > 240) {
        return false;
      }
      return true;
    };

    const getCanSubmit = () =>
      !!(!!getMarkdown() || !!files.length || !!drop?.parts.length) &&
      !getHasPendingInlineImageUpload() &&
      !missingMedia.length &&
      !missingMetadata.length &&
      !!(drop?.parts.length ? getCanSubmitStorm() : true);

    const [canSubmit, setCanSubmit] = useState(getCanSubmit());

    const getHaveMarkdownOrFile = () => !!getMarkdown() || !!files.length;
    const getIsDropLimit = () =>
      (drop?.parts.reduce(
        (acc, part) => acc + (part.content?.length ?? 0),
        getMarkdown()?.length ?? 0
      ) ?? 0) >= 24000;

    const getIsCharsLimit = () => {
      const markDown = getMarkdown();
      if (!!markDown?.length && markDown.length > 240) {
        return true;
      }
      return false;
    };

    const getCanAddPart = () =>
      getHaveMarkdownOrFile() &&
      !getHasPendingInlineImageUpload() &&
      !getIsDropLimit() &&
      !getIsCharsLimit();
    const [canAddPart, setCanAddPart] = useState(getCanAddPart());
    useEffect(() => {
      setCanSubmit(getCanSubmit());
      setCanAddPart(getCanAddPart());
    }, [editorState, files, drop, missingMedia, missingMetadata]);

    useEffect(() => {
      if (!onCanSubmitChange) {
        return;
      }
      onCanSubmitChange(canSubmit);
    }, [canSubmit]);

    const createDropContentFullRef = useRef<CreateDropFullHandles | null>(null);
    const createDropContendCompactRef = useRef<CreateDropCompactHandles | null>(
      null
    );
    const clearInputState = () => {
      createDropContentFullRef.current?.clearEditorState();
      createDropContendCompactRef.current?.clearEditorState();
      setFiles([]);
    };

    const getExistingPartsSnapshot = (): CreateDropPart[] =>
      drop?.parts.map((part) => {
        const media = (part as { readonly media?: CreateDropPart["media"] })
          .media;

        return {
          ...part,
          clientId: getDropPartClientId(part),
          media: media !== undefined ? [...media] : [],
          ...(part.attachments !== undefined && {
            attachments: [...part.attachments],
          }),
          ...(part.uploaded_attachments !== undefined && {
            uploaded_attachments: [...part.uploaded_attachments],
          }),
          ...(part.mentioned_groups !== undefined && {
            mentioned_groups: [...part.mentioned_groups],
          }),
        };
      }) ?? [];

    const getDraftPart = (
      markdown: string | null,
      existingPartsCount: number
    ): CreateDropPart | null => {
      const hasMarkdown = markdown !== null && markdown.length > 0;

      if (!hasMarkdown && files.length === 0) {
        return null;
      }

      return {
        clientId: createDropPartClientId(),
        content: hasMarkdown ? markdown : null,
        quoted_drop:
          quotedDrop && existingPartsCount === 0
            ? {
                drop_id: quotedDrop.dropId,
                drop_part_id: quotedDrop.partId,
              }
            : null,
        media: [...files],
      };
    };

    const getDropReferences = (markdown: string | null) => {
      const mentions = mentionedUsers.filter((user) =>
        markdown?.includes(`@[${user.handle_in_content}]`)
      );
      const partMentions = mentions.map((mention) => ({
        ...mention,
      }));
      const existingMentions = drop?.mentioned_users ?? [];
      const notAddedMentions = partMentions.filter(
        (mention) =>
          !existingMentions.some(
            (existing) =>
              existing.mentioned_profile_id === mention.mentioned_profile_id
          )
      );
      const allMentions = [...existingMentions, ...notAddedMentions];
      const partNfts = referencedNfts.filter((nft) =>
        markdown?.includes(`$[${nft.name}]`)
      );
      const existingNfts = drop?.referenced_nfts ?? [];
      const notAddedNfts = partNfts.filter(
        (nft) =>
          !existingNfts.some(
            (existing) =>
              existing.contract === nft.contract && existing.token === nft.token
          )
      );
      const allNfts = [...existingNfts, ...notAddedNfts];
      const partWaves = mentionedWaves.filter((w) =>
        markdown?.includes(`#[${w.wave_name_in_content}]`)
      );
      const existingWaves = drop?.mentioned_waves ?? [];
      const notAddedWaves = partWaves.filter(
        (w) => !existingWaves.some((existing) => existing.wave_id === w.wave_id)
      );
      const allWaves = [...existingWaves, ...notAddedWaves];

      return {
        mentioned_users: allMentions,
        mentioned_waves: allWaves,
        referenced_nfts: allNfts,
      };
    };

    const getDropSnapshot = (): CreateDropConfig => {
      const markdown = getMarkdown();
      const parts = getExistingPartsSnapshot();
      const draftPart = getDraftPart(markdown, parts.length);
      if (draftPart) {
        parts.push(draftPart);
      }
      const references = getDropReferences(markdown);

      return {
        title,
        parts,
        ...references,
        metadata: [...metadata],
        signature: null,
        is_safe_signature: isSafeWallet,
        ...{ ...(address && { signer_address: address }) },
      };
    };

    const onDropPart = (): CreateDropConfig => {
      if (loading) {
        return getDropSnapshot();
      }
      if (getHasPendingInlineImageUpload()) {
        return getDropSnapshot();
      }
      const currentDrop = getDropSnapshot();
      setDrop(currentDrop);
      clearInputState();
      return currentDrop;
    };
    const onDrop = () => {
      if (loading) {
        return;
      }
      if (getHasPendingInlineImageUpload()) {
        return;
      }
      const currentDrop = onDropPart();
      onSubmitDrop(currentDrop);
    };

    const onStormDropPart = () => {
      if (loading) {
        return getDropSnapshot();
      }
      if (getHasPendingInlineImageUpload()) {
        return getDropSnapshot();
      }
      setIsStormMode(true);
      return onDropPart();
    };

    const requestDrop = (): CreateDropConfig => onDropPart();

    useImperativeHandle(ref, () => ({
      getDropSnapshot,
      requestDrop,
    }));

    const components: Record<CreateDropViewType, JSX.Element> = {
      [CreateDropViewType.COMPACT]: (
        <CreateDropCompact
          ref={createDropContendCompactRef}
          screenType={screenType}
          editorState={editorState}
          files={files}
          canSubmit={canSubmit}
          waveId={waveId}
          canAddPart={canAddPart}
          drop={drop}
          loading={loading}
          type={type}
          showSubmit={showSubmit}
          submitOnEnter={submitOnEnter}
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onViewChange={setViewTypeWhenUnlocked}
          onEditorState={setEditorStateWhenUnlocked}
          onUploadEditorStateChange={syncUploadEditorState}
          onMentionedUser={onMentionedUserWhenUnlocked}
          onMentionedWave={onMentionedWaveWhenUnlocked}
          onReferencedNft={onReferencedNft}
          setFiles={setFilesWhenUnlocked}
          onFileRemove={onFileRemove}
          onDrop={onDrop}
          onDropPart={onStormDropPart}
        >
          {children}
        </CreateDropCompact>
      ),
      [CreateDropViewType.FULL]: (
        <CreateDropFull
          ref={createDropContentFullRef}
          screenType={screenType}
          title={title}
          files={files}
          metadata={metadata}
          editorState={editorState}
          canSubmit={canSubmit}
          waveId={waveId}
          canAddPart={canAddPart}
          loading={loading}
          type={type}
          drop={drop}
          showSubmit={showSubmit}
          submitOnEnter={submitOnEnter}
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onTitle={setTitleWhenUnlocked}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
          onViewChange={setViewTypeWhenUnlocked}
          onEditorState={setEditorStateWhenUnlocked}
          onUploadEditorStateChange={syncUploadEditorState}
          onMentionedUser={onMentionedUserWhenUnlocked}
          onMentionedWave={onMentionedWaveWhenUnlocked}
          onReferencedNft={onReferencedNft}
          setFiles={setFilesWhenUnlocked}
          onFileRemove={onFileRemove}
          onDrop={onDrop}
          onDropPart={onStormDropPart}
        >
          {children}
        </CreateDropFull>
      ),
    };

    const disableHeightAnimation =
      screenType === CreateDropScreenType.DESKTOP &&
      (isWaveSwitch || isWaveFetching);

    return (
      <div>
        <CommonAnimationHeight disableAnimation={disableHeightAnimation}>
          {components[viewType]}
        </CommonAnimationHeight>
      </div>
    );
  }
);

CreateDropWrapper.displayName = "CreateDropWrapper";
export default CreateDropWrapper;
