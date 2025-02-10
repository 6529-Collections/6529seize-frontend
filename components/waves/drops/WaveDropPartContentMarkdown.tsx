import React from "react";
import DropPartMarkdownWithPropLogger from "../../drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDropQuoteWithDropId from "./WaveDropQuoteWithDropId";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import { ApiDropReferencedNFT } from "../../../generated/models/ApiDropReferencedNFT";
import { ApiDropPart } from "../../../generated/models/ApiDropPart";
import { ApiWaveMin } from "../../../generated/models/ApiWaveMin";
import { ApiDrop } from "../../../generated/models/ApiDrop";

interface WaveDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly part: ApiDropPart;
  readonly wave: ApiWaveMin;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDropPartContentMarkdown: React.FC<WaveDropPartContentMarkdownProps> = ({
  mentionedUsers,
  referencedNfts,
  part,
  wave,
  onQuoteClick,
}) => {
  return (
    <>
      <DropPartMarkdownWithPropLogger
        mentionedUsers={mentionedUsers}
        referencedNfts={referencedNfts}
        partContent={part.content}
        onQuoteClick={onQuoteClick}
      />
      {part.quoted_drop?.drop_id && (
        <div className="tw-mt-3">
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
