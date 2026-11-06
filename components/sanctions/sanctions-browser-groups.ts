import type {
  SanctionsBrowserGroup,
  SanctionsBrowserLabels,
  SanctionsBrowserRow,
} from "@/components/sanctions/SanctionsListBrowser";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  SanctionsPageGroup,
  SanctionsPageModel,
  SanctionsPageRow,
} from "@/lib/sanctions/sanctions-page-model";
import type { SanctionsSourceId } from "@/lib/sanctions/sanctions-list.types";

const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function sourceName(
  locale: SupportedLocale,
  source: SanctionsSourceId
): string {
  return t(locale, `sanctions.source.${source}.name` as MessageKey);
}

export function sourceListName(
  locale: SupportedLocale,
  source: SanctionsSourceId
): string {
  return t(locale, `sanctions.source.${source}.list` as MessageKey);
}

export function formatSanctionsDate(
  locale: SupportedLocale,
  value: string | null
): string {
  return value === null
    ? t(locale, "sanctions.list.notAvailable")
    : formatDate(locale, value, LONG_DATE);
}

function toBrowserRow(
  locale: SupportedLocale,
  group: SanctionsPageGroup,
  row: SanctionsPageRow
): SanctionsBrowserRow {
  const notStated = t(locale, "sanctions.list.notAvailable");
  const reference = [row.reference, ...row.programs].join(" · ");
  const chain = row.labels.length > 0 ? row.labels.join(", ") : notStated;
  const entity = row.entity ?? notStated;
  return {
    key: `${group.key}:${row.address}:${row.reference}`,
    address: row.address,
    chain,
    reference,
    entity,
    listed: formatSanctionsDate(locale, row.listedOn),
    validUntil:
      row.validUntil === null
        ? null
        : formatSanctionsDate(locale, row.validUntil),
    searchText: [row.address, reference, entity, chain].join(" ").toLowerCase(),
  };
}

/** Translates and formats the page model for the client list browser. */
export function toBrowserGroups(
  locale: SupportedLocale,
  model: SanctionsPageModel
): SanctionsBrowserGroup[] {
  return model.groups.map((group) => {
    const meta = [
      t(locale, "sanctions.list.addresses", {
        count: formatInteger(locale, group.addressCount),
      }),
    ];
    if (group.sourcePublished !== null) {
      meta.push(
        t(locale, "sanctions.list.sourceUpdated", {
          date: formatSanctionsDate(locale, group.sourcePublished),
        })
      );
    }
    return {
      key: group.key,
      title: group.lapsed
        ? t(locale, "sanctions.list.lapsedTitle")
        : sourceName(locale, group.source),
      subtitle: sourceListName(locale, group.source),
      lapsed: group.lapsed,
      intro: group.lapsed ? t(locale, "sanctions.list.lapsedIntro") : null,
      meta,
      sourceUrl: group.url,
      emptyText:
        group.rows.length === 0
          ? t(locale, "sanctions.list.noAddresses")
          : null,
      rows: group.rows.map((row) => toBrowserRow(locale, group, row)),
    };
  });
}

export function browserLabels(locale: SupportedLocale): SanctionsBrowserLabels {
  return {
    searchLabel: t(locale, "sanctions.list.searchLabel"),
    searchHint: t(locale, "sanctions.list.searchHint"),
    searchResultsOne: t(locale, "sanctions.list.searchResultsOne"),
    searchResultsOther: t(locale, "sanctions.list.searchResultsOther"),
    searchEmpty: t(locale, "sanctions.list.searchEmpty"),
    sourceLink: t(locale, "sanctions.list.sourceLink"),
    lapsedLabel: t(locale, "sanctions.list.lapsedLabel"),
    chain: t(locale, "sanctions.list.columnChain"),
    reference: t(locale, "sanctions.list.columnReference"),
    name: t(locale, "sanctions.list.columnName"),
    listed: t(locale, "sanctions.list.columnListed"),
    validUntil: t(locale, "sanctions.list.columnValidUntil"),
  };
}
