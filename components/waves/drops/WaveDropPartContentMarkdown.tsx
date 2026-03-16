import { useDropLinkPreviewToggleControl } from "@/components/waves/drops/useDropLinkPreviewToggleControl";
import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import React from "react";
import EditDropLexical from "./EditDropLexical";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";

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
  readonly onLinkCardActionsActiveChange?:
    | ((href: string, active: boolean) => void)
    | undefined;
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
  onLinkCardActionsActiveChange,
}) => {
  const linkPreviewToggleControl = useDropLinkPreviewToggleControl(drop);
  const currentQuotePath =
    drop?.serial_no === undefined ? [] : [`${wave.id}:${drop.serial_no}`];

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
          nftLinks={drop?.nft_links}
          partContent={part.content}
          onQuoteClick={onQuoteClick}
          currentDropId={drop?.id}
          hideLinkPreviews={drop?.hide_link_preview}
          quotePath={currentQuotePath}
          linkPreviewToggleControl={linkPreviewToggleControl}
          onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
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
            embedDepth={1}
            onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
          />
        </div>
      )}
    </>
  );
};

export default WaveDropPartContentMarkdown;
