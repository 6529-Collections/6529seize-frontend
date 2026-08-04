"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";
import PrimaryAddressRecords from "./AboutPrimaryAddressTable";
import {
  fetchPrimaryAddressData,
  PRIMARY_ADDRESS_QUERY_KEY,
  sortPrimaryAddressData,
  type PrimaryAddressData,
} from "./aboutPrimaryAddress.helpers";

type PrimaryAddressMessageKey = Extract<
  MessageKey,
  `about.primaryAddress.${string}`
>;

const m = (locale: SupportedLocale, key: PrimaryAddressMessageKey) =>
  t(locale, key);

export default function AboutPrimaryAddress() {
  const locale = useBrowserLocale();
  const {
    data: primaryAddressData = [],
    isLoading,
    error,
  } = useQuery<PrimaryAddressData[], Error>({
    queryKey: PRIMARY_ADDRESS_QUERY_KEY,
    queryFn: fetchPrimaryAddressData,
  });
  const sortedPrimaryAddressData = useMemo(
    () => sortPrimaryAddressData(primaryAddressData, locale),
    [locale, primaryAddressData]
  );

  return (
    <article
      className={`tw-w-full tw-pb-12 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <PrimaryAddressHeader locale={locale} />
      <PrimaryAddressOverview locale={locale} />
      <PrimaryAddressRecords
        data={sortedPrimaryAddressData}
        error={error}
        isLoading={isLoading}
        locale={locale}
      />
    </article>
  );
}

function PrimaryAddressHeader({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <header className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-0 sm:tw-pb-12 sm:tw-pt-8 lg:tw-px-2">
      <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
        {m(locale, "about.primaryAddress.title")}
      </h1>
    </header>
  );
}

function PrimaryAddressOverview({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section
      aria-labelledby="primary-address-overview-title"
      className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-py-10 sm:tw-px-0 sm:tw-py-12 lg:tw-px-2"
    >
      <h2
        className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-2xl"
        id="primary-address-overview-title"
      >
        {m(locale, "about.primaryAddress.overview.title")}
      </h2>

      <div className="tw-mt-8 tw-max-w-4xl tw-space-y-8">
        <section aria-labelledby="single-address-title">
          <h3
            className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
            id="single-address-title"
          >
            {m(locale, "about.primaryAddress.single.title")}
          </h3>
          <ul className="tw-m-0 tw-mt-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600">
            <li>{m(locale, "about.primaryAddress.single.body")}</li>
          </ul>
        </section>
        <section aria-labelledby="consolidations-title">
          <h3
            className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
            id="consolidations-title"
          >
            {m(locale, "about.primaryAddress.consolidations.title")}
          </h3>
          <ul className="tw-m-0 tw-mt-2 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600">
            <li>{m(locale, "about.primaryAddress.consolidations.default")}</li>
            <li>
              {m(locale, "about.primaryAddress.consolidations.delegation")}
            </li>
          </ul>
        </section>
      </div>
    </section>
  );
}
