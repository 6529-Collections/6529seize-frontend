"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { useStreamQuery } from "@/components/stream/data/StreamProvider";
import TierComparison from "@/components/stream/diagrams/TierComparison";
import { shortHex } from "@/components/stream/federated/DelistingNotice";
import { FIELD_INPUT } from "@/components/stream/federated/formStyles";
import { FORMS } from "@/components/stream/federated/launchForm";
import { Loading, PageHeader, Section } from "@/components/stream/pages/common";
import EthAmount from "@/components/stream/ui/EthAmount";
import {
  federatedStatusBadge,
  SpecBadge,
} from "@/components/stream/ui/StatusBadge";
import {
  STREAM_BUTTON_PRIMARY,
  STREAM_FOCUS,
  STREAM_HELP,
  STREAM_LABEL,
} from "@/components/stream/ui/styles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  FederatedContract,
  FederatedForm,
  FederatedStatus,
  StreamArtist,
  Wei,
} from "@/lib/stream/types";
import { STREAM_ROUTES } from "@/lib/stream/workKey";

/** A directory row: one contract, or both halves of a linked pair. */
interface DirectoryRow {
  readonly entry: FederatedContract;
  readonly partner: FederatedContract | null;
  readonly works: number;
  readonly volume: Wei;
}

/** Folds a pair's two registry entries into one row, keyed by its 1/1 half. */
function toRows(contracts: readonly FederatedContract[]): DirectoryRow[] {
  const byAddress = new Map(contracts.map((entry) => [entry.address, entry]));
  return contracts.flatMap((entry) => {
    const partner =
      entry.partner === null ? null : (byAddress.get(entry.partner) ?? null);
    if (entry.standard === "ERC1155" && partner !== null) {
      return [];
    }
    return [
      {
        entry,
        partner,
        works: entry.works.length + (partner?.works.length ?? 0),
        volume: entry.volume + (partner?.volume ?? 0n),
      },
    ];
  });
}

type StatusFilter = FederatedStatus | "ALL";

const STATUS_FILTERS: readonly StatusFilter[] = ["ACTIVE", "DELISTED", "ALL"];

const CELL_BASE =
  "tw-whitespace-nowrap tw-px-3 tw-py-3 tw-align-top first:tw-pl-0 last:tw-pr-0";

const CELL = `${CELL_BASE} tw-text-left`;

const NUMERIC = `${CELL_BASE} tw-text-right`;

function statusLabel(locale: SupportedLocale, status: StatusFilter): string {
  if (status === "ALL") {
    return t(locale, "stream.federated.filter.statusAll");
  }
  return t(locale, federatedStatusBadge(status).label);
}

