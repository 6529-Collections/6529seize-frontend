import React from "react";
import DropPartMarkdown from "./DropPartMarkdown";
import DropListItemContentMedia from "../item/content/media/DropListItemContentMedia";

interface DropPartContentProps {
  readonly mentionedUsers: any[];
  readonly referencedNfts: any[];
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
          referencedNfts={referencedNfts}
          partContent={partContent}
          onQuoteClick={onQuoteClick}
        />
      </div>
      {!!partMedias.length && (
        <div className={`${partContent ? "tw-mt-4" : "tw-mt-1"} tw-space-y-2`}>
          {partMedias.map((media, i) => (
           <div key={`part-${currentPartCount}-media-${i}-${media.mediaSrc}`} className="tw-h-80">
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
