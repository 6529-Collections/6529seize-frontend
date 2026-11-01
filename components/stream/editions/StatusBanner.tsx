"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  editionsText,
  ethText,
  isLive,
  priceText,
} from "@/components/stream/editions/format";
import { PANEL_ACTION } from "@/components/stream/editions/parts";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  EditionAuction,
  EditionBidView,
  OneOfOneAuction,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

type Tone = "plain" | "warn" | "good";

const TONE_CLASS: Readonly<Record<Tone, string>> = {
  plain: "tw-border-white/10 tw-bg-iron-900",
  warn: "tw-border-amber-400/35 tw-bg-amber-400/10",
  good: "tw-border-success/30 tw-bg-success/10",
};

interface BannerActions {
  readonly pending: boolean;
  readonly message: string | null;
  readonly open: () => void;
  readonly settle: () => void;
  readonly claim: (bids: readonly EditionBidView[]) => void;
}

interface Banner {
  readonly tone: Tone;
  readonly text: ReactNode;
  readonly action?: ReactNode;
}

/** "3 editions and 0.0467 ETH", "0.12 ETH", "3 editions". */
function claimWhat(
  locale: SupportedLocale,
  bids: readonly EditionBidView[]
): string {
  let won = 0;
  let refund = 0n;
  for (const bid of bids) {
    won += bid.won;
    refund += bid.refund;
  }
  if (won > 0 && refund > 0n) {
    return t(locale, "stream.editionAuction.banner.editionsAndEth", {
      editions: editionsText(locale, won),
      amount: ethText(locale, refund),
    });
  }
  return won > 0
    ? editionsText(locale, won)
    : t(locale, "stream.editionAuction.banner.eth", {
        amount: ethText(locale, refund),
      });
}

function Strong({ children }: { readonly children: ReactNode }) {
  return (
    <strong className="tw-font-semibold tw-text-iron-50">{children}</strong>
  );
}

