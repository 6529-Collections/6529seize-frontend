import { useEffect, useState } from "react";

import { createBreakpoint } from "react-use";
import CreateDropDesktop from "./desktop/CreateDropDesktop";
import CreateDropMobile from "./mobile/CreateDropMobile";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { EditorState } from "lexical";
import { MentionedUser, ReferencedNft } from "../../../entities/IDrop";
import CreateDropCompact from "./compact/CreateDropCompact";
import CreateDropFull from "./full/CreateDropFull";
import CreateDropWrapper from "./CreateDropWrapper";

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
  const [title, setTitle] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<
    {
      readonly key: string;
      readonly value: string;
    }[]
  >([]);
  const [file, setFile] = useState<File | null>(null);
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
    setMetadata([]);
    setViewType(newV);
  };

  const onMetadata = ({ key, value }: { key: string; value: string }) => {
    const index = metadata.findIndex((m) => m.key === key);
    if (index === -1) {
      setMetadata((prev) => [...prev, { key, value }]);
    } else {
      setMetadata((prev) => {
        const newMetadata = [...prev];
        newMetadata[index] = { key, value };
        return newMetadata;
      });
    }
  };

  const onMetadataRemove = (key: string) => {
    setMetadata((prev) => prev.filter((m) => m.key !== key));
  };

  // const components: Record<CreateDropScreenType, JSX.Element> = {
  //   [CreateDropScreenType.DESKTOP]: (
  //     <CreateDropDesktop
  //       viewType={viewType}
  //       profile={profile}
  //       title={title}
  //       metadata={metadata}
  //       editorState={editorState}
  //       onViewType={onViewType}
  //       onTitle={setTitle}
  //       onMetadataEdit={onMetadata}
  //       onMetadataRemove={onMetadataRemove}
  //       onEditorState={setEditorState}
  //       onMentionedUser={onMentionedUser}
  //       onReferencedNft={onReferencedNft}
  //       onFileChange={setFile}
  //     />
  //   ),
  //   [CreateDropScreenType.MOBILE]: (
  //     <CreateDropMobile
  //       viewType={viewType}
  //       profile={profile}
  //       title={title}
  //       metadata={metadata}
  //       editorState={editorState}
  //       onViewType={onViewType}
  //       onTitle={setTitle}
  //       onMetadataEdit={onMetadata}
  //       onMetadataRemove={onMetadataRemove}
  //       onFileChange={setFile}
  //       onEditorState={setEditorState}
  //       onMentionedUser={onMentionedUser}
  //       onReferencedNft={onReferencedNft}
  //     />
  //   ),
  // };



  if (!init) {
    return null;
  }

  return <CreateDropWrapper />;
}
