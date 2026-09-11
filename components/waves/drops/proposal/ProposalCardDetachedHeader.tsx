import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ReactNode } from "react";
import WaveDropAuthorPfp from "../WaveDropAuthorPfp";

export default function ProposalCardDetachedHeader({
  drop,
  identityHeader,
}: {
  readonly drop: ExtendedDrop;
  readonly identityHeader: ReactNode;
}) {
  return (
    <div className="tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-pb-2">
      <WaveDropAuthorPfp drop={drop} />
      <div className="tw-min-w-0 tw-flex-1">{identityHeader}</div>
    </div>
  );
}
