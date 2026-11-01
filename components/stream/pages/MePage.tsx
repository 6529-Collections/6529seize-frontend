"use client";

import Link from "next/link";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import {
  Empty,
  Facts,
  Loading,
  PageHeader,
  PlaceholderNote,
  Section,
  WorkGrid,
} from "@/components/stream/pages/common";
import EthAmount from "@/components/stream/ui/EthAmount";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { ClaimableItem } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

function claimKey(item: ClaimableItem): string {
  switch (item.kind) {
    case "auction-credit":
      return item.kind;
    case "edition-bid":
      return `${item.kind}:${item.edition}:${item.bidId}`;
    case "pending-delivery":
      return `${item.kind}:${item.saleId}`;
    case "split-payout":
      return `${item.kind}:${item.wallet}:${item.payeeIndex}`;
  }
}

function ClaimRow({
  item,
  locale,
}: {
  readonly item: ClaimableItem;
  readonly locale: SupportedLocale;
}) {
  switch (item.kind) {
    case "auction-credit":
      return (
        <span>
          {t(locale, "stream.me.claim.credit")}{" "}
          <EthAmount wei={item.amount} locale={locale} />
        </span>
      );
    case "edition-bid":
      return (
        <Link
          href={STREAM_ROUTES.edition(item.edition)}
          className={`tw-text-iron-100 ${STREAM_FOCUS}`}
        >
          {t(locale, "stream.me.claim.editions", {
            editions: formatInteger(locale, item.editions),
          })}{" "}
          <EthAmount wei={item.refund} locale={locale} />
        </Link>
      );
    case "pending-delivery":
      return (
        <Link
          href={STREAM_ROUTES.work(item.work)}
          className={`tw-text-iron-100 ${STREAM_FOCUS}`}
        >
          {t(locale, "stream.me.claim.delivery")}
        </Link>
      );
    case "split-payout":
      return (
        <span>
          {t(locale, "stream.me.claim.payout")}{" "}
          <EthAmount wei={item.amount} locale={locale} />
        </span>
      );
  }
}

/** /stream/me: the connected account's bids, refunds, claims and payouts. */
export default function MePage() {
  const locale = useBrowserLocale();
  const { account } = useStream();
  const { data: overview } = useStreamQuery("account", [account], (source) =>
    account === null ? Promise.resolve(null) : source.accountOverview(account)
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.me.title")}
        intro={t(locale, "stream.me.intro")}
      >
        <PlaceholderNote locale={locale} />
      </PageHeader>
      {account === null ? (
        <Empty text={t(locale, "stream.me.connect")} />
      ) : null}
      {account !== null && overview === undefined ? <Loading /> : null}
      {overview ? (
        <>
          <Facts
            items={[
              {
                label: t(locale, "stream.me.bids"),
                value: formatInteger(locale, overview.oneOfOneBids.length),
              },
              {
                label: t(locale, "stream.me.editionBids"),
                value: formatInteger(locale, overview.editionBids.length),
              },
              {
                label: t(locale, "stream.me.claims"),
                value: formatInteger(locale, overview.claimable.length),
              },
            ]}
          />
          <Section title={t(locale, "stream.me.toClaim")}>
            {overview.claimable.length === 0 ? (
              <Empty text={t(locale, "stream.me.nothingToClaim")} />
            ) : (
              <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0 tw-text-sm tw-text-iron-200">
                {overview.claimable.map((item) => (
                  <li key={claimKey(item)}>
                    <ClaimRow item={item} locale={locale} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={t(locale, "stream.me.owned")}>
            <WorkGrid
              keys={overview.owned}
              locale={locale}
              empty={t(locale, "stream.me.ownedEmpty")}
            />
          </Section>
          <Section title={t(locale, "stream.me.payouts")}>
            {overview.splitWallets.length === 0 ? (
              <Empty text={t(locale, "stream.me.payoutsEmpty")} />
            ) : (
              <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
                {overview.splitWallets.map((wallet) => (
                  <li
                    key={wallet.address}
                    className={`${STREAM_HELP} tw-text-sm`}
                  >
                    {t(locale, "stream.me.wallet", {
                      works: formatInteger(locale, wallet.works.length),
                    })}{" "}
                    <EthAmount wei={wallet.received} locale={locale} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
