import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import React from "react";
import { useAuth } from "@/components/auth/Auth";
import QuorumProposalCompactContent from "@/components/waves/quorum/QuorumProposalCompactContent";
import { parseQuorumProposalMarkdown } from "@/components/waves/quorum/quorumProposalMarkdown";
import type { DropContentPresentation } from "./dropContentPresentation";
import EditDropLexical from "./EditDropLexical";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWaveMinWithChatLinkSettings } from "@/helpers/waves/wave.helpers";
import {
  CHAT_LINK_RESTRICTION_MESSAGE,
  areHandlesEqual,
  isChatLinkRestrictionApplicable,
} from "@/helpers/waves/chat-link-restriction.helpers";

interface WaveDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly mentionedGroups?: Array<ApiDropGroupMention> | undefined;
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
        mentionedGroups?: ApiDropGroupMention[],
        mentionedWaves?: ApiMentionedWave[]
      ) => void)
    | undefined;
  readonly onCancel?: (() => void) | undefined;
  readonly drop?: ApiDrop | undefined; // Add drop to check for edited status
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly embedPath?: readonly string[] | undefined;
  readonly quotePath?: readonly string[] | undefined;
  readonly embedDepth?: number | undefined;
  readonly maxEmbedDepth?: number | undefined;
  readonly fullWidthLinkPreviews?: boolean | undefined;
  readonly quorumCompactDetailsVisible?: boolean | undefined;
  readonly onQuorumCompactDetailsVisibleChange?:
    | ((areDetailsVisible: boolean) => void)
    | undefined;
  readonly quorumCompactOpenSectionKeys?: readonly string[] | undefined;
  readonly onQuorumCompactSectionOpenChange?:
    | ((sectionKey: string, isOpen: boolean) => void)
    | undefined;
}

const WaveDropPartContentMarkdown: React.FC<
  WaveDropPartContentMarkdownProps
> = ({
  mentionedUsers,
  mentionedGroups = [],
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
  onLinkCardActionsActiveChange,
  contentPresentation = "default",
  embedPath,
  quotePath,
  embedDepth,
  maxEmbedDepth,
  fullWidthLinkPreviews = false,
  quorumCompactDetailsVisible,
  onQuorumCompactDetailsVisibleChange,
  quorumCompactOpenSectionKeys,
  onQuorumCompactSectionOpenChange,
}) => {
  const { connectedProfile } = useAuth();
  const linkPreviewToggleControl = useDropLinkPreviewToggleControl(drop);
  const dropId = drop?.id;
  const dropSerialNo = drop?.serial_no;
  const waveId = wave.id;
  const currentDropEmbedPath = React.useMemo(() => {
    const path = embedPath ? [...embedPath] : [];
    if (!dropId || path.includes(dropId)) {
      return path;
    }

    return [...path, dropId];
  }, [dropId, embedPath]);
  const currentQuotePath = React.useMemo(() => {
    const path = quotePath ? [...quotePath] : [];
    if (dropSerialNo === undefined) {
      return path;
    }

    const currentQuoteKey = `${waveId}:${dropSerialNo}`;
    if (!path.includes(currentQuoteKey)) {
      path.push(currentQuoteKey);
    }

    return path;
  }, [dropSerialNo, quotePath, waveId]);
  const compactProposal =
    contentPresentation === "quorumCompact"
      ? parseQuorumProposalMarkdown(part.content)
      : null;
  const waveWithLinkSettings = drop?.wave as
    | ApiWaveMinWithChatLinkSettings
    | undefined;
  const editLinkRestrictionApplies = isChatLinkRestrictionApplicable({
    dropType: drop?.drop_type ?? ApiDropType.Chat,
    linksDisabled: waveWithLinkSettings?.links_disabled === true,
    isWaveAdmin: drop?.wave?.authenticated_user_admin === true,
    isWaveCreator: areHandlesEqual(
      connectedProfile?.handle,
      waveWithLinkSettings?.wave_author_handle
    ),
  });

  if (isEditing) {
    return (
      <EditDropLexical
        initialContent={part.content ?? ""}
        initialMentions={mentionedUsers}
        initialGroupMentions={mentionedGroups}
        initialWaveMentions={mentionedWaves}
        canMentionAll={drop?.wave?.authenticated_user_admin === true}
        waveId={wave.id}
        isSaving={isSaving}
        linkRestrictionMessage={
          editLinkRestrictionApplies ? CHAT_LINK_RESTRICTION_MESSAGE : null
        }
        onSave={(
          content: string,
          mentions: ApiDropMentionedUser[],
          groups: ApiDropGroupMention[],
          waves: ApiMentionedWave[]
        ) => {
          if (onSave) {
            onSave(content, mentions, groups, waves);
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
        {compactProposal ? (
          <QuorumProposalCompactContent
            proposal={compactProposal}
            mentionedUsers={mentionedUsers}
            mentionedGroups={mentionedGroups}
            mentionedWaves={mentionedWaves}
            referencedNfts={referencedNfts}
            nftLinks={drop?.nft_links}
            onQuoteClick={onQuoteClick}
            currentDropId={drop?.id}
            hideLinkPreviews={drop?.hide_link_preview}
            embedPath={currentDropEmbedPath}
            quotePath={currentQuotePath}
            embedDepth={embedDepth}
            maxEmbedDepth={maxEmbedDepth}
            fullWidthLinkPreviews={fullWidthLinkPreviews}
            linkPreviewToggleControl={linkPreviewToggleControl}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
            areDetailsVisible={quorumCompactDetailsVisible}
            onDetailsVisibleChange={onQuorumCompactDetailsVisibleChange}
            openSectionKeys={quorumCompactOpenSectionKeys}
            onSectionOpenChange={onQuorumCompactSectionOpenChange}
          />
        ) : (
          <DropPartMarkdownWithPropLogger
            mentionedUsers={mentionedUsers}
            mentionedGroups={mentionedGroups}
            mentionedWaves={mentionedWaves}
            referencedNfts={referencedNfts}
            nftLinks={drop?.nft_links}
            partContent={part.content}
            onQuoteClick={onQuoteClick}
            currentDropId={drop?.id}
            hideLinkPreviews={drop?.hide_link_preview}
            embedPath={currentDropEmbedPath}
            quotePath={currentQuotePath}
            embedDepth={embedDepth}
            maxEmbedDepth={maxEmbedDepth}
            fullWidthLinkPreviews={fullWidthLinkPreviews}
            linkPreviewToggleControl={linkPreviewToggleControl}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
          />
        )}
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
            waveId={wave.id}
            onQuoteClick={onQuoteClick}
            embedPath={currentDropEmbedPath}
            quotePath={currentQuotePath}
            embedDepth={(embedDepth ?? 0) + 1}
            maxEmbedDepth={maxEmbedDepth}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
          />
        </div>
      )}
    </>
  );
};

export default WaveDropPartContentMarkdown;
