"use client";

import { isValidEthAddress } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
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

/**
 * The values a register-delegation write sends, in contract terms. While the
 * form is incomplete some values are still unset; the write is enabled only
 * once the form validates.
 */
export interface DelegationRegistration {
  /** Set when a delegation manager registers for another wallet. */
  readonly originalDelegator?: string | undefined;
  /** The collection option value; "0" until one is chosen. */
  readonly collection: string;
  /** The resolved delegate wallet; "" until one is entered. */
  readonly delegate: string;
  /**
   * Unix seconds; `NEVER_DATE` when the delegation does not expire, and null
   * while a chosen expiry date is still missing.
   */
  readonly expiry: number | null;
  /** The use case number; 0 until one is chosen. */
  readonly useCase: number;
  readonly allTokens: boolean;
  readonly tokenId: number | undefined;
}

const ADDRESS_VALUE_CLASS_NAME =
  "tw-block tw-break-all tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-50";

function SummaryRow(
  props: Readonly<{ term: string; notSet: string; value: ReactNode }>
) {
  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-1 sm:tw-grid-cols-12 sm:tw-gap-4">
      <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-300 sm:tw-col-span-3">
        {props.term}
      </dt>
      <dd className="tw-m-0 tw-min-w-0 tw-text-base tw-leading-6 tw-text-iron-50 sm:tw-col-span-9">
        {props.value ?? (
          <span className="tw-text-iron-400">{props.notSet}</span>
        )}
      </dd>
    </div>
  );
}

function getExpiryValue(
  locale: SupportedLocale,
  expiry: number | null
): string | null {
  if (expiry === null) {
    return null;
  }
  return isNonExpiringDelegationExpiry(expiry)
    ? t(locale, "delegation.summary.expiryNever")
    : formatDelegationExpiryLocal(locale, expiry, getViewerTimeZone());
}

function getTokensValue(
  locale: SupportedLocale,
  registration: DelegationRegistration
): string | null {
  if (registration.allTokens) {
    return t(locale, "delegation.summary.tokensAll");
  }
  const { tokenId } = registration;
  return tokenId !== undefined && tokenId > 0
    ? t(locale, "delegation.summary.tokenId", { tokenId: String(tokenId) })
    : null;
}

/**
 * The registration the submit button will ask the wallet to sign. It renders
 * from the same object the form passes to the contract write, and shows each
 * value as soon as the form has it ("Not set" until then).
 */
export default function DelegationRegistrationSummary(
  props: Readonly<{
    registration: DelegationRegistration;
    collectionOptions: readonly DelegationCollection[];
  }>
) {
  const { registration, collectionOptions } = props;
  const locale = useBrowserLocale();
  const titleId = useId();
  const notSet = t(locale, "delegation.summary.notSet");
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
      <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "delegation.summary.description")}
      </p>
      <dl className="tw-mb-0 tw-mt-3 tw-flex tw-flex-col tw-gap-3">
        {registration.originalDelegator ? (
          <SummaryRow
            term={t(locale, "delegation.summary.originalDelegator")}
            notSet={notSet}
            value={
              <span className={ADDRESS_VALUE_CLASS_NAME}>
                {registration.originalDelegator}
              </span>
            }
          />
        ) : null}
        <SummaryRow
          term={t(locale, "delegation.summary.collection")}
          notSet={notSet}
          value={
            collection ? (
              <>
                <span className="tw-block">{collection.title}</span>
                <span className={ADDRESS_VALUE_CLASS_NAME}>
                  {registration.collection}
                </span>
              </>
            ) : null
          }
        />
        <SummaryRow
          term={t(locale, "delegation.summary.useCase")}
          notSet={notSet}
          value={
            useCase
              ? t(locale, "delegation.register.useCase.option", {
                  number: registration.useCase,
                  name: useCase.display,
                })
              : null
          }
        />
        <SummaryRow
          term={t(locale, "delegation.summary.delegate")}
          notSet={notSet}
          value={
            isValidEthAddress(registration.delegate) ? (
              <span className={ADDRESS_VALUE_CLASS_NAME}>
                {registration.delegate}
              </span>
            ) : null
          }
        />
        <SummaryRow
          term={t(locale, "delegation.summary.expiry")}
          notSet={notSet}
          value={getExpiryValue(locale, registration.expiry)}
        />
        <SummaryRow
          term={t(locale, "delegation.summary.tokens")}
          notSet={notSet}
          value={getTokensValue(locale, registration)}
        />
      </dl>
    </section>
  );
}
