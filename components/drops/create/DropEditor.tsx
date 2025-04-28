import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import CreateDropWrapper, {
  CreateDropWrapperHandles,
} from "./utils/CreateDropWrapper";
import {
  CreateDropConfig,
  CreateDropPart,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { CreateDropType, CreateDropViewType } from "./types";
import CreateDropStormView from "./utils/storm/CreateDropStormView";
import { ProfileMinWithoutSubs } from "../../../helpers/ProfileTypes";

export interface DropEditorHandles {
  requestDrop: () => CreateDropConfig | null;
}

interface DropEditorWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface DropEditorProps {
  readonly profile: ProfileMinWithoutSubs;
  readonly quotedDrop: {
    readonly dropId: string;
    readonly partId: number;
  } | null;
  readonly isClient?: boolean;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly dropEditorRefreshKey: number;
  readonly showSubmit?: boolean;
  readonly showDropError?: boolean;
  readonly showProfile?: boolean;
  readonly wave: DropEditorWaveProps | null;
  readonly waveId: string | null;
  readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
  readonly onCanSubmitChange?: (canSubmit: boolean) => void;
}

const DropEditor = forwardRef<DropEditorHandles, DropEditorProps>(
  (
    {
      profile,
      quotedDrop,
      isClient = false,
      type,
      loading,
      dropEditorRefreshKey,
      showSubmit = true,
      showDropError = false,
      showProfile = true,
      wave,
      waveId,
      onSubmitDrop,
      onCanSubmitChange,
    },
    ref
  ) => {
    const [init, setInit] = useState(isClient);
    useEffect(() => setInit(true), []);

    const [title, setTitle] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<DropMetadata[]>([]);
    const [mentionedUsers, setMentionedUsers] = useState<
      Omit<MentionedUser, "current_handle">[]
    >([]);
    const [referencedNfts, setReferencedNfts] = useState<ReferencedNft[]>([]);
    const [drop, setDrop] = useState<CreateDropConfig | null>(null);
    const [viewType, setViewType] = useState<CreateDropViewType>(
      CreateDropViewType.COMPACT
    );

    const [isStormMode, setIsStormMode] = useState(false);

    const onMentionedUser = (
      newUser: Omit<MentionedUser, "current_handle">
    ) => {
      setMentionedUsers((curr) => {
        return [...curr, newUser];
      });
    };

    useEffect(() => {
      setTitle(null);
      setMetadata([]);
      setMentionedUsers([]);
      setReferencedNfts([]);
      setDrop(null);
      setViewType(CreateDropViewType.COMPACT);
    }, [dropEditorRefreshKey]);

    const createDropWrapperRef = useRef<CreateDropWrapperHandles | null>(null);
    const requestDrop = (): CreateDropConfig | null =>
      createDropWrapperRef.current?.requestDrop() ?? null;

    useImperativeHandle(ref, () => ({
      requestDrop,
    }));

    const onRemovePart = (index: number) => {
      if (!drop?.parts.length) {
        return;
      }
      const updatedParts: CreateDropPart[] = [...drop.parts];

      updatedParts.splice(index, 1);
      setDrop({
        ...drop,
        parts: updatedParts,
      });
    };

    if (!init) {
      return null;
    }

    return (
      <div>
        <CreateDropWrapper
          ref={createDropWrapperRef}
          profile={profile}
          quotedDrop={quotedDrop}
          showProfile={showProfile}
          type={type}
          waveId={waveId}
          loading={loading}
          title={title}
          metadata={metadata}
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          drop={drop}
          viewType={viewType}
          showSubmit={showSubmit}
          showDropError={showDropError}
          wave={wave}
          setIsStormMode={setIsStormMode}
          setViewType={setViewType}
          setDrop={setDrop}
          setMentionedUsers={setMentionedUsers}
          onMentionedUser={onMentionedUser}
          setReferencedNfts={setReferencedNfts}
          setTitle={setTitle}
          setMetadata={setMetadata}
          onSubmitDrop={onSubmitDrop}
          onCanSubmitChange={onCanSubmitChange}
          key={dropEditorRefreshKey}
        >
          {!!drop?.parts.length && isStormMode && !loading ? (
            <CreateDropStormView
              drop={drop}
              profile={profile}
              wave={wave}
              removePart={onRemovePart}
            />
          ) : null}
        </CreateDropWrapper>
      </div>
    );
  }
);

DropEditor.displayName = "DropEditor";
export default DropEditor;
