import { useEffect, useState } from "react";
import CreateDropCompact from "../compact/CreateDropCompact";

import CreateDropFull from "../full/CreateDropFull";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { EditorState } from "lexical";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { createBreakpoint } from "react-use";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { CreateDropType, CreateDropViewType } from "../CreateDrop";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export enum CreateDropScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function CreateDropWrapper({
  profile,
  quotedDropId,
  type,
  loading,
  title,
  metadata,
  mentionedUsers,
  referencedNfts,
  drop,
  viewType,
  setViewType,
  setDrop,
  setMentionedUsers,
  setReferencedNfts,
  setTitle,
  setMetadata,
  onSubmitDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly quotedDropId: string | null;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly title: string | null;
  readonly metadata: DropMetadata[];
  readonly mentionedUsers: Omit<MentionedUser, "current_handle">[];
  readonly referencedNfts: ReferencedNft[];
  readonly drop: CreateDropConfig | null;
  readonly viewType: CreateDropViewType;
  readonly setViewType: (newV: CreateDropViewType) => void;
  readonly setDrop: (newV: CreateDropConfig) => void;
  readonly setMentionedUsers: (
    newV: Omit<MentionedUser, "current_handle">[]
  ) => void;
  readonly setReferencedNfts: (newV: ReferencedNft[]) => void;
  readonly setTitle: (newV: string | null) => void;
  readonly setMetadata: (newV: DropMetadata[]) => void;
  readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
}) {
  const breakpoint = useBreakpoint();
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

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [file, setFile] = useState<File | null>(null);

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

  const onMentionedUser = (newUser: Omit<MentionedUser, "current_handle">) => {
    setMentionedUsers([
      ...mentionedUsers.filter(
        (i) => i.mentioned_profile_id !== newUser.mentioned_profile_id
      ),
      newUser,
    ]);
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
      ])
    ) ?? null;

  const getCanSubmit = () => !!getMarkdown() || !!file;
  const [canSubmit, setCanSubmit] = useState(getCanSubmit());

  useEffect(() => setCanSubmit(getCanSubmit()), [editorState, file]);

  const onDropPart = () => {
    const markdown = getMarkdown();
    const mentions = mentionedUsers.filter((user) =>
      markdown?.includes(`@[${user.handle_in_content}]`)
    );

    const partMentions = mentions.map((mention) => ({
      ...mention,
      current_handle: mention.handle_in_content,
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
      title,
      parts: drop?.parts.length ? drop.parts : [],
      mentioned_users: allMentions,
      referenced_nfts: allNfts,
      metadata,
    };

    currentDrop.parts.push({
      content: markdown,
      quoted_drop: quotedDropId
        ? { drop_id: quotedDropId, drop_part_id: 1 }
        : null,
      media: file ? [file] : [],
    });

    console.log(currentDrop);
    setDrop(currentDrop);
  };

  const onDrop = () => {
    console.log(drop);
    // onSubmitDrop(drop);
  };

  const components: Record<CreateDropViewType, JSX.Element> = {
    [CreateDropViewType.COMPACT]: (
      <CreateDropCompact
        profile={profile}
        screenType={screenType}
        editorState={editorState}
        file={file}
        title={title}
        metadata={metadata}
        disabled={!canSubmit}
        loading={loading}
        type={type}
        onViewChange={setViewType}
        onMetadataRemove={onMetadataRemove}
        onEditorState={setEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={setFile}
        onDrop={onDrop}
      />
    ),
    [CreateDropViewType.FULL]: (
      <CreateDropFull
        screenType={screenType}
        profile={profile}
        title={title}
        metadata={metadata}
        editorState={editorState}
        file={file}
        disabled={!canSubmit}
        loading={loading}
        type={type}
        onTitle={setTitle}
        onMetadataEdit={onMetadataEdit}
        onMetadataRemove={onMetadataRemove}
        onViewChange={setViewType}
        onEditorState={setEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
        onFileChange={setFile}
        onDrop={onDrop}
        onDropPart={onDropPart}
      />
    ),
  };

  const getClasses = () => {
    switch (type) {
      case CreateDropType.DROP:
        return "tw-mt-2 lg:tw-mt-4";
      case CreateDropType.QUOTE:
        return "";
      default:
        assertUnreachable(type);
        return "";
    }
  };

  return (
    <div className={getClasses()}>
      <CommonAnimationHeight>{components[viewType]}</CommonAnimationHeight>
    </div>
  );
}
