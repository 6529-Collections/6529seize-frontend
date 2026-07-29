"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  CreateDropScreenType,
  CreateDropWrapperHandles,
} from "./utils/CreateDropWrapper";
import CreateDropWrapper from "./utils/CreateDropWrapper";
import type {
  CreateDropConfig,
  CreateDropPart,
  DropMetadata,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import type { CreateDropType } from "./types";
import { CreateDropViewType } from "./types";
import CreateDropStormView from "./utils/storm/CreateDropStormView";
import type { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";

export interface DropEditorHandles {
  requestDrop: () => CreateDropConfig | null;
  getDropSnapshot: () => CreateDropConfig | null;
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
  readonly isClient?: boolean | undefined;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly dropEditorRefreshKey: number;
  readonly showSubmit?: boolean | undefined;
  readonly submitOnEnter?: boolean | undefined;
  readonly showDropError?: boolean | undefined;
  readonly wave: DropEditorWaveProps | null;
  readonly waveId: string | null;
  /** Pins the composer rendering branch; see CreateDropWrapper. */
  readonly forceScreenType?: CreateDropScreenType | undefined;
  readonly onSubmitDrop: (dropRequest: CreateDropConfig) => void;
  readonly onCanSubmitChange?:
    | ((canSubmit: boolean) => void)
    | undefined
    | undefined;
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
      submitOnEnter = true,
      showDropError = false,
      wave,
      waveId,
      forceScreenType,
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
    const [mentionedWaves, setMentionedWaves] = useState<MentionedWave[]>([]);
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
    const onMentionedWave = (newWave: MentionedWave) => {
      setMentionedWaves((curr) => {
        return [...curr, newWave];
      });
    };

    useEffect(() => {
      setTitle(null);
      setMetadata([]);
      setMentionedUsers([]);
      setMentionedWaves([]);
      setReferencedNfts([]);
      setDrop(null);
      setViewType(CreateDropViewType.COMPACT);
    }, [dropEditorRefreshKey]);

    const createDropWrapperRef = useRef<CreateDropWrapperHandles | null>(null);
    const requestDrop = (): CreateDropConfig | null =>
      createDropWrapperRef.current?.requestDrop() ?? null;
    const getDropSnapshot = (): CreateDropConfig | null =>
      createDropWrapperRef.current?.getDropSnapshot() ?? null;

    useImperativeHandle(ref, () => ({
      getDropSnapshot,
      requestDrop,
    }));

    const onRemovePart = (index: number) => {
      if (loading) {
        return;
      }
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
          quotedDrop={quotedDrop}
          type={type}
          waveId={waveId}
          loading={loading}
          title={title}
          metadata={metadata}
          mentionedUsers={mentionedUsers}
          mentionedWaves={mentionedWaves}
          referencedNfts={referencedNfts}
          drop={drop}
          viewType={viewType}
          showSubmit={showSubmit}
          submitOnEnter={submitOnEnter}
          showDropError={showDropError}
          forceScreenType={forceScreenType}
          wave={wave}
          setIsStormMode={setIsStormMode}
          setViewType={setViewType}
          setDrop={setDrop}
          onMentionedUser={onMentionedUser}
          onMentionedWave={onMentionedWave}
          setReferencedNfts={setReferencedNfts}
          setTitle={setTitle}
          setMetadata={setMetadata}
          onSubmitDrop={onSubmitDrop}
          onCanSubmitChange={onCanSubmitChange}
          key={dropEditorRefreshKey}
        >
          {drop !== null && drop.parts.length > 0 && isStormMode ? (
            <CreateDropStormView
              drop={drop}
              profile={profile}
              wave={wave}
              disabled={loading}
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
