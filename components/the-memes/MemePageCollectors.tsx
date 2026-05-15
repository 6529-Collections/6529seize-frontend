import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas } from "@/helpers/Helpers";
import { ChartBarSquareIcon } from "@heroicons/react/24/outline";
import { MemeCollectorsStats } from "./MemePageLiveStats";

export function MemePageCollectorsRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <section>
        <div className="tw-mb-2 tw-flex tw-items-center tw-gap-3">
          <ChartBarSquareIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500" />
          <h3 className="tw-mb-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
            TDH breakdown
          </h3>
          <div className="tw-h-px tw-min-w-10 tw-flex-grow tw-bg-gradient-to-r tw-from-iron-700 tw-to-transparent" />
        </div>
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-x-10 tw-gap-y-6 sm:tw-gap-x-16 lg:tw-grid-cols-3">
          <TdhBreakdownMetric
            label="TDH"
            value={numberWithCommas(
              Math.round(props.nft.boosted_tdh * 100) / 100
            )}
            active={true}
          />
          <TdhBreakdownMetric
            label="Unweighted TDH"
            value={numberWithCommas(Math.round(props.nft.tdh__raw * 100) / 100)}
          />
          <TdhBreakdownMetric
            label="Meme Rank"
            value={props.nft.tdh_rank ? `#${props.nft.tdh_rank}` : "-"}
          />
        </div>
      </section>
    );
  }

  return <></>;
}

function TdhBreakdownMetric({
  label,
  value,
  active = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly active?: boolean | undefined;
}) {
  return (
    <div className="tw-min-w-0">
      <div
        className={`tw-mb-1 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5 md:tw-mb-2 ${
          active ? "tw-text-primary-400" : "tw-text-iron-400"
        }`}
      >
        {active && (
          <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400" />
        )}
        <span>{label}</span>
      </div>
      <div className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-white md:tw-text-lg md:tw-leading-6">
        {value}
      </div>
    </div>
  );
}

export function MemePageCollectorsSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta: MemesExtendedData | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <>
        {props.nftMeta && (
          <div className="tw-pt-3">
            <MemeCollectorsStats nftMeta={props.nftMeta} />
          </div>
        )}
        <div className="tw-pt-3">
          <NFTLeaderboard contract={props.nft.contract} nftId={props.nft.id} />
        </div>
      </>
    );
  }

  return <></>;
}
