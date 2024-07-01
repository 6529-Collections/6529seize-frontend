import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CreateDropCompact, {
  CreateDropCompactHandles,
} from "../compact/CreateDropCompact";

import CreateDropFull, { CreateDropFullHandles } from "../full/CreateDropFull";
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

export interface CreateDropWrapperHandles {
  requestDrop: () => CreateDropConfig;
}

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const CreateDropWrapper = forwardRef<
  CreateDropWrapperHandles,
  {
    readonly profile: IProfileAndConsolidations;
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
    readonly setViewType: (newV: CreateDropViewType) => void;
    readonly setDrop: (newV: CreateDropConfig) => void;
    readonly setMentionedUsers: (
      newV: Omit<MentionedUser, "current_handle">[]
    ) => void;
    readonly setReferencedNfts: (newV: ReferencedNft[]) => void;
    readonly setTitle: (newV: string | null) => void;
    readonly setMetadata: (newV: DropMetadata[]) => void;
    readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
    readonly onCanSubmitChange?: (canSubmit: boolean) => void;
  }
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
      setViewType,
      setDrop,
      setMentionedUsers,
      setReferencedNfts,
      setTitle,
      setMetadata,
      onSubmitDrop,
      onCanSubmitChange,
    },
    ref
  ) => {
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
    const onMentionedUser = (
      newUser: Omit<MentionedUser, "current_handle">
    ) => {
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
    const getCanSubmit = () =>
      !!getMarkdown() || !!file || !!drop?.parts.length;

    const [canSubmit, setCanSubmit] = useState(getCanSubmit());

    const getCanAddPart = () => !!getMarkdown() || !!file;
    const [canAddPart, setCanAddPart] = useState(getCanAddPart());
    useEffect(() => {
      setCanSubmit(getCanSubmit());
      setCanAddPart(getCanAddPart());
    }, [editorState, file, drop]);

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
      setFile(null);
    };
    const onDropPart = (): CreateDropConfig => {
      const markdown = getMarkdown();
      if (!markdown?.length && !file) {
        const currentDrop: CreateDropConfig = {
          title,
          parts: drop?.parts.length ? drop.parts : [],
          mentioned_users: drop?.mentioned_users ?? [],
          referenced_nfts: drop?.referenced_nfts ?? [],
          metadata,
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
      };
      currentDrop.parts.push({
        content: markdown,
        quoted_drop:
          quotedDrop && !currentDrop.parts.length
            ? {
                drop_id: quotedDrop.dropId,
                drop_part_id: quotedDrop.partId,
              }
            : null,
        media: file ? [file] : [],
      });
      setDrop(currentDrop);
      clearInputState();
      return currentDrop;
    };
    const onDrop = () => {
      const currentDrop = onDropPart();
      onSubmitDrop(currentDrop);
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
          screenType={screenType}
          editorState={editorState}
          file={file}
          title={title}
          metadata={metadata}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          drop={drop}
          loading={loading}
          type={type}
          showSubmit={showSubmit}
          onViewChange={setViewType}
          onMetadataRemove={onMetadataRemove}
          onEditorState={setEditorState}
          onMentionedUser={onMentionedUser}
          onReferencedNft={onReferencedNft}
          onFileChange={setFile}
          onDrop={onDrop}
          onDropPart={onDropPart}
        />
      ),
      [CreateDropViewType.FULL]: (
        <CreateDropFull
          ref={createDropContentFullRef}
          screenType={screenType}
          profile={profile}
          title={title}
          metadata={metadata}
          editorState={editorState}
          file={file}
          canSubmit={canSubmit}
          canAddPart={canAddPart}
          loading={loading}
          type={type}
          drop={drop}
          showSubmit={showSubmit}
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
);

CreateDropWrapper.displayName = "CreateDropWrapper";
export default CreateDropWrapper;
