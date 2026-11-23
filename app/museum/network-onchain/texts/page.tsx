import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { OnchainMuseumRecord } from "@/lib/museum/onchain/museum";
import {
  documentPath,
  ONCHAIN_MUSEUM_BASE_PATH,
} from "@/lib/museum/onchain/fields";
import { type OnchainMuseumView } from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import {
  FilterableGroups,
  type FilterableItem,
} from "../_components/FilterableGroups";
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

/**
 * Rows for a group's texts. Texts that share a title carry the name of their
 * file, in words, so they can be told apart.
 */
function withDistinctTitles(
  view: OnchainMuseumView,
  records: readonly OnchainMuseumRecord[]
): FilterableItem[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const label = view.labelOf(record);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return records.map((record) =>
    filterableItem(
      view,
      record,
      (counts.get(view.labelOf(record)) ?? 0) > 1
        ? fileTitle(documentPath(record))
        : undefined
    )
  );
}

function fileTitle(path: string | null): string | undefined {
  const name = path?.split("/").pop()?.replace(/\.md$/u, "");
  if (name === undefined || name === "") return undefined;
  const words = name.replaceAll(/[-_]+/gu, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function OnchainMuseumTextsPage() {
  await connection();
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return <OnchainUnavailable />;
  const view = onchainMuseumView(state.snapshot);
  const headingCounts = new Map<string, number>();
  for (const group of view.textGroups) {
    headingCounts.set(
      group.heading,
      (headingCounts.get(group.heading) ?? 0) + 1
    );
  }
  const groups = view.textGroups.map((group) => ({
    key: group.key,
    anchor: group.anchor,
    heading: group.heading,
    kicker: group.heading === group.kicker ? undefined : group.kicker,
    headingHref: group.contextHref ?? undefined,
    items: withDistinctTitles(view, group.records),
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
      <FilterableGroups
        groups={groups}
        copy={filterCopy()}
        headingLevel={2}
        afterFilter={
          <JumpNav
            links={view.textGroups.map((group) => ({
              href: `#${group.anchor}`,
              label:
                (headingCounts.get(group.heading) ?? 0) > 1
                  ? `${group.kicker}: ${group.heading}`
                  : group.heading,
            }))}
          />
        }
      />
    </>
  );
}
