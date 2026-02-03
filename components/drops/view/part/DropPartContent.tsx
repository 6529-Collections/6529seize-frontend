import React from "react";
import DropPartMarkdown from "./DropPartMarkdown";
import DropListItemContentMedia from "../item/content/media/DropListItemContentMedia";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { MentionedWave } from "@/entities/IDrop";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";

interface DropPartContentProps {
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedWaves: MentionedWave[];
  readonly referencedNfts: ApiDropReferencedNFT[];
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: any) => void;
  readonly partMedias: Array<{
    mimeType: string;
    mediaSrc: string;
  }>;
  readonly currentPartCount: number;
}

const DropPartContent: React.FC<DropPartContentProps> = ({
  mentionedUsers,
  mentionedWaves,
  referencedNfts,
  partContent,
  onQuoteClick,
  partMedias,
  currentPartCount,
}) => {
  return (
    <div className="tw-h-full tw-w-full">
      <div className="tw-group">
        <DropPartMarkdown
          mentionedUsers={mentionedUsers}
          mentionedWaves={mentionedWaves}
          referencedNfts={referencedNfts}
          partContent={partContent}
          onQuoteClick={onQuoteClick}
        />
      </div>
      {!!partMedias.length && (
        <div className={`${partContent ? "tw-mt-4" : "tw-mt-1"} tw-space-y-2`}>
          {partMedias.map((media, i) => (
            <div
              key={`part-${currentPartCount}-media-${i}-${media.mediaSrc}`}
              className="tw-h-64"
            >
              <DropListItemContentMedia
                media_mime_type={media.mimeType}
                media_url={media.mediaSrc}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropPartContent;
