import { useEffect, useState } from "react";

import { createBreakpoint } from "react-use";
import CreateDropDesktop from "./desktop/CreateDropDesktop";
import CreateDropMobile from "./mobile/CreateDropMobile";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { EditorState } from "lexical";
import { MentionedUser, ReferencedNft } from "../../../entities/IDrop";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export enum CreateDropViewType {
  COMPACT = "COMPACT",
  FULL = "FULL",
}

export enum CreateDropScreenType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

export default function CreateDrop({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [init, setInit] = useState(false);
  useEffect(() => setInit(true), []);

  const breakpoint = useBreakpoint();
  const [screenType, setScreenType] = useState<CreateDropScreenType>(
    CreateDropScreenType.MOBILE
  );
  const [viewType, setViewType] = useState<CreateDropViewType>(
    CreateDropViewType.FULL
  );

  useEffect(() => {
    if (breakpoint === "LG") {
      setScreenType(CreateDropScreenType.DESKTOP);
    } else {
      setScreenType(CreateDropScreenType.MOBILE);
    }
  }, [breakpoint]);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);

  const onMentionedUser = (newUser: MentionedUser) => {
    const isAdded = mentionedUsers.some(
      (mentionedUser) =>
        mentionedUser.mentioned_profile_id === newUser.mentioned_profile_id
    );
    if (!isAdded) {
      setMentionedUsers((prev) => [...prev, newUser]);
    }
  };

  const onReferencedNft = (newNft: ReferencedNft) => {
    const isAdded = referencedNfts.some(
      (nft) =>
        nft.tokenId === newNft.tokenId && nft.contract === newNft.contract
    );
    if (!isAdded) {
      setReferencedNfts((prev) => [...prev, newNft]);
    }
  };

  const onViewType = (newV: CreateDropViewType) => {
    setTitle(null);
    setViewType(newV);
  };

  const components: Record<CreateDropScreenType, JSX.Element> = {
    [CreateDropScreenType.DESKTOP]: (
      <CreateDropDesktop
        viewType={viewType}
        profile={profile}
        title={title}
        editorState={editorState}
        onViewType={onViewType}
        onTitle={setTitle}
        onEditorState={setEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
    [CreateDropScreenType.MOBILE]: (
      <CreateDropMobile
        viewType={viewType}
        profile={profile}
        title={title}
        editorState={editorState}
        onViewType={onViewType}
        onTitle={setTitle}
        onEditorState={setEditorState}
        onMentionedUser={onMentionedUser}
        onReferencedNft={onReferencedNft}
      />
    ),
  };

  if (!init) {
    return null;
  }

  return <div>{components[screenType]}</div>;
}
