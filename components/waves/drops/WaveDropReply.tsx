 "use client";

import Link from "next/link";
import Image from "next/image";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { useDropContent } from "./useDropContent";
import DropLoading from "./DropLoading";
import DropNotFound from "./DropNotFound";
import ContentDisplay from "./ContentDisplay";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

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
  const { drop, content, isLoading } = useDropContent(
    dropId,
    dropPartId,
    maybeDrop
  );

  const renderDropContent = () => {
    if (isLoading) {
      return <DropLoading />;
    }

    if (!drop?.author.handle) {
      return <DropNotFound />;
    }

    return (
      <div className="tw-flex tw-gap-x-1.5">
        <div className="tw-relative tw-z-10 tw-flex-shrink-0 tw-h-6 tw-w-6 tw-rounded-md tw-bg-iron-800 tw-overflow-hidden">
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
        <div className="tw-flex-1">
          <p className="tw-mb-0 tw-flex xl:tw-pr-24">
            <Link
              href={`/${drop.author.handle}`}
              className="tw-no-underline tw-mr-1 tw-text-sm tw-font-medium tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author.handle}
            </Link>
            <ContentDisplay
              content={content}
              onReplyClick={onReplyClick}
              serialNo={drop?.serial_no}
            />
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="tw-mb-3 tw-relative" data-text-selection-exclude="true">
      <div
        className="tw-absolute tw-top-2.5 tw-left-5 tw-border-iron-700 tw-border-0 tw-border-solid tw-border-t-[1.5px] tw-border-l-[1.5px] tw-cursor-pointer tw-w-6 tw-rounded-tl-[12px]"
        style={{ height: "calc(100% - 3px)" }}
      ></div>
      <div className="tw-ml-[52px] tw-flex tw-items-center tw-gap-x-1.5">
        {renderDropContent()}
      </div>
    </div>
  );
}
