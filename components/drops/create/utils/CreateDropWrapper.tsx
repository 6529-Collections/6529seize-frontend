"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type JSX,
} from "react";
import CreateDropCompact, {
  CreateDropCompactHandles,
} from "../compact/CreateDropCompact";

import CreateDropFull, { CreateDropFullHandles } from "../full/CreateDropFull";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { createBreakpoint } from "react-use";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { CreateDropType, CreateDropViewType } from "../types";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";
import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { commonApiFetch } from "../../../../services/api/common-api";
import { ApiWaveRequiredMetadata } from "../../../../generated/models/ApiWaveRequiredMetadata";
import { ApiWaveMetadataType } from "../../../../generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "../../../../generated/models/ApiWaveParticipationRequirement";
import { ProfileMinWithoutSubs } from "../../../../helpers/ProfileTypes";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { WalletValidationError } from "../../../../src/errors/wallet";

export enum CreateDropScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

export interface CreateDropWrapperHandles {
  requestDrop: () => CreateDropConfig;
}

interface CreateDropWrapperWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface CreateDropWrapperProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly quotedDrop: {
    dropId: string;
    partId: number;
  } | null;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly mentionedUsers: Omit<MentionedUser, "current_handle">[];
  readonly referencedNfts: ReferencedNft[];
  readonly drop: CreateDropConfig | null;
  readonly viewType: CreateDropViewType;
  readonly showSubmit: boolean;
  readonly showDropError?: boolean;
  readonly wave: CreateDropWrapperWaveProps | null;
  readonly waveId: string | null;
  readonly children: React.ReactNode;
  readonly showProfile?: boolean;
  readonly setIsStormMode: (isStormMode: boolean) => void;
  readonly setViewType: (newV: CreateDropViewType) => void;
  readonly setDrop: (newV: CreateDropConfig) => void;
  readonly setMentionedUsers: (
    newV: Omit<MentionedUser, "current_handle">[]
  ) => void;
  readonly onMentionedUser: (
    newUser: Omit<MentionedUser, "current_handle">
  ) => void;
  readonly setReferencedNfts: (newV: ReferencedNft[]) => void;
  readonly setTitle: (newV: string | null) => void;
  readonly setMetadata: (newV: DropMetadata[]) => void;
  readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
  readonly onCanSubmitChange?: (canSubmit: boolean) => void;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const CreateDropWrapper = forwardRef<
  CreateDropWrapperHandles,
  CreateDropWrapperProps
