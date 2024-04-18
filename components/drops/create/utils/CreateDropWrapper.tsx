import { useEffect, useState } from "react";
import CreateDropCompact from "../compact/CreateDropCompact";

import CreateDropFull from "../full/CreateDropFull";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { EditorState } from "lexical";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { createBreakpoint } from "react-use";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { CreateDropType, DropRequest } from "../CreateDrop";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import CommonAnimationHeight from "../../../utils/animation/CommonAnimationHeight";

export enum CreateDropViewType {
  COMPACT = "COMPACT",
  FULL = "FULL",
}

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
  onSubmitDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly quotedDropId: number | null;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly onSubmitDrop: (dropRequest: DropRequest) => void;
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
  const [viewType, setViewType] = useState<CreateDropViewType>(
    CreateDropViewType.COMPACT
  );

  const [editorState, setEditorState] = useState<EditorState | null>(null);

  const [title, setTitle] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DropMetadata[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);

  const onMetadataEdit = ({ data_key, data_value }: DropMetadata) => {
    const index = metadata.findIndex((m) => m.data_key === data_key);
    if (index === -1) {
      setMetadata((prev) => [...prev, { data_key, data_value }]);
    } else {
      setMetadata((prev) => {
        const newMetadata = [...prev];
        newMetadata[index] = { data_key, data_value };
        return newMetadata;
      });
    }
  };

  const onMetadataRemove = (data_key: string) => {
    setMetadata((prev) => prev.filter((m) => m.data_key !== data_key));
  };

  const onMentionedUser = (newUser: MentionedUser) => {
    setMentionedUsers((prev) => [
      ...prev.filter(
        (i) => i.mentioned_profile_id !== newUser.mentioned_profile_id
      ),
      newUser,
    ]);
  };

  const onReferencedNft = (newNft: ReferencedNft) => {
    setReferencedNfts((prev) => [
      ...prev.filter(
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

  const onDrop = () => {
    const markdown = getMarkdown();
    const mentions = mentionedUsers.filter((user) =>
      markdown?.includes(`@[${user.handle_in_content}]`)
    );
    const nfts = referencedNfts.filter((nft) =>
      markdown?.includes(`#[${nft.name}]`)
    );

    const drop: DropRequest = {
      title,
      content: markdown,
      stormId: null,
      quotedDropId,
      mentionedUsers: mentions,
      referencedNfts: nfts,
      metadata,
      file,
    };
    onSubmitDrop(drop);
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
