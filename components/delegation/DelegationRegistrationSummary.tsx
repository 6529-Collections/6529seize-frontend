"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, type ReactNode } from "react";
import type { DelegationCollection } from "./delegation-constants";
import {
  formatDelegationExpiryLocal,
  getViewerTimeZone,
  isNonExpiringDelegationExpiry,
} from "./delegation-expiry";
import {
  findDelegationCollectionOption,
  findDelegationUseCaseOption,
} from "./delegation-options";

/** The values a register-delegation write sends, in contract terms. */
export interface DelegationRegistration {
  /** Set when a delegation manager registers for another wallet. */
  readonly originalDelegator?: string | undefined;
  readonly collection: string;
  readonly delegate: string;
  /** Unix seconds; `NEVER_DATE` when the delegation does not expire. */
  readonly expiry: number;
  readonly useCase: number;
  readonly allTokens: boolean;
  readonly tokenId: number | undefined;
}

const ADDRESS_VALUE_CLASS_NAME =
  "tw-block tw-break-all tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-50";

function SummaryRow(props: Readonly<{ term: string; children: ReactNode }>) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-1 sm:tw-grid-cols-12 sm:tw-gap-4">
      <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-300 sm:tw-col-span-3">
        {props.term}
      </dt>
      <dd className="tw-m-0 tw-min-w-0 tw-text-base tw-leading-6 tw-text-iron-50 sm:tw-col-span-9">
        {props.children}
      </dd>
    </div>
  );
}

/**
 * The exact registration the submit button will ask the wallet to sign. It is
 * rendered from the same values the form passes to the contract write, and
 * only while the form is complete.
 */
export default function DelegationRegistrationSummary(
  props: Readonly<{
    registration: DelegationRegistration;
    collectionOptions: readonly DelegationCollection[];
    ready: boolean;
  }>
) {
  const { registration, collectionOptions, ready } = props;
  const locale = useBrowserLocale();
  const titleId = useId();
  const collection = findDelegationCollectionOption(
    registration.collection,
    collectionOptions
  );
  const useCase = findDelegationUseCaseOption(registration.useCase);

  return (
    <section
      aria-labelledby={titleId}
      className="tw-mb-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4"
    >
      <h3
        id={titleId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
      >
        {t(locale, "delegation.summary.title")}
      </h3>
      {ready && collection && useCase ? (
        <>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
            {t(locale, "delegation.summary.description")}
          </p>
          <dl className="tw-mb-0 tw-mt-3 tw-flex tw-flex-col tw-gap-3">
            {registration.originalDelegator ? (
              <SummaryRow
                term={t(locale, "delegation.summary.originalDelegator")}
              >
                <span className={ADDRESS_VALUE_CLASS_NAME}>
                  {registration.originalDelegator}
                </span>
              </SummaryRow>
            ) : null}
            <SummaryRow term={t(locale, "delegation.summary.collection")}>
              <span className="tw-block">{collection.title}</span>
              <span className={ADDRESS_VALUE_CLASS_NAME}>
                {registration.collection}
              </span>
            </SummaryRow>
            <SummaryRow term={t(locale, "delegation.summary.useCase")}>
              {t(locale, "delegation.summary.useCaseValue", {
                number: registration.useCase,
                name: useCase.display,
              })}
            </SummaryRow>
            <SummaryRow term={t(locale, "delegation.summary.delegate")}>
              <span className={ADDRESS_VALUE_CLASS_NAME}>
                {registration.delegate}
              </span>
            </SummaryRow>
            <SummaryRow term={t(locale, "delegation.summary.expiry")}>
              {isNonExpiringDelegationExpiry(registration.expiry)
                ? t(locale, "delegation.summary.expiryNever")
                : formatDelegationExpiryLocal(
                    locale,
                    registration.expiry,
                    getViewerTimeZone()
                  )}
            </SummaryRow>
            <SummaryRow term={t(locale, "delegation.summary.tokens")}>
              {registration.allTokens
                ? t(locale, "delegation.summary.tokensAll")
                : t(locale, "delegation.summary.tokenId", {
                    tokenId: String(registration.tokenId),
                  })}
            </SummaryRow>
          </dl>
        </>
      ) : (
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "delegation.summary.incomplete")}
        </p>
      )}
    </section>
  );
}