>(
  (
    {
      profile,
      quotedDrop,
      type,
      loading,
      title,
      metadata,
      mentionedUsers,
      referencedNfts,
      drop,
      viewType,
      showSubmit,
      showDropError = false,
      showProfile = true,
      wave: waveProps,
      waveId,
      children,
      setIsStormMode,
      setViewType,
      setDrop,
      setMentionedUsers,
      setReferencedNfts,
      onMentionedUser,
      setTitle,
      setMetadata,
      onSubmitDrop,
      onCanSubmitChange,
    },
    ref
  ) => {
    const { isSafeWallet, address, isAuthenticated } = useSeizeConnectContext();
    const breakpoint = useBreakpoint();
    
    // SECURITY: Fail-fast if wallet is not properly authenticated
    useEffect(() => {
      if (!isAuthenticated) {
        throw new WalletValidationError(
          'Authentication required for drop creation. Please connect and authenticate your wallet.'
        );
      }
      
      if (!address) {
        throw new WalletValidationError(
          'Authenticated wallet address is missing. Please reconnect your wallet.'
        );
      }
    }, [isAuthenticated, address]);
    const [screenType, setScreenType] = useState<CreateDropScreenType>(
      CreateDropScreenType.DESKTOP
    );
    useEffect(() => {
      if (breakpoint === "LG") {
        setScreenType(CreateDropScreenType.DESKTOP);
      } else {
        setScreenType(CreateDropScreenType.MOBILE);
      }
    }, [breakpoint]);

    const { data: wave } = useQuery<ApiWave>({
      queryKey: [QueryKey.WAVE, { wave_id: waveProps?.id }],
      queryFn: async () =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveProps?.id}`,
        }),
      enabled: !!waveProps?.id,
    });

    const [editorState, setEditorState] = useState<EditorState | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    const onFileRemove = (file: File) => {
      setFiles((prev) => prev.filter((f) => f !== file));
    };

    const onMetadataEdit = ({ data_key, data_value }: DropMetadata) => {
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
      setMetadata(metadata.filter((m) => m.data_key !== data_key));
    };

    const onReferencedNft = (newNft: ReferencedNft) => {
      setReferencedNfts([
        ...referencedNfts.filter(
          (i) => !(i.token === newNft.token && i.contract === newNft.contract)
        ),
        newNft,
      ]);
    };
    const getMarkdown = () =>
      editorState?.read(() =>
        $convertToMarkdownString([
          ...TRANSFORMERS,
          MENTION_TRANSFORMER,
          HASHTAG_TRANSFORMER,
          IMAGE_TRANSFORMER,
        ])
      ) ?? null;

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
          isNaN(Number(item.data_value))
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
      return wave.participation.required_media.filter((i) => {
        const file = medias.find((j) => getRequirementFromFileType(j) === i);
        if (!file) {
          return true;
        }
        return false;
      });
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
      getHaveMarkdownOrFile() && !getIsDropLimit() && !getIsCharsLimit();
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
    const onDropPart = (): CreateDropConfig => {
      const markdown = getMarkdown();
      if (!markdown?.length && !files.length) {
        const currentDrop: CreateDropConfig = {
          title,
          parts: drop?.parts.length ? drop.parts : [],
          mentioned_users: drop?.mentioned_users ?? [],
          referenced_nfts: drop?.referenced_nfts ?? [],
          metadata,
          signature: null,
          is_safe_signature: isSafeWallet,
          signer_address: address, // Already validated via useEffect above
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
      const allMentions = [
        ...(drop?.mentioned_users ?? []),
        ...notAddedMentions,
      ];
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
        title,
        parts: drop?.parts.length ? drop.parts : [],
        mentioned_users: allMentions,
        referenced_nfts: allNfts,
        metadata,
        signature: null,
        is_safe_signature: isSafeWallet,
        signer_address: address, // Already validated via useEffect above
      };
      currentDrop.parts.push({
        content: markdown?.length ? markdown : null,
        quoted_drop:
          quotedDrop && !currentDrop.parts.length
            ? {
                drop_id: quotedDrop.dropId,
                drop_part_id: quotedDrop.partId,
              }
            : null,
        media: files,
      });
      setDrop(currentDrop);
      clearInputState();
      return currentDrop;
    };
    const onDrop = () => {
      const currentDrop = onDropPart();
      onSubmitDrop(currentDrop);
    };

    const onStormDropPart = () => {
      setIsStormMode(true);
      return onDropPart();
    };

    const requestDrop = (): CreateDropConfig => onDropPart();

    useImperativeHandle(ref, () => ({
      requestDrop,
    }));

    const components: Record<CreateDropViewType, JSX.Element> = {
      [CreateDropViewType.COMPACT]: (
        <CreateDropCompact
          ref={createDropContendCompactRef}
          profile={profile}
          showProfile={showProfile}
          screenType={screenType}
          editorState={editorState}
          files={files}
          title={title}
          metadata={metadata}
          canSubmit={canSubmit}
          waveId={waveId}
          canAddPart={canAddPart}
          drop={drop}
          loading={loading}
          type={type}
          showSubmit={showSubmit}
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onViewChange={setViewType}
          onMetadataRemove={onMetadataRemove}
          onEditorState={setEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          setFiles={setFiles}
          onFileRemove={onFileRemove}
          onDrop={onDrop}
          onDropPart={onStormDropPart}>
          {children}
        </CreateDropCompact>
      ),
      [CreateDropViewType.FULL]: (
        <CreateDropFull
          ref={createDropContentFullRef}
          screenType={screenType}
          profile={profile}
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
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onTitle={setTitle}
          onMetadataEdit={onMetadataEdit}
          onMetadataRemove={onMetadataRemove}
          onViewChange={setViewType}
          onEditorState={setEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          setFiles={setFiles}
          onFileRemove={onFileRemove}
          onDrop={onDrop}
          onDropPart={onStormDropPart}>
          {children}
        </CreateDropFull>
      ),
    };
    return (
      <div>
        <CommonAnimationHeight>{components[viewType]}</CommonAnimationHeight>
      </div>
    );
  }
);

CreateDropWrapper.displayName = "CreateDropWrapper";
export default CreateDropWrapper;
