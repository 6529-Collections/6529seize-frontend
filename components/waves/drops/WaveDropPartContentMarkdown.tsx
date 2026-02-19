import { AuthContext, useAuth } from "@/components/auth/Auth";
import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import type { LinkPreviewToggleControl } from "@/components/waves/LinkPreviewContext";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import EditDropLexical from "./EditDropLexical";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-z0-9]{1,6}\b([-a-z0-9@:%_+.~#?&=/]*)/gi;

function dropHasLinks(parts: readonly ApiDropPart[] | undefined): boolean {
  const safeParts = Array.isArray(parts) ? parts : [];
  for (const dropPart of safeParts) {
    if (dropPart.content && URL_REGEX.test(dropPart.content)) {
      URL_REGEX.lastIndex = 0;
      return true;
    }
    URL_REGEX.lastIndex = 0;
  }

  return false;
}

interface WaveDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedWaves: Array<ApiMentionedWave>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly part: ApiDropPart;
  readonly wave: ApiWaveMin;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isEditing?: boolean | undefined;
  readonly isSaving?: boolean | undefined;
  readonly onSave?:
    | ((
        newContent: string,
        mentions?: ApiDropMentionedUser[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly drop?: ApiDrop | undefined; // Add drop to check for edited status
  readonly marketplaceImageOnly?: boolean | undefined;
}

const WaveDropPartContentMarkdown: React.FC<
  WaveDropPartContentMarkdownProps
> = ({
  mentionedUsers,
  mentionedWaves,
  referencedNfts,
  part,
  wave,
  onQuoteClick,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  drop,
  marketplaceImageOnly = false,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { setToast } = useAuth();
  const myStream = useMyStreamOptional();
  const applyOptimisticDropUpdate = myStream?.applyOptimisticDropUpdate;
  const [isLinkPreviewToggleLoading, setIsLinkPreviewToggleLoading] =
    useState(false);
  const dropId = drop?.id;
  const dropWaveId = drop?.wave.id;
  const dropAuthorHandle = drop?.author.handle;
  const dropParts = drop?.parts;
  const currentQuotePath =
    drop?.serial_no === undefined ? [] : [`${wave.id}:${drop.serial_no}`];
  const isAuthor =
    connectedProfile?.handle === dropAuthorHandle && !activeProfileProxy;
  const hasLinks = useMemo(() => dropHasLinks(dropParts), [dropParts]);
  const previewsHidden = drop?.hide_link_preview ?? false;
  const isTemporaryDrop = dropId?.startsWith("temp-") ?? false;
  const canToggle = Boolean(dropId && dropWaveId && !isTemporaryDrop);
  const toggleRuntimeRef = useRef({
    dropId,
    dropWaveId,
    canToggle,
    applyOptimisticDropUpdate,
    setToast,
  });
  const isToggleInFlightRef = useRef(false);

  useEffect(() => {
    toggleRuntimeRef.current = {
      dropId,
      dropWaveId,
      canToggle,
      applyOptimisticDropUpdate,
      setToast,
    };
  }, [dropId, dropWaveId, canToggle, applyOptimisticDropUpdate, setToast]);

  const handleToggleLinkPreviews = useCallback(async () => {
    const {
      dropId: currentDropId,
      dropWaveId: currentDropWaveId,
      canToggle: currentCanToggle,
      applyOptimisticDropUpdate: currentApplyOptimisticDropUpdate,
      setToast: currentSetToast,
    } = toggleRuntimeRef.current;

    if (
      !currentDropId ||
      !currentDropWaveId ||
      !currentCanToggle ||
      isToggleInFlightRef.current
    ) {
      return;
    }

    isToggleInFlightRef.current = true;
    setIsLinkPreviewToggleLoading(true);

    const rollbackHandle = currentApplyOptimisticDropUpdate?.({
      waveId: currentDropWaveId,
      dropId: currentDropId,
      update: (draft) => {
        if (draft.type !== DropSize.FULL) {
          return draft;
        }

        draft.hide_link_preview = !draft.hide_link_preview;
        return draft;
      },
    });

    try {
      await commonApiPost<Record<string, never>, ApiDrop>({
        endpoint: `drops/${currentDropId}/toggle-hide-link-preview`,
        body: {},
      });
    } catch (error) {
      rollbackHandle?.rollback();
      currentSetToast({
        message:
          typeof error === "string" ? error : "Failed to toggle link preview",
        type: "error",
      });
    } finally {
      isToggleInFlightRef.current = false;
      setIsLinkPreviewToggleLoading(false);
    }
  }, []);

  const onToggleLinkPreviews = useCallback(() => {
    void handleToggleLinkPreviews();
  }, [handleToggleLinkPreviews]);

  const linkPreviewToggleControl = useMemo<
    LinkPreviewToggleControl | undefined
  >(() => {
    if (!isAuthor || !hasLinks || !dropId) {
      return undefined;
    }

    return {
      canToggle,
      isHidden: previewsHidden,
      isLoading: isLinkPreviewToggleLoading,
      label: previewsHidden ? "Show link previews" : "Hide link previews",
      onToggle: onToggleLinkPreviews,
    };
  }, [
    isAuthor,
    hasLinks,
    dropId,
    canToggle,
    previewsHidden,
    isLinkPreviewToggleLoading,
    onToggleLinkPreviews,
  ]);

  if (isEditing) {
    return (
      <EditDropLexical
        initialContent={part.content ?? ""}
        initialMentions={mentionedUsers}
        initialWaveMentions={mentionedWaves}
        waveId={wave.id}
        isSaving={isSaving}
        onSave={(
          content: string,
          mentions: ApiDropMentionedUser[],
          waves: ApiMentionedWave[]
        ) => {
          if (onSave) {
            onSave(content, mentions, waves);
          }
        }}
        onCancel={() => {
          if (onCancel) {
            onCancel();
          }
        }}
      />
    );
  }

  return (
    <>
      <div>
        <DropPartMarkdownWithPropLogger
          mentionedUsers={mentionedUsers}
          mentionedWaves={mentionedWaves}
          referencedNfts={referencedNfts}
          partContent={part.content}
          onQuoteClick={onQuoteClick}
          currentDropId={drop?.id}
          hideLinkPreviews={drop?.hide_link_preview}
          marketplaceImageOnly={marketplaceImageOnly}
          quotePath={currentQuotePath}
          linkPreviewToggleControl={linkPreviewToggleControl}
        />
        {typeof drop?.updated_at === "number" &&
          drop.updated_at !== drop.created_at && (
            <div className="tw-mt-0.5 tw-text-[10px] tw-font-normal tw-leading-none tw-text-iron-500">
              (edited)
            </div>
          )}
      </div>
      {part.quoted_drop?.drop_id && (
        <div className="tw-mt-1.5">
          <WaveDropQuoteWithDropId
            dropId={part.quoted_drop.drop_id}
            partId={part.quoted_drop.drop_part_id}
            maybeDrop={
              part.quoted_drop.drop
                ? { ...part.quoted_drop.drop, wave: wave }
                : null
            }
            onQuoteClick={onQuoteClick}
            embedPath={drop?.id ? [drop.id] : []}
            quotePath={currentQuotePath}
            marketplaceImageOnly={marketplaceImageOnly}
            embedDepth={1}
          />
        </div>
      )}
    </>
  );
};

export default WaveDropPartContentMarkdown;
