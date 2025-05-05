import { useRouter } from "next/router";
import { IFeedItemWaveCreated } from "../../../../../types/feed.types";

import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { ActiveDropState } from "../../../../../types/dropInteractionTypes";
import { DropSize, ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import Drop, {
  DropInteractionParams,
  DropLocation,
} from "../../../../waves/drops/Drop";

export default function FeedItemWaveCreated({
  item,
  showWaveInfo,
  activeDrop,
  onReply,
  onQuote,
  onDropContentClick,
}: {
  readonly item: IFeedItemWaveCreated;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}) {
  const router = useRouter();
  const onReplyClick = (serialNo: number) => {
    router.push(`/my-stream?wave=${item.item.id}&serialNo=${serialNo}/`);
  };

  const onQuoteClick = (quote: ApiDrop) => {
    router.push(
      `/my-stream?wave=${quote.wave.id}&serialNo=${quote.serial_no}/`
    );
  };

  return (
    <div className="tw-w-full tw-flex tw-gap-x-3">
      <div className="tw-w-full tw-space-y-2">
        <div className="tw-inline-flex tw-items-center">
          <div className="tw-mr-2 tw-size-6 tw-flex-shrink-0 md:tw-size-8 tw-rounded-full tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <svg
              className="tw-flex-shrink-0 tw-size-4 md:tw-size-5 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 6C2.6 6.5 3.2 7 4.5 7C7 7 7 5 9.5 5C10.8 5 11.4 5.5 12 6C12.6 6.5 13.2 7 14.5 7C17 7 17 5 19.5 5C20.8 5 21.4 5.5 22 6M2 18C2.6 18.5 3.2 19 4.5 19C7 19 7 17 9.5 17C10.8 17 11.4 17.5 12 18C12.6 18.5 13.2 19 14.5 19C17 19 17 17 19.5 17C20.8 17 21.4 17.5 22 18M2 12C2.6 12.5 3.2 13 4.5 13C7 13 7 11 9.5 11C10.8 11 11.4 11.5 12 12C12.6 12.5 13.2 13 14.5 13C17 13 17 11 19.5 11C20.8 11 21.4 11.5 22 12"
              />
            </svg>
          </div>
          <span className="tw-text-sm tw-font-normal tw-text-iron-50">
            <span className="tw-font-semibold">{item.item.author.handle}</span>{" "}
            created a wave
          </span>
        </div>

        <Drop
          drop={{
            type: DropSize.FULL,
            ...item.item.description_drop,
            stableKey: "",
            stableHash: "",
          }}
          previousDrop={null}
          nextDrop={null}
          showWaveInfo={showWaveInfo}
          activeDrop={activeDrop}
          dropViewDropId={null}
          showReplyAndQuote={true}
          location={DropLocation.MY_STREAM}
          onReply={onReply}
          onQuote={onQuote}
          onReplyClick={onReplyClick}
          onQuoteClick={onQuoteClick}
          onDropContentClick={onDropContentClick}
        />
      </div>
    </div>
  );
}
