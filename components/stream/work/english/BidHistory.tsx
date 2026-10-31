import EthAmount from "@/components/stream/ui/EthAmount";
import { STREAM_HELP, STREAM_LABEL } from "@/components/stream/ui/styles";
import { TABLE_RESET } from "@/components/stream/work/FactTable";
import KnownAddress from "@/components/stream/work/KnownAddress";
import StreamTime from "@/components/stream/work/StreamTime";
import type { EnglishPanelContext } from "@/components/stream/work/english/context";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { EnglishBid } from "@/lib/stream/types";

const HEAD =
  "tw-pb-2 tw-pr-3 tw-text-left tw-text-xs tw-font-medium tw-text-iron-400";
const CELL = "tw-py-2 tw-pr-3 tw-align-top";

/** What became of a bid: the last one leads, won or was refunded; earlier ones were outbid. */
function bidStatus(context: EnglishPanelContext, isLast: boolean): MessageKey {
  const { auction } = context;
  if (!isLast) {
    return "stream.english.history.outbid";
  }
  if (auction.highBidder === null || auction.state === "CANCELLED") {
    return "stream.english.history.refunded";
  }
  return auction.settlement?.outcome === "collector"
    ? "stream.english.history.won"
    : "stream.english.history.leading";
}

function BidRow({
  context,
  bid,
  isLast,
}: {
  readonly context: EnglishPanelContext;
  readonly bid: EnglishBid;
  readonly isLast: boolean;
}) {
  const { locale, label } = context;
  return (
    <tr className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07]">
      <td className={CELL}>
        <KnownAddress address={bid.bidder} label={label} locale={locale} />
        <p className={`${STREAM_HELP} tw-mt-0.5`}>
          {t(locale, bidStatus(context, isLast))}
        </p>
      </td>
      <td className={`${CELL} tw-font-medium tw-text-iron-50`}>
        <EthAmount wei={bid.amount} locale={locale} />
      </td>
      <td className={`${CELL} tw-pr-0 tw-text-iron-300`}>
        <StreamTime seconds={bid.at} locale={locale} />
        {bid.extended ? (
          <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-primary-300">
            {t(locale, "stream.english.history.extended")}{" "}
            <StreamTime seconds={bid.endTime} locale={locale} />
          </p>
        ) : null}
      </td>
    </tr>
  );
}

/** `BidPlaced` events for this sale, newest first. */
export default function BidHistory({
  context,
}: {
  readonly context: EnglishPanelContext;
}) {
  const { auction, locale } = context;
  const bids = auction.bids;
  if (bids.length === 0) {
    return (
      <div className="tw-mt-5">
        <p className={STREAM_LABEL}>
          {t(locale, "stream.english.history.title")}
        </p>
        <p className={`${STREAM_HELP} tw-mt-1`}>
          {t(
            locale,
            auction.state === "ACTIVE"
              ? "stream.english.history.empty"
              : "stream.english.history.none"
          )}
        </p>
      </div>
    );
  }
  const newestFirst = bids
    .map((bid, index) => ({ bid, isLast: index === bids.length - 1 }))
    .reverse();
  return (
    <div className="tw-mt-5 tw-overflow-x-auto">
      <table
        className={`tw-w-full tw-min-w-[18rem] tw-border-collapse tw-text-sm ${TABLE_RESET}`}
      >
        <caption className={`${STREAM_LABEL} tw-pb-2 tw-text-left`}>
          {t(locale, "stream.english.history.title")}
        </caption>
        <thead>
          <tr>
            <th scope="col" className={HEAD}>
              {t(locale, "stream.english.history.bidder")}
            </th>
            <th scope="col" className={HEAD}>
              {t(locale, "stream.english.history.amount")}
            </th>
            <th scope="col" className={`${HEAD} tw-pr-0`}>
              {t(locale, "stream.english.history.placed")}
            </th>
          </tr>
        </thead>
        <tbody>
          {newestFirst.map(({ bid, isLast }) => (
            <BidRow
              key={`${bid.txHash}:${bid.at}:${bid.amount}`}
              context={context}
              bid={bid}
              isLast={isLast}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
