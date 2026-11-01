"use client";

import Link from "next/link";

import {
  useStream,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import {
  BidsTable,
  ClaimsTable,
  HoldingsTable,
  WalletsTable,
} from "@/components/stream/me/DashboardTables";
import { readDashboard } from "@/components/stream/me/dashboardBoard";
import {
  Empty,
  Loading,
  PageHeader,
  Section,
} from "@/components/stream/pages/common";
import { AddressChip } from "@/components/stream/ui/AddressChip";
import { STREAM_FOCUS, STREAM_HELP } from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { Address, StreamArtist } from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** The connected account, with its dev-panel name in the mock and its artist identity. */
function AccountLine({
  account,
  artist,
  locale,
}: {
  readonly account: Address;
  readonly artist: StreamArtist | null;
  readonly locale: SupportedLocale;
}) {
  const { client } = useStream();
  const dev = client?.dev ?? null;
  const { data: accounts = [] } = useStreamQuery("dev-accounts", [], () =>
    Promise.resolve(dev === null ? [] : dev.accounts())
  );
  const label = accounts.find((entry) => entry.address === account)?.label;
  return (
    <p className="tw-m-0 tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-sm tw-text-iron-300">
      <span>{t(locale, "stream.me.connected")}</span>
      <AddressChip
        address={account}
        locale={locale}
        {...(label === undefined ? {} : { label })}
      />
      {artist === null ? null : (
        <Link
          href={STREAM_ROUTES.artist(artist.artistId)}
          className={`tw-text-iron-100 tw-underline tw-underline-offset-2 hover:tw-text-iron-50 ${STREAM_FOCUS}`}
        >
          {t(locale, "stream.me.artistPage", { name: artist.displayName })}
        </Link>
      )}
      {dev === null ? null : (
        <span className={STREAM_HELP}>{t(locale, "stream.me.switch")}</span>
      )}
    </p>
  );
}

/** /stream/me: the connected account's bids, claims, works and split wallets. */
export default function MePage() {
  const locale = useBrowserLocale();
  const { account } = useStream();
  const { data: dashboard } = useStreamQuery(
    "dashboard",
    [account],
    (source) =>
      account === null ? Promise.resolve(null) : readDashboard(source, account)
  );
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.me.title")}
        intro={t(locale, "stream.me.intro")}
      >
        {account === null ? null : (
          <AccountLine
            account={account}
            artist={dashboard?.overview.artist ?? null}
            locale={locale}
          />
        )}
      </PageHeader>
      {account === null ? (
        <Empty text={t(locale, "stream.me.connect")} />
      ) : null}
      {account !== null && dashboard === undefined ? <Loading /> : null}
      {dashboard ? (
        <div key={dashboard.overview.account}>
          <Section title={t(locale, "stream.me.bids")}>
            <BidsTable bids={dashboard.bids} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.me.claims")}>
            <ClaimsTable claims={dashboard.claims} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.me.owned")}>
            <HoldingsTable holdings={dashboard.holdings} locale={locale} />
          </Section>
          <Section title={t(locale, "stream.me.wallets")}>
            <WalletsTable wallets={dashboard.wallets} locale={locale} />
          </Section>
        </div>
      ) : null}
    </div>
  );
}
