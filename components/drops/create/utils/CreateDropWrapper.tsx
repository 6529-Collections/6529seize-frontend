"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
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
} from "@/entities/IDrop";
import { createBreakpoint } from "react-use";
import { CreateDropType, CreateDropViewType } from "../types";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import CommonAnimationHeight from "@/components/utils/animation/CommonAnimationHeight";
import { useQuery } from "@tanstack/react-query";
import { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";
import { SAFE_MARKDOWN_TRANSFORMERS } from "../lexical/transformers/markdownTransformers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { WalletValidationError } from "@/src/errors/wallet";
import {
  exportDropMarkdown,
} from "@/components/waves/drops/normalizeDropMarkdown";

const getRequirementFromFileType = (
  file: File
): ApiWaveParticipationRequirement | null => {
  if (file.type.startsWith("image/")) {
    return ApiWaveParticipationRequirement.Image;
  }
  if (file.type.startsWith("audio/")) {
    return ApiWaveParticipationRequirement.Audio;
  }
  if (file.type.startsWith("video/")) {
    return ApiWaveParticipationRequirement.Video;
  }
  return null;
};

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
      setReferencedNfts,
      onMentionedUser,
      setTitle,
      setMetadata,
      onSubmitDrop,
      onCanSubmitChange,
    },
    ref
  ) => {
    const {
      isSafeWallet,
      address,
      isAuthenticated,
      connectionState,
    } = useSeizeConnectContext();
    const breakpoint = useBreakpoint();
    
    useEffect(() => {
      if (connectionState === "initializing" || connectionState === "connecting") {
        return;
      }

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
    }, [connectionState, isAuthenticated, address]);
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
    const markdownContent = useMemo(
      () =>
        editorState
          ? exportDropMarkdown(editorState, [
              ...SAFE_MARKDOWN_TRANSFORMERS,
              MENTION_TRANSFORMER,
              HASHTAG_TRANSFORMER,
              IMAGE_TRANSFORMER,
            ])
          : null,
      [editorState]
    );
    const combinedMedias = useMemo(() => {
      if (!drop?.parts.length) {
        return files;
      }
      return drop.parts.reduce<File[]>(
        (acc, part) => [...acc, ...(part.media ?? [])],
        files
      );
    }, [drop, files]);

    const missingMetadata = useMemo(
      () => {
        if (!waveProps?.id || !wave) {
          return [];
        }

        if (!metadata.length) {
          return wave.participation.required_metadata;
        }

        return wave.participation.required_metadata.filter((item) => {
          const existing = metadata.find((entry) => entry.data_key === item.name);
          if (!existing) {
            return true;
          }
          if (!existing.data_value.length) {
            return true;
          }
          if (
            item.type === ApiWaveMetadataType.Number &&
            Number.isNaN(Number(existing.data_value))
          ) {
            return true;
          }
          return false;
        });
      },
      [waveProps, wave, metadata]
    );

    const missingMedia = useMemo(
      () => {
        if (!waveProps?.id || !wave) {
          return [];
        }

        if (!drop?.parts.length && !files.length) {
          return wave.participation.required_media;
        }

        return wave.participation.required_media.filter((requirement) => {
          const hasFile = combinedMedias.some(
            (file) => getRequirementFromFileType(file) === requirement
          );
          return !hasFile;
        });
      },
      [waveProps, wave, drop, files, combinedMedias]
    );

    const canSubmit = useMemo(() => {
      const hasExistingParts = Boolean(drop?.parts?.length);
      const hasAnyContent =
        Boolean(markdownContent) || files.length > 0 || hasExistingParts;

      if (!hasAnyContent) {
        return false;
      }

      if (missingMedia.length || missingMetadata.length) {
        return false;
      }

      if (
        hasExistingParts &&
        markdownContent?.length &&
        markdownContent.length > 240
      ) {
        return false;
      }

      return true;
    }, [drop, files, missingMedia, missingMetadata, markdownContent]);

    const canAddPart = useMemo(() => {
      const hasMarkdownOrFile = Boolean(markdownContent) || files.length > 0;
      if (!hasMarkdownOrFile) {
        return false;
      }

      const dropContentLength =
        drop?.parts?.reduce(
          (acc, part) => acc + (part.content?.length ?? 0),
          0
        ) ?? 0;

      const totalContentLength = dropContentLength + (markdownContent?.length ?? 0);

      if (totalContentLength >= 24000) {
        return false;
      }

      if (markdownContent?.length && markdownContent.length > 240) {
        return false;
      }

      return true;
    }, [drop, files, markdownContent]);

    useEffect(() => {
      if (!onCanSubmitChange) {
        return;
      }
      onCanSubmitChange(canSubmit);
    }, [canSubmit, onCanSubmitChange]);

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
      if (!markdownContent?.length && !files.length) {
        const currentDrop: CreateDropConfig = {
          title,
          parts: drop?.parts.length ? drop.parts : [],
          mentioned_users: drop?.mentioned_users ?? [],
          referenced_nfts: drop?.referenced_nfts ?? [],
          metadata,
          signature: null,
          is_safe_signature: isSafeWallet,
          signer_address: address,
        };
        setDrop(currentDrop);
        clearInputState();
        return currentDrop;
      }
      const mentions = mentionedUsers.filter((user) =>
        markdownContent?.includes(`@[${user.handle_in_content}]`)
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
        markdownContent?.includes(`#[${nft.name}]`)
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
        signer_address: address,
      };
      currentDrop.parts.push({
        content: markdownContent?.length ? markdownContent : null,
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
          showDropError={showDropError}
          missingMedia={missingMedia}
          missingMetadata={missingMetadata}
          onViewChange={setViewType}
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
