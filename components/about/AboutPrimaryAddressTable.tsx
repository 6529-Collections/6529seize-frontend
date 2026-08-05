import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import Link from "next/link";
import type { PrimaryAddressData } from "./aboutPrimaryAddress.helpers";

type PrimaryAddressMessageKey = Extract<
  MessageKey,
  `about.primaryAddress.${string}`
>;

const TABLE_HEADING_CLASS =
  "tw-sticky tw-top-0 tw-z-10 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-4 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-300 xl:tw-px-5";
const TABLE_CELL_CLASS =
  "tw-block tw-border-0 tw-py-0 lg:tw-table-cell lg:tw-border-0 lg:tw-border-b lg:tw-border-solid lg:tw-border-iron-900 lg:tw-px-3 lg:tw-py-1 lg:tw-align-middle xl:tw-px-5";

const m = (
  locale: SupportedLocale,
  key: PrimaryAddressMessageKey,
  params: Parameters<typeof t>[2] = {}
) => t(locale, key, params);

export default function PrimaryAddressRecords({
  data,
  error,
  isLoading,
  locale,
}: {
  readonly data: readonly PrimaryAddressData[];
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <section className="tw-px-1 tw-py-10 sm:tw-px-0 sm:tw-py-12 lg:tw-px-2">
      <p className="tw-m-0 tw-max-w-5xl tw-text-base tw-leading-7 tw-text-iron-300">
        {m(locale, "about.primaryAddress.table.intro")}
      </p>
      <div className="tw-mt-6">
        <RecordsContent
          data={data}
          error={error}
          isLoading={isLoading}
          locale={locale}
        />
      </div>
    </section>
  );
}

function RecordsContent({
  data,
  error,
  isLoading,
  locale,
}: {
  readonly data: readonly PrimaryAddressData[];
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly locale: SupportedLocale;
}) {
  if (isLoading) {
    return <PrimaryAddressLoading locale={locale} />;
  }

  if (error !== null) {
    return <PrimaryAddressError error={error} locale={locale} />;
  }

  return <PrimaryAddressTable data={data} locale={locale} />;
}

function PrimaryAddressTable({
  data,
  locale,
}: {
  readonly data: readonly PrimaryAddressData[];
  readonly locale: SupportedLocale;
}) {
  const tableLabel = m(locale, "about.primaryAddress.table.intro");
  const scrollRegionLabel = m(locale, "about.primaryAddress.table.regionLabel");
  const scrollRegionProps = data.length === 0 ? {} : { tabIndex: 0 };

  return (
    <section
      aria-label={scrollRegionLabel}
      className="tw-[scrollbar-gutter:stable] tw-max-h-[75vh] tw-min-w-0 tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-scrollbar-thumb-iron-500 lg:tw-bg-iron-950/40"
      {...scrollRegionProps}
    >
      <table className="tw-block tw-w-full tw-table-fixed tw-border-collapse lg:tw-table">
        <caption className="tw-sr-only">{tableLabel}</caption>
        <colgroup className="tw-hidden lg:tw-table-column-group">
          <col className="tw-w-[18%]" />
          <col className="tw-w-[41%]" />
          <col className="tw-w-[41%]" />
        </colgroup>
        <thead className="tw-sr-only lg:tw-not-sr-only lg:tw-table-header-group">
          <tr className="before:tw-hidden after:tw-hidden">
            <th className={TABLE_HEADING_CLASS} scope="col">
              {m(locale, "about.primaryAddress.table.profile")}
            </th>
            <th className={TABLE_HEADING_CLASS} scope="col">
              {m(locale, "about.primaryAddress.table.current")}
            </th>
            <th className={TABLE_HEADING_CLASS} scope="col">
              {m(locale, "about.primaryAddress.table.changed")}
            </th>
          </tr>
        </thead>
        <tbody className="tw-block lg:tw-table-row-group">
          {data.map((item) => (
            <PrimaryAddressRow
              item={item}
              key={item.profile_id}
              locale={locale}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PrimaryAddressRow({
  item,
  locale,
}: {
  readonly item: PrimaryAddressData;
  readonly locale: SupportedLocale;
}) {
  return (
    <tr className="tw-mb-2 tw-block tw-bg-iron-950 tw-px-4 tw-py-3 before:tw-hidden after:tw-hidden last:tw-mb-0 lg:tw-mb-0 lg:tw-table-row lg:tw-bg-transparent lg:tw-p-0">
      <td className={TABLE_CELL_CLASS}>
        <Link
          className="tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-py-1 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 tw-underline tw-decoration-iron-600 tw-underline-offset-4 tw-transition-colors focus:tw-outline-none focus-visible:tw-rounded-md focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-300 lg:tw-py-0"
          href={`/${item.current_primary}`}
        >
          <span className="tw-min-w-0 tw-break-words">{item.handle}</span>
        </Link>
      </td>
      <td className={TABLE_CELL_CLASS}>
        <div className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-col tw-justify-center tw-py-2 lg:tw-py-0">
          <span
            aria-hidden="true"
            className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-500 lg:tw-hidden"
          >
            {m(locale, "about.primaryAddress.table.current")}
          </span>
          <span className="tw-break-all tw-font-mono tw-text-sm tw-leading-5 tw-text-iron-400 lg:tw-whitespace-nowrap lg:tw-text-xs xl:tw-text-sm">
            {item.current_primary}
          </span>
        </div>
      </td>
      <td className={TABLE_CELL_CLASS}>
        <div className="tw-flex tw-min-h-11 tw-min-w-0 tw-flex-col tw-justify-center tw-py-2 lg:tw-py-0">
          <span
            aria-hidden="true"
            className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-500 lg:tw-hidden"
          >
            {m(locale, "about.primaryAddress.table.changed")}
          </span>
          <span className="tw-break-all tw-font-mono tw-text-sm tw-leading-5 tw-text-iron-200 lg:tw-whitespace-nowrap lg:tw-text-xs xl:tw-text-sm">
            {item.new_primary}
          </span>
        </div>
      </td>
    </tr>
  );
}

function PrimaryAddressLoading({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <p
      aria-live="polite"
      className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400"
      role="status"
    >
      {m(locale, "about.primaryAddress.loading")}
    </p>
  );
}

function PrimaryAddressError({
  error,
  locale,
}: {
  readonly error: Error;
  readonly locale: SupportedLocale;
}) {
  return (
    <p
      className="tw-m-0 tw-break-words tw-text-sm tw-leading-6 tw-text-error"
      role="alert"
    >
      {m(locale, "about.primaryAddress.error", { message: error.message })}
    </p>
  );
}
