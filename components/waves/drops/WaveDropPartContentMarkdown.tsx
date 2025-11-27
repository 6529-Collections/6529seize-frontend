import React from "react";
import DropPartMarkdownWithPropLogger from "@/components/drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";
import EditDropLexical from "./EditDropLexical";
import { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import { ApiDropPart } from "@/generated/models/ApiDropPart";
import { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { ApiDrop } from "@/generated/models/ApiDrop";

interface WaveDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly part: ApiDropPart;
  readonly wave: ApiWaveMin;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isEditing?: boolean;
  readonly isSaving?: boolean;
  readonly onSave?: (newContent: string, mentions?: ApiDropMentionedUser[]) => void;
  readonly onCancel?: () => void;
  readonly drop?: ApiDrop; // Add drop to check for edited status
}

const WaveDropPartContentMarkdown: React.FC<
  WaveDropPartContentMarkdownProps
> = ({
  mentionedUsers,
  referencedNfts,
  part,
  wave,
  onQuoteClick,
  isEditing = false,
  isSaving = false,
  onSave,
  onCancel,
  drop,
}) => {
  if (isEditing) {
    return (
      <EditDropLexical
        initialContent={part.content ?? ""}
        initialMentions={mentionedUsers}
        waveId={wave.id}
        isSaving={isSaving}
        onSave={(content: string, mentions: ApiDropMentionedUser[]) => {
          if (onSave) {
            onSave(content, mentions);
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
          referencedNfts={referencedNfts}
          partContent={part.content}
          onQuoteClick={onQuoteClick}
          currentDropId={drop?.id}
        />
        {drop?.updated_at && drop.updated_at !== drop.created_at && (
          <div className="tw-text-[10px] tw-leading-none tw-text-iron-500 tw-font-normal tw-mt-0.5">
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
          />
        </div>
      )}
    </>
  );
};

export default WaveDropPartContentMarkdown;
