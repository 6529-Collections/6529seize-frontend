"use client";

import React, { useMemo } from "react";
import DropPartMarkdown from "./DropPartMarkdown";
import DropListItemContentMedia from "../item/content/media/DropListItemContentMedia";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { MentionedWave } from "@/entities/IDrop";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";
import { DropImageGalleryProvider } from "./DropImageGalleryProvider";
import {
  buildDropImageGalleryItems,
  getDropImageGalleryItemId,
} from "./dropImageGallery";

interface DropPartContentProps {
  readonly mentionedUsers: ApiDropMentionedUser[];
  readonly mentionedGroups?: ApiDropGroupMention[] | undefined;
  readonly mentionedWaves: MentionedWave[];
  readonly referencedNfts: ApiDropReferencedNFT[];
  readonly partContent: string | null;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly currentDropId?: string | undefined;
  readonly partMedias: Array<{
    mimeType: string;
    mediaSrc: string;
  }>;
  readonly currentPartCount: number;
}

const DropPartContent: React.FC<DropPartContentProps> = ({
  mentionedUsers,
  mentionedGroups = [],
  mentionedWaves,
  referencedNfts,
  partContent,
  onQuoteClick,
  currentDropId,
  partMedias,
  currentPartCount,
}) => {
  const galleryItems = useMemo(
    () =>
      buildDropImageGalleryItems({
        partContent,
        partMedias,
      }),
    [partContent, partMedias]
  );

  return (
    <DropImageGalleryProvider items={galleryItems}>
      <div className="tw-h-full tw-w-full">
        <div className="tw-group">
          <DropPartMarkdown
            mentionedUsers={mentionedUsers}
            mentionedGroups={mentionedGroups}
            mentionedWaves={mentionedWaves}
            referencedNfts={referencedNfts}
            partContent={partContent}
            onQuoteClick={onQuoteClick}
            currentDropId={currentDropId}
          />
        </div>
        {!!partMedias.length && (
          <div
            className={`${partContent ? "tw-mt-4" : "tw-mt-1"} tw-space-y-2`}
          >
            {partMedias.map((media, i) => (
              <div
                key={`part-${currentPartCount}-media-${i}-${media.mediaSrc}`}
                className="tw-h-64"
              >
                <DropListItemContentMedia
                  media_mime_type={media.mimeType}
                  media_url={media.mediaSrc}
                  galleryItemId={
                    media.mimeType.toLowerCase().includes("image")
                      ? getDropImageGalleryItemId("media", i, media.mediaSrc)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </DropImageGalleryProvider>
  );
};

export default DropPartContent;
