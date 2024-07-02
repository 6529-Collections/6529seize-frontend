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
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { CreateDropType, CreateDropViewType } from "./CreateDrop";
import { IProfileAndConsolidations } from "../../../entities/IProfile";

export interface DropEditorHandles {
  requestDrop: () => CreateDropConfig | null;
}

const DropEditor = forwardRef<
  DropEditorHandles,
  {
    readonly profile: IProfileAndConsolidations;
    readonly quotedDrop: {
      dropId: string;
      partId: number;
    } | null;
    readonly isClient?: boolean;
    readonly type: CreateDropType;
    readonly loading: boolean;
    readonly dropEditorRefreshKey: number;
    readonly showSubmit?: boolean;
    readonly showDropError?: boolean;
    readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
    readonly onCanSubmitChange?: (canSubmit: boolean) => void;
  }
>(
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

    const createDropWrapperRef = useRef<CreateDropWrapperHandles | null>(null);
    const requestDrop = (): CreateDropConfig | null =>
      createDropWrapperRef.current?.requestDrop() ?? null;

    useImperativeHandle(ref, () => ({
      requestDrop,
    }));

    if (!init) {
      return null;
    }
    return (
      <div>
        <CreateDropWrapper
          ref={createDropWrapperRef}
          profile={profile}
          quotedDrop={quotedDrop}
          type={type}
          loading={loading}
          title={title}
          metadata={metadata}
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          drop={drop}
          viewType={viewType}
          showSubmit={showSubmit}
          showDropError={showDropError}
          setViewType={setViewType}
          setDrop={setDrop}
          setMentionedUsers={setMentionedUsers}
          setReferencedNfts={setReferencedNfts}
          setTitle={setTitle}
          setMetadata={setMetadata}
          onSubmitDrop={onSubmitDrop}
          onCanSubmitChange={onCanSubmitChange}
          key={dropEditorRefreshKey}
        />
      </div>
    );
  }
);

DropEditor.displayName = "DropEditor";
export default DropEditor;
