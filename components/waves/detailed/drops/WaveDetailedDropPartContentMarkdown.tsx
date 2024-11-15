import React from "react";
import {
  ApiDropPart,
  ApiDropReferencedNFT,
  ApiWaveMin,
} from "../../../../generated/models/ObjectSerializer";
import { ApiDropMentionedUser } from "../../../../generated/models/ObjectSerializer";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import DropPartMarkdownWithPropLogger from "../../../drops/view/part/DropPartMarkdownWithPropLogger";
import WaveDetailedDropQuoteWithDropId from "./WaveDetailedDropQuoteWithDropId";

interface WaveDetailedDropPartContentMarkdownProps {
  readonly mentionedUsers: Array<ApiDropMentionedUser>;
  readonly referencedNfts: Array<ApiDropReferencedNFT>;
  readonly part: ApiDropPart;
  readonly wave: ApiWaveMin;
  readonly onQuoteClick: (drop: ApiDrop) => void;
}

const WaveDetailedDropPartContentMarkdown: React.FC<
  WaveDetailedDropPartContentMarkdownProps
> = ({ mentionedUsers, referencedNfts, part, wave, onQuoteClick }) => {
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
          <WaveDetailedDropQuoteWithDropId
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

export default WaveDetailedDropPartContentMarkdown;
