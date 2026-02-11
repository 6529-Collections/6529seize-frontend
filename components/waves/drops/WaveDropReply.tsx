"use client";

import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import ContentDisplay from "./ContentDisplay";
import DropLoading from "./DropLoading";
import DropNotFound from "./DropNotFound";
import { parseStandaloneMediaUrl } from "./media-utils";
import { useDropContent } from "./useDropContent";

interface WaveDropReplyProps {
  readonly dropId: string;
  readonly dropPartId: number;
  readonly maybeDrop: ApiDrop | null;
  readonly onReplyClick: (serialNo: number) => void;
}

/**
 * Component to display a reply in a wave drop
 */
export default function WaveDropReply({
  dropId,
  dropPartId,
  maybeDrop,
  onReplyClick,
}: WaveDropReplyProps) {
  const fixedReplyHeightClasses = "tw-h-[24px] tw-min-h-[24px] tw-max-h-[24px]";
  const { drop, content, isLoading } = useDropContent(
    dropId,
    dropPartId,
    maybeDrop
  );
  const replyPreviewContent = useMemo(() => {
    if (content.apiMedia.length > 0 || content.segments.length !== 1) {
      return content;
    }

    const [segment] = content.segments;
    if (segment?.type !== "text") {
      return content;
    }

    const standaloneMedia = parseStandaloneMediaUrl(segment.content);
    if (!standaloneMedia) {
      return content;
    }

    return {
      segments: [],
      apiMedia: [standaloneMedia],
    };
  }, [content]);

  const renderDropContent = () => {
    if (isLoading) {
      return <DropLoading />;
    }

    if (!drop?.author.handle) {
      return <DropNotFound />;
    }

    return (
      <div className="tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-x-1.5">
        <div className="tw-relative tw-z-10 tw-h-6 tw-w-6 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
          {drop.author.pfp ? (
            <Image
              src={resolveIpfsUrlSync(drop.author.pfp)}
              alt={`${drop.author.handle}'s avatar`}
              fill
              sizes="24px"
              className="tw-rounded-md tw-bg-transparent tw-object-contain"
            />
          ) : (
            <div className="tw-h-full tw-w-full tw-rounded-md tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10" />
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-0 tw-flex tw-min-w-0 tw-items-center xl:tw-pr-24">
            <Link
              href={`/${drop.author.handle}`}
              className="tw-mr-1 tw-flex-shrink-0 tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
            >
              {drop.author.handle}
            </Link>
            <ContentDisplay
              content={replyPreviewContent}
              onClick={() => onReplyClick(drop.serial_no)}
              className="tw-min-w-0 tw-flex-1 tw-overflow-hidden"
              textClassName="tw-min-w-0 tw-overflow-hidden"
            />
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-relative tw-mb-3" data-text-selection-exclude="true">
      <div
        className="tw-absolute tw-left-5 tw-top-2.5 tw-w-6 tw-cursor-pointer tw-rounded-tl-[12px] tw-border-0 tw-border-l-[1.5px] tw-border-t-[1.5px] tw-border-solid tw-border-iron-700"
        style={{ height: "calc(100% - 3px)" }}
      ></div>
      <div className="tw-ml-[52px] tw-flex tw-items-center tw-gap-x-1.5">
        <div
          data-testid="wave-drop-reply-fixed-container"
          className={`${fixedReplyHeightClasses} tw-flex tw-w-full tw-items-center tw-overflow-hidden`}
        >
          {renderDropContent()}
        </div>
      </div>
    </div>
  );
}
