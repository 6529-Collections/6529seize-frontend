import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { numberWithCommas } from "@/helpers/Helpers";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row } from "react-bootstrap";
import { MemeCollectorsStats } from "./MemePageLiveStats";

export function MemePageCollectorsRightMenu(props: {
  show: boolean;
  nft: NFT | undefined;
}) {
  if (props.show && props.nft) {
    return (
      <Col xs={12} className="tw-pt-2">
        <section>
          <div className="tw-flex tw-items-center tw-gap-4">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-400"
            />
            <h3 className="tw-mb-0 tw-whitespace-nowrap tw-text-lg tw-font-semibold tw-text-iron-100">
              TDH breakdown
            </h3>
            <div className="tw-h-px tw-min-w-10 tw-flex-1 tw-bg-iron-800" />
          </div>
          <div className="tw-mt-8 tw-flex tw-flex-wrap tw-items-start tw-gap-x-12 tw-gap-y-6">
            <TdhBreakdownMetric
              label="TDH"
              value={numberWithCommas(
                Math.round(props.nft.boosted_tdh * 100) / 100
              )}
              active={true}
            />
            <TdhBreakdownMetric
              label="Unweighted TDH"
              value={numberWithCommas(
                Math.round(props.nft.tdh__raw * 100) / 100
              )}
            />
            <TdhBreakdownMetric
              label="Meme Rank"
              value={props.nft.tdh_rank ? `#${props.nft.tdh_rank}` : "-"}
            />
          </div>
          <div className="tw-mt-12 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800" />
        </section>
      </Col>
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
    <div className="tw-min-w-[8rem]">
      <div
        className={`tw-mb-1.5 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-leading-4 ${
          active ? "tw-text-primary-400" : "tw-text-iron-400"
        }`}
      >
        {active && (
          <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400" />
        )}
        <span>{label}</span>
      </div>
      <div className="tw-text-xl tw-font-semibold tw-leading-none tw-text-white">
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
          <Row className="pt-3">
            <Col>
              <MemeCollectorsStats nftMeta={props.nftMeta} />
            </Col>
          </Row>
        )}
        <Row className="pt-3">
          <Col>
            <NFTLeaderboard
              contract={props.nft.contract}
              nftId={props.nft.id}
            />
          </Col>
        </Row>
      </>
    );
  }

  return <></>;
}
