import Image from "next/image";
import Link from "next/link";

import Countdown from "@/components/stream/ui/Countdown";
import { formatEth } from "@/components/stream/ui/EthAmount";
import StatusBadge, {
  auctionStateBadge,
  editionPhaseBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  EditionAuction,
  OneOfOneAuction,
  StreamWork,
  UnixSeconds,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** Table cells and labels shared by the home, artist, dashboard and museum pages. */

/** A work's page: the edition page for an ERC-1155 edition, else the work page. */
export function workHref(work: Pick<StreamWork, "key" | "standard">): string {
  return work.standard === "ERC1155"
    ? STREAM_ROUTES.edition(work.key)
    : STREAM_ROUTES.work(work.key);
}

/** A small square thumbnail; decorative, because the title sits beside it. */
function Thumb({
  uri,
  size = 40,
}: {
  readonly uri: string | null;
  readonly size?: number;
}) {
  return (
    <span
      className="tw-relative tw-block tw-flex-none tw-overflow-hidden tw-rounded tw-bg-iron-900"
      style={{ width: size, height: size }}
    >
      {uri === null ? null : (
        <Image
          src={uri}
          alt=""
          fill
          unoptimized
          sizes={`${size}px`}
          className="tw-object-cover"
        />
      )}
    </span>
  );
}

/** A work's thumbnail, linked title and one line of detail. */
export function WorkCell({
  href,
  title,
  detail,
  thumbnail,
}: {
  readonly href: string;
  readonly title: string;
  readonly detail?: string;
  readonly thumbnail?: string | null;
}) {
  return (
    <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
      {thumbnail === undefined ? null : <Thumb uri={thumbnail} />}
      <span className="tw-min-w-0">
        <Link
          href={href}
          className={`tw-block tw-max-w-[9rem] tw-truncate tw-font-medium tw-text-iron-50 tw-no-underline hover:tw-underline sm:tw-max-w-[14rem] ${STREAM_FOCUS}`}
        >
          {title}
        </Link>
        {detail === undefined || detail === "" ? null : (
          <span
            className={`${STREAM_HELP} tw-block tw-max-w-[9rem] tw-truncate sm:tw-max-w-[14rem]`}
          >
            {detail}
          </span>
        )}
      </span>
    </span>
  );
}

/** A row button's accessible name: the action and what it acts on ("Claim: Ember Index"). */
export function actionLabel(
  locale: SupportedLocale,
  action: string,
  subject: string
): string {
  return t(locale, "stream.browse.actionOn", { action, subject });
}

/** "80 at 0.0511 ETH", "No bids yet" or "Not opened yet". */
export function editionResultText(
  locale: SupportedLocale,
  auction: EditionAuction
): string {
  if (auction.phase === "opening") {
    return t(locale, "stream.browse.notOpened");
  }
  if (auction.clearing.count === 0) {
    return auction.settled || auction.phase === "void"
      ? t(locale, "stream.browse.noEditions")
      : t(locale, "stream.browse.noBidsYet");
  }
  return t(locale, "stream.browse.kAtP", {
    count: formatInteger(locale, auction.clearing.count),
    price: formatEth(locale, auction.clearing.price),
  });
}

/** The high bid, the sale price, or why there is none. */
export function oneOfOneValueText(
  locale: SupportedLocale,
  auction: OneOfOneAuction
): string {
  const settlement = auction.settlement;
  if (settlement !== null) {
    return settlement.outcome === "collector"
      ? formatEth(locale, settlement.price)
      : t(locale, "stream.browse.noSale");
  }
  return auction.bidder === null
    ? t(locale, "stream.browse.noBidsYet")
    : formatEth(locale, auction.bid);
}

/** The 1/1's state, or where a settled 1/1 went. */
export function OneOfOneTag({
  auction,
  locale,
}: {
  readonly auction: OneOfOneAuction;
  readonly locale: SupportedLocale;
}) {
  switch (auction.settlement?.outcome) {
    case "collector":
      return (
        <StatusBadge tone="success" label={t(locale, "stream.browse.sold")} />
      );
    case "museum":
      return (
        <StatusBadge tone="info" label={t(locale, "stream.browse.toMuseum")} />
      );
    case "artist":
      return (
        <StatusBadge tone="info" label={t(locale, "stream.browse.toArtist")} />
      );
    case "burned":
      return (
        <StatusBadge tone="danger" label={t(locale, "stream.browse.burned")} />
      );
    case undefined:
      return (
        <SpecBadge spec={auctionStateBadge(auction.state)} locale={locale} />
      );
  }
}

export function EditionTag({
  auction,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly locale: SupportedLocale;
}) {
  return <SpecBadge spec={editionPhaseBadge(auction.phase)} locale={locale} />;
}

/** When the 1/1 closes: a countdown while live, else its state. */
export function OneOfOneClose({
  auction,
  now,
  locale,
}: {
  readonly auction: OneOfOneAuction;
  readonly now: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  if (auction.state !== "ACTIVE") {
    return <OneOfOneTag auction={auction} locale={locale} />;
  }
  return (
    <Countdown
      endTime={auction.endTime}
      now={now}
      locale={locale}
      closeWindow={auction.config.extensionWindow}
      extended={auction.endTime > auction.scheduledEnd}
    />
  );
}

/** When the edition auction closes: a countdown while it takes bids, else its state. */
export function EditionClose({
  auction,
  now,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly now: UnixSeconds;
  readonly locale: SupportedLocale;
}) {
  const counting =
    auction.phase === "open" ||
    auction.phase === "oneOfOneEnded" ||
    auction.phase === "extended";
  if (!counting) {
    return <EditionTag auction={auction} locale={locale} />;
  }
  return (
    <Countdown
      endTime={auction.times.endTime}
      now={now}
      locale={locale}
      closeWindow={auction.terms.softWindow}
      extended={auction.phase === "extended"}
    />
  );
}
