import { useContext, useEffect, useRef, useState } from "react";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { ApiDropPart } from "../../../../../../generated/models/ApiDropPart";
import DropReplyInput, { DropReplyInputHandles } from "./DropReplyInput";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  CreateDropPart,
  CreateDropRequestPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../../entities/IDrop";
import PrimaryButton from "../../../../../utils/buttons/PrimaryButton";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { MENTION_TRANSFORMER } from "../../../../create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../../../create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../../../../create/lexical/transformers/ImageTransformer";
import { useMutation } from "@tanstack/react-query";
import { ApiCreateDropRequest } from "../../../../../../generated/models/ApiCreateDropRequest";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { ApiDropMedia } from "../../../../../../generated/models/ApiDropMedia";
import { getOptimisticDropId } from "../../../../../../helpers/waves/drop.helpers";
import { ApiDropType } from "../../../../../../generated/models/ApiDropType";

export default function DropReplyInputWrapper({
  drop: originalDrop,
  dropPart,
  onReply,
}: {
  readonly drop: ApiDrop;
  readonly dropPart: ApiDropPart;
  readonly onReply: () => void;
}) {
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { waitAndInvalidateDrops, addOptimisticDrop, invalidateDrops } =
    useContext(ReactQueryWrapperContext);

  const [mentionedUsers, setMentionedUsers] = useState<
    Omit<MentionedUser, "current_handle">[]
  >([]);
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
  const [drop, setDrop] = useState<CreateDropConfig | null>(null);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const getMarkdown = () =>
    editorState?.read(() =>
      $convertToMarkdownString([
        ...TRANSFORMERS,
        MENTION_TRANSFORMER,
        HASHTAG_TRANSFORMER,
        IMAGE_TRANSFORMER,
      ])
    ) ?? null;

  const getCanSubmit = () => !!(!!getMarkdown() || !!file);

  const [canSubmit, setCanSubmit] = useState(getCanSubmit());

  useEffect(() => {
    setCanSubmit(getCanSubmit());
  }, [editorState, file, drop]);

  const onMentionedUser = (newUser: Omit<MentionedUser, "current_handle">) => {
    setMentionedUsers((curr) => {
      return [...curr, newUser];
    });
  };

  const onReferencedNft = (newNft: ReferencedNft) => {
    setReferencedNfts([
      ...referencedNfts.filter(
        (i) => !(i.token === newNft.token && i.contract === newNft.contract)
      ),
      newNft,
    ]);
  };

  const dropReplyInputRef = useRef<DropReplyInputHandles | null>(null);

  const clearInputState = () => {
    dropReplyInputRef.current?.clearEditorState();
    setFile(null);
  };

  const addReplyMutation = useMutation({
    mutationFn: async (body: ApiCreateDropRequest) =>
      await commonApiPost<ApiCreateDropRequest, ApiDrop>({
        endpoint: `drops`,
        body,
      }),
    onSuccess: (respone: ApiDrop) => {
      setDrop(null);
      waitAndInvalidateDrops();
      onReply();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      invalidateDrops();
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const onDropPart = (): CreateDropConfig => {
    const markdown = getMarkdown();
    if (!markdown?.length && !file) {
      const currentDrop: CreateDropConfig = {
        title: null,
        parts: drop?.parts.length ? drop.parts : [],
        mentioned_users: drop?.mentioned_users ?? [],
        referenced_nfts: drop?.referenced_nfts ?? [],
        metadata: [],
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
      parts: drop?.parts.length ? drop.parts : [],
      mentioned_users: allMentions,
      referenced_nfts: allNfts,
      metadata: [],
    };
    currentDrop.parts.push({
      content: markdown?.length ? markdown : null,
      quoted_drop: null,
      media: file ? [file] : [],
    });
    setDrop(currentDrop);
    clearInputState();
    return currentDrop;
  };

  const generateMediaForPart = async (
    part: CreateDropPart
  ): Promise<Array<ApiDropMedia>> => {
    if (!part.media.length) {
      return [];
    }

    const media = part.media[0];
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
    return [
      {
        url: prep.media_url,
        mime_type: prep.content_type,
      },
    ];
  };

  const generatePart = async (
    part: CreateDropPart
  ): Promise<CreateDropRequestPart> => {
    return {
      ...part,
      media: await generateMediaForPart(part),
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

  const getOptimisticDrop = (
    dropRequest: ApiCreateDropRequest
  ): ApiDrop | null => {
    if (!connectedProfile?.profile) {
      return null;
    }

    return {
      id: getOptimisticDropId(),
      serial_no: Math.floor(Math.random() * (1000000 - 100000) + 100000),
      wave: originalDrop.wave,
      reply_to: {
        drop_id: originalDrop.id,
        drop_part_id: dropPart.part_id,
        is_deleted: false,
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
      drop_type: ApiDropType.Chat,
      rank: null,
    };
  };

  const onDrop = async (): Promise<void> => {
    const currentDrop = onDropPart();
    setLoading(true);
    const { success } = await requestAuth();
    if (!success) {
      setLoading(false);
      return;
    }

    const parts = await generateParts({ parts: currentDrop.parts });
    if (!parts.length) {
      setLoading(false);
      return;
    }

    const requestBody: ApiCreateDropRequest = {
      wave_id: originalDrop.wave.id,
      reply_to: {
        drop_id: originalDrop.id,
        drop_part_id: dropPart.part_id,
      },
      title: currentDrop.title,
      parts,
      referenced_nfts: currentDrop.referenced_nfts,
      mentioned_users: currentDrop.mentioned_users,
      metadata: currentDrop.metadata,
    };
    const optimisticDrop = getOptimisticDrop(requestBody);
    if (optimisticDrop) {
      addOptimisticDrop({ drop: optimisticDrop });
    }
    await addReplyMutation.mutateAsync(requestBody);
  };

  return (
    <div className="tw-flex tw-items-start tw-gap-x-3 tw-w-full tw-px-4 tw-pb-2 tw-pt-2">
      <DropReplyInput
        ref={dropReplyInputRef}
        waveId={originalDrop.wave.id}
        editorState={editorState}
        drop={drop}
        canSubmit={canSubmit}
        onDrop={onDrop}
        onEditorState={setEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={setFile}>
        <PrimaryButton onClick={onDrop} disabled={!canSubmit} loading={loading}>
          Reply
        </PrimaryButton>
      </DropReplyInput>
    </div>
  );
}