function Filters({
  locale,
  search,
  form,
  status,
  onSearch,
  onForm,
  onStatus,
}: {
  readonly locale: SupportedLocale;
  readonly search: string;
  readonly form: FederatedForm | "";
  readonly status: StatusFilter;
  readonly onSearch: (value: string) => void;
  readonly onForm: (value: FederatedForm | "") => void;
  readonly onStatus: (value: StatusFilter) => void;
}) {
  const id = useId();
  return (
    <form
      role="search"
      aria-label={t(locale, "stream.federated.filters")}
      onSubmit={(event) => event.preventDefault()}
      className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div>
        <label htmlFor={`${id}-search`} className={STREAM_LABEL}>
          {t(locale, "stream.federated.filter.search")}
        </label>
        <input
          id={`${id}-search`}
          type="search"
          value={search}
          placeholder={t(locale, "stream.federated.filter.searchPlaceholder")}
          onChange={(event) => onSearch(event.target.value)}
          className={FIELD_INPUT}
        />
      </div>
      <div>
        <label htmlFor={`${id}-form`} className={STREAM_LABEL}>
          {t(locale, "stream.federated.filter.form")}
        </label>
        <select
          id={`${id}-form`}
          value={form}
          onChange={(event) =>
            onForm(FORMS.find((value) => value === event.target.value) ?? "")
          }
          className={FIELD_INPUT}
        >
          <option value="">
            {t(locale, "stream.federated.filter.formAll")}
          </option>
          {FORMS.map((value) => (
            <option key={value} value={value}>
              {t(locale, `stream.federated.form.${value}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-status`} className={STREAM_LABEL}>
          {t(locale, "stream.federated.filter.status")}
        </label>
        <select
          id={`${id}-status`}
          value={status}
          onChange={(event) =>
            onStatus(
              STATUS_FILTERS.find((value) => value === event.target.value) ??
                "ACTIVE"
            )
          }
          className={FIELD_INPUT}
        >
          {STATUS_FILTERS.map((value) => (
            <option key={value} value={value}>
              {statusLabel(locale, value)}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}

function StatusCell({
  entry,
  locale,
}: {
  readonly entry: FederatedContract;
  readonly locale: SupportedLocale;
}) {
  const status: FederatedStatus = entry.artistDelisted
    ? "DELISTED"
    : entry.status;
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
      <SpecBadge spec={federatedStatusBadge(status)} locale={locale} />
      {entry.delisting === null ? null : (
        <span className="tw-text-xs tw-text-iron-400">
          {t(locale, "stream.federated.delistedLine", {
            date: formatUtcDate(locale, entry.delisting.at * 1_000),
            reason: t(
              locale,
              `stream.federated.reason.${entry.delisting.reason}`
            ),
          })}
          <span
            className="tw-block tw-font-mono"
            title={entry.delisting.voteRef}
          >
            {t(locale, "stream.federated.delisted.vote", {
              ref: shortHex(entry.delisting.voteRef),
            })}
          </span>
        </span>
      )}
    </div>
  );
}

function DirectoryTable({
  rows,
  artists,
  locale,
}: {
  readonly rows: readonly DirectoryRow[];
  readonly artists: ReadonlyMap<string, StreamArtist>;
  readonly locale: SupportedLocale;
}) {
  const label = t(locale, "stream.federated.table");
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`tw-overflow-x-auto ${STREAM_FOCUS}`}
    >
      <table className="tw-w-full tw-border-collapse tw-text-sm tw-tabular-nums">
        <caption className="tw-sr-only">{label}</caption>
        <thead>
          <tr>
            {(["contract", "form", "artist", "license", "status"] as const).map(
              (column) => (
                <th
                  key={column}
                  scope="col"
                  className={`${CELL} tw-font-medium tw-text-iron-400`}
                >
                  {t(locale, `stream.federated.col.${column}`)}
                </th>
              )
            )}
            {(["works", "volume"] as const).map((column) => (
              <th
                key={column}
                scope="col"
                className={`${NUMERIC} tw-font-medium tw-text-iron-400`}
              >
                {t(locale, `stream.federated.col.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ entry, partner, works, volume }) => {
            const artist = artists.get(entry.artistId);
            return (
              <tr
                key={entry.address}
                className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-text-iron-200"
              >
                <th scope="row" className={`${CELL} tw-font-medium`}>
                  <Link
                    href={STREAM_ROUTES.federatedContract(entry.address)}
                    className={`tw-text-iron-50 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
                  >
                    {entry.name}
                  </Link>
                  <span className="tw-block tw-text-xs tw-font-normal tw-text-iron-400">
                    {partner === null
                      ? entry.symbol
                      : `${entry.symbol} · ${partner.symbol}`}
                  </span>
                </th>
                <td className={CELL}>
                  {t(locale, `stream.federated.form.${entry.form}`)}
                </td>
                <td className={CELL}>
                  {artist === undefined ? (
                    shortHex(entry.artistId)
                  ) : (
                    <Link
                      href={STREAM_ROUTES.artist(entry.artistId)}
                      className={`tw-text-iron-200 tw-no-underline hover:tw-underline ${STREAM_FOCUS}`}
                    >
                      {artist.displayName}
                    </Link>
                  )}
                </td>
                <td className={CELL}>{entry.defaultLicense}</td>
                <td className={CELL}>
                  <StatusCell entry={entry} locale={locale} />
                </td>
                <td className={NUMERIC}>{formatInteger(locale, works)}</td>
                <td className={NUMERIC}>
                  <EthAmount wei={volume} locale={locale} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** /stream/federated: the registry directory. Artist-owned, not curated. */
export function FederatedDirectoryPage() {
  const locale = useBrowserLocale();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FederatedForm | "">("");
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const { data: contracts } = useStreamQuery(
    "federated",
    [search, form, status],
    (source) =>
      source.federatedDirectory({
        search,
        ...(form === "" ? {} : { form }),
        ...(status === "ALL" ? { includeDelisted: true } : { status }),
      })
  );
  const { data: artistList } = useStreamQuery("artists", [], (source) =>
    source.listArtists()
  );
  const artists = useMemo(
    () =>
      new Map((artistList ?? []).map((artist) => [artist.artistId, artist])),
    [artistList]
  );
  const rows = useMemo(() => toRows(contracts ?? []), [contracts]);
  return (
    <div>
      <PageHeader
        title={t(locale, "stream.federated.title")}
        intro={t(locale, "stream.federated.intro")}
      >
        <p className={`${STREAM_HELP} tw-mt-2`}>
          {t(locale, "stream.federated.notCurated")} ·{" "}
          {t(locale, "stream.federated.noTdh")}
        </p>
        <Link
          href={STREAM_ROUTES.launch}
          className={`${STREAM_BUTTON_PRIMARY} tw-mt-4 tw-no-underline`}
        >
          {t(locale, "stream.federated.launchCta")}
        </Link>
      </PageHeader>
      <Filters
        locale={locale}
        search={search}
        form={form}
        status={status}
        onSearch={setSearch}
        onForm={setForm}
        onStatus={setStatus}
      />
      <p className={`${STREAM_HELP} tw-mb-2 tw-mt-4`} aria-live="polite">
        {t(locale, "stream.federated.count", {
          count: formatInteger(locale, rows.length),
        })}
      </p>
      {contracts === undefined ? <Loading /> : null}
      {contracts !== undefined && rows.length === 0 ? (
        <p className="tw-m-0 tw-py-6 tw-text-sm tw-text-iron-400">
          {t(locale, "stream.federated.empty")}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <DirectoryTable rows={rows} artists={artists} locale={locale} />
      ) : null}
      <div className="tw-mt-8">
        <Section title={t(locale, "stream.federated.tiers")}>
          <TierComparison locale={locale} highlight="federated" />
        </Section>
      </div>
    </div>
  );
}
