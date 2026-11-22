import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ONCHAIN_MUSEUM_BASE_PATH } from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { FilterableGroups } from "../_components/FilterableGroups";
import { onchainMuseumMetadata } from "../_components/metadata";
import {
  filterableItem,
  filterCopy,
  formatCount,
  JumpNav,
  PageHeading,
  TEXT_LINK,
} from "../_components/OnchainParts";
import { OnchainUnavailable } from "../_components/OnchainUnavailable";
import { onchainMuseumView } from "../_components/view";

const locale = DEFAULT_LOCALE;

export const metadata: Metadata = onchainMuseumMetadata(
  t(locale, "museum.onchain.texts.title"),
  t(locale, "museum.onchain.texts.description")
);

export default async function OnchainMuseumTextsPage() {
  await connection();
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return <OnchainUnavailable />;
  const view = onchainMuseumView(state.snapshot);
  const groups = view.textGroups.map((group) => ({
    key: group.key,
    anchor: group.anchor,
    heading: group.heading,
    kicker: group.heading === group.kicker ? undefined : group.kicker,
    headingHref: group.contextHref ?? undefined,
    items: group.records.map((record) => filterableItem(view, record)),
  }));

  return (
    <>
      <p className="tw-m-0 tw-mb-6 tw-text-sm">
        <Link href={ONCHAIN_MUSEUM_BASE_PATH} className={TEXT_LINK}>
          {t(locale, "museum.onchain.record.backToIndex")}
        </Link>
      </p>
      <PageHeading
        eyebrow={t(locale, "museum.onchain.eyebrow")}
        title={t(locale, "museum.onchain.texts.heading")}
        intro={
          <>
            <p className="tw-m-0">
              {t(locale, "museum.onchain.texts.summary", {
                count: formatCount(view.texts.length),
              })}
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              {t(locale, "museum.onchain.texts.sourceLanguage")}
            </p>
          </>
        }
      />
      <JumpNav
        links={view.textGroups.map((group) => ({
          href: `#${group.anchor}`,
          label: group.heading,
        }))}
      />
      <FilterableGroups groups={groups} copy={filterCopy()} headingLevel={2} />
    </>
  );
}