function ActionButton({
  label,
  onClick,
  pending,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly pending: boolean;
}) {
  return (
    <button
      type="button"
      className={PANEL_ACTION}
      disabled={pending}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function settlingBanner(
  locale: SupportedLocale,
  auction: EditionAuction,
  actions: BannerActions
): Banner {
  const progress = auction.settlement;
  const wordsLeft = progress?.wordsLeft ?? 0;
  const gapsLeft =
    progress === null ? 0 : progress.departures - progress.departuresSwept;
  return {
    tone: "plain",
    text: (
      <>
        <Strong>
          {wordsLeft > 0 || gapsLeft === 0
            ? t(locale, "stream.editionAuction.banner.settlingWords", {
                words: formatInteger(locale, wordsLeft),
              })
            : t(locale, "stream.editionAuction.banner.settlingGaps", {
                gaps: formatInteger(locale, gapsLeft),
              })}
        </Strong>{" "}
        {t(locale, "stream.editionAuction.banner.settlingWait")}
      </>
    ),
    action: (
      <ActionButton
        label={t(locale, "stream.editionAuction.banner.continue")}
        onClick={actions.settle}
        pending={actions.pending}
      />
    ),
  };
}

function finalBanner(
  locale: SupportedLocale,
  auction: EditionAuction,
  bids: readonly EditionBidView[],
  actions: BannerActions
): Banner {
  const unclaimed = bids.filter(isLive);
  const claimed = bids.filter((bid) => bid.claimed);
  const isVoid = auction.status === "VOID";
  if (unclaimed.length > 0) {
    return {
      tone: "good",
      text: (
        <>
          <Strong>
            {t(
              locale,
              isVoid
                ? "stream.editionAuction.banner.voidDone"
                : "stream.editionAuction.banner.settled"
            )}
          </Strong>{" "}
          {t(locale, "stream.editionAuction.banner.claimNow", {
            what: claimWhat(locale, unclaimed),
          })}
        </>
      ),
      action: (
        <ActionButton
          label={t(locale, "stream.editionAuction.banner.claim")}
          onClick={() => actions.claim(unclaimed)}
          pending={actions.pending}
        />
      ),
    };
  }
  if (claimed.length > 0) {
    return {
      tone: "good",
      text: t(locale, "stream.editionAuction.banner.claimed", {
        what: claimWhat(locale, claimed),
      }),
    };
  }
  if (isVoid) {
    return {
      tone: "plain",
      text: t(locale, "stream.editionAuction.banner.voidDone"),
    };
  }
  return {
    tone: "good",
    text:
      auction.clearing.count === 0
        ? t(locale, "stream.editionAuction.banner.settledNone")
        : t(locale, "stream.editionAuction.banner.settledResult", {
            editions: editionsText(locale, auction.clearing.count),
            price: priceText(locale, auction.clearing.price),
          }),
  };
}

function closedBanner(
  locale: SupportedLocale,
  auction: EditionAuction,
  oneOfOne: OneOfOneAuction | null,
  actions: BannerActions
): Banner {
  const result = t(locale, "stream.editionAuction.banner.closedResult", {
    editions: editionsText(locale, auction.clearing.count),
    price: priceText(locale, auction.clearing.price),
  });
  const oneSettled =
    oneOfOne === null ||
    oneOfOne.state === "SETTLED" ||
    oneOfOne.state === "CANCELLED";
  if (!oneSettled && auction.master !== null) {
    return {
      tone: "plain",
      text: (
        <>
          <Strong>{result}</Strong>{" "}
          {t(locale, "stream.editionAuction.banner.oneFirst")}
        </>
      ),
      action: (
        <Link
          href={STREAM_ROUTES.work(auction.master)}
          className={`${PANEL_ACTION} tw-no-underline`}
        >
          {t(locale, "stream.editionAuction.banner.toOne")}
        </Link>
      ),
    };
  }
  return {
    tone: "plain",
    text: (
      <>
        <Strong>{result}</Strong>{" "}
        {t(locale, "stream.editionAuction.banner.anyoneSettles")}
      </>
    ),
    action: (
      <ActionButton
        label={t(
          locale,
          auction.editionCreated
            ? "stream.editionAuction.banner.settle"
            : "stream.editionAuction.banner.createAndSettle"
        )}
        onClick={actions.settle}
        pending={actions.pending}
      />
    ),
  };
}

function liveBanner(
  locale: SupportedLocale,
  auction: EditionAuction,
  oneOfOne: OneOfOneAuction | null,
  now: number
): Banner | null {
  const { times, terms } = auction;
  if (now >= times.editionEnd - terms.softWindow) {
    return {
      tone: "warn",
      text: (
        <>
          <Strong>
            {t(locale, "stream.editionAuction.banner.lastMinutes")}
          </Strong>{" "}
          {t(locale, "stream.editionAuction.banner.lastMinutesRule", {
            window: formatInteger(locale, Math.round(terms.softWindow / 60)),
          })}
        </>
      ),
    };
  }
  if (oneOfOne === null) {
    return null;
  }
  const window = oneOfOne.config.extensionWindow;
  if (
    oneOfOne.state === "ACTIVE" &&
    now < oneOfOne.endTime &&
    now >= oneOfOne.endTime - window
  ) {
    return {
      tone: "warn",
      text: (
        <>
          <Strong>
            {t(locale, "stream.editionAuction.banner.oneLast", {
              window: formatInteger(locale, Math.round(window / 60)),
            })}
          </Strong>{" "}
          {t(locale, "stream.editionAuction.banner.oneLastRule")}
        </>
      ),
    };
  }
  if (now >= oneOfOne.endTime && oneOfOne.bids.length === 0) {
    return {
      tone: "plain",
      text: (
        <>
          <Strong>
            {t(
              locale,
              oneOfOne.program === "federated"
                ? "stream.editionAuction.banner.noOneBidsArtist"
                : "stream.editionAuction.banner.noOneBidsMuseum"
            )}
          </Strong>{" "}
          {t(locale, "stream.editionAuction.banner.stillSell")}
        </>
      ),
    };
  }
  return null;
}

interface BannerInput {
  readonly locale: SupportedLocale;
  readonly auction: EditionAuction;
  readonly oneOfOne: OneOfOneAuction | null;
  readonly bids: readonly EditionBidView[];
  readonly now: number;
  readonly actions: BannerActions;
}

function bannerFor({
  locale,
  auction,
  oneOfOne,
  bids,
  now,
  actions,
}: BannerInput): Banner | null {
  if (auction.status === "NONE") {
    return {
      tone: "plain",
      text: t(locale, "stream.editionAuction.banner.notOpen"),
      action: (
        <ActionButton
          label={t(locale, "stream.editionAuction.banner.open")}
          onClick={actions.open}
          pending={actions.pending}
        />
      ),
    };
  }
  if (auction.status === "SETTLED" || auction.status === "VOID") {
    return finalBanner(locale, auction, bids, actions);
  }
  if (auction.status === "SETTLING") {
    return settlingBanner(locale, auction, actions);
  }
  switch (auction.phase) {
    case "void":
      return {
        tone: "warn",
        text: (
          <>
            <Strong>{t(locale, "stream.editionAuction.banner.void")}</Strong>{" "}
            {t(locale, "stream.editionAuction.banner.voidSettle")}
          </>
        ),
        action: (
          <ActionButton
            label={t(locale, "stream.editionAuction.banner.settle")}
            onClick={actions.settle}
            pending={actions.pending}
          />
        ),
      };
    case "disputed":
      return {
        tone: "warn",
        text: (
          <>
            <Strong>
              {t(locale, "stream.editionAuction.banner.disputed")}
            </Strong>{" "}
            {t(locale, "stream.editionAuction.banner.disputedRule")}
          </>
        ),
      };
    case "closed":
      return closedBanner(locale, auction, oneOfOne, actions);
    case "noBids":
      return {
        tone: "plain",
        text: t(locale, "stream.editionAuction.banner.noBids"),
      };
    case "opening":
    case "open":
    case "oneOfOneEnded":
    case "extended":
    case "settling":
    case "settled":
      return liveBanner(locale, auction, oneOfOne, now);
  }
}

/** One status line above the panel, with the action anyone can take now. */
export default function StatusBanner({
  auction,
  oneOfOne,
  bids,
  now,
  actions,
  locale,
}: {
  readonly auction: EditionAuction;
  readonly oneOfOne: OneOfOneAuction | null;
  readonly bids: readonly EditionBidView[];
  readonly now: number;
  readonly actions: BannerActions;
  readonly locale: SupportedLocale;
}) {
  const banner = bannerFor({ locale, auction, oneOfOne, bids, now, actions });
  if (banner === null && actions.message === null) {
    return null;
  }
  return (
    <div
      className={`tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2.5 tw-rounded-xl tw-border tw-border-solid tw-px-4 tw-py-3 ${TONE_CLASS[banner?.tone ?? "plain"]}`}
    >
      <div className="tw-min-w-0 tw-flex-1 tw-basis-72" role="status">
        {banner === null ? null : (
          <p className="tw-m-0 tw-text-sm tw-tabular-nums tw-text-iron-200">
            {banner.text}
          </p>
        )}
        {actions.message === null ? null : (
          <p className="tw-m-0 tw-mt-1 tw-text-[13px] tw-text-iron-300">
            {actions.message}
          </p>
        )}
      </div>
      {banner?.action ?? null}
    </div>
  );
}
