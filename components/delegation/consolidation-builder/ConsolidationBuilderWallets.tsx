"use client";

import Button from "@/components/utils/button/Button";
import { CONSOLIDATION_WALLET_LIMIT } from "@/constants/consolidation.constants";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  DELEGATION_FIELD_CLASS_NAME,
  DELEGATION_FIELD_LABEL_CLASS_NAME,
} from "../delegation-ui";
import {
  toWalletKey,
  type ConsolidationWalletIssue,
} from "./consolidation-plan";

export interface ConsolidationWalletEntry {
  readonly id: string;
  readonly value: string;
}

export type ConsolidationGroupLookupState = "ready" | "loading" | "error";

const MIN_WALLET_ROWS = 2;

const BADGE_CLASS_NAME =
  "tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-leading-4";

const ISSUE_MESSAGE_KEYS = {
  invalid: "delegation.consolidationBuilder.wallets.invalid",
  duplicate: "delegation.consolidationBuilder.wallets.duplicate",
} as const satisfies Record<ConsolidationWalletIssue, string>;

function WalletBadges(
  props: Readonly<{
    locale: SupportedLocale;
    isConnected: boolean;
    isMember: boolean;
  }>
) {
  return (
    <>
      {props.isConnected && (
        <span
          className={`${BADGE_CLASS_NAME} tw-text-primary-200 tw-border-primary-400/40 tw-bg-primary-500/10`}
        >
          {t(props.locale, "delegation.consolidationBuilder.wallets.connected")}
        </span>
      )}
      {props.isMember && (
        <span
          className={`${BADGE_CLASS_NAME} tw-border-white/10 tw-bg-white/[0.05] tw-text-iron-300`}
        >
          {t(props.locale, "delegation.consolidationBuilder.wallets.member")}
        </span>
      )}
    </>
  );
}

function GroupLookupStatus(
  props: Readonly<{
    locale: SupportedLocale;
    state: ConsolidationGroupLookupState;
    onRetry: () => void;
  }>
) {
  if (props.state === "loading") {
    return (
      <output className="tw-mb-0 tw-mt-3 tw-block tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(
          props.locale,
          "delegation.consolidationBuilder.wallets.loadingGroup"
        )}
      </output>
    );
  }
  if (props.state === "error") {
    return (
      <div
        role="alert"
        className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-text-sm tw-leading-6 tw-text-error"
      >
        <span>
          {t(
            props.locale,
            "delegation.consolidationBuilder.wallets.groupError"
          )}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={props.onRetry}
        >
          {t(props.locale, "delegation.consolidationBuilder.retry")}
        </Button>
      </div>
    );
  }
  return null;
}

/** Editable list of up to CONSOLIDATION_WALLET_LIMIT wallet addresses. */
export function ConsolidationBuilderWallets(
  props: Readonly<{
    locale: SupportedLocale;
    entries: readonly ConsolidationWalletEntry[];
    issues: readonly (ConsolidationWalletIssue | undefined)[];
    validCount: number;
    connectedKey: string | undefined;
    existingMembers: ReadonlySet<string>;
    groupLookupState: ConsolidationGroupLookupState;
    onChange: (id: string, value: string) => void;
    onRemove: (id: string) => void;
    onAdd: () => void;
    onRetryGroups: () => void;
  }>
) {
  const { locale, entries, issues } = props;
  const limit = formatInteger(locale, CONSOLIDATION_WALLET_LIMIT);
  const canAdd = entries.length < CONSOLIDATION_WALLET_LIMIT;
  const canRemove = entries.length > MIN_WALLET_ROWS;

  return (
    <section
      aria-labelledby="consolidation-builder-wallets"
      className="tw-mb-6"
    >
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <h3
          id="consolidation-builder-wallets"
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "delegation.consolidationBuilder.wallets.title")}
        </h3>
        <span className="tw-text-sm tw-text-iron-400">
          {t(locale, "delegation.consolidationBuilder.wallets.count", {
            count: formatInteger(locale, props.validCount),
            limit,
          })}
        </span>
      </div>
      <ol className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
        {entries.map((entry, index) => {
          const position = formatInteger(locale, index + 1);
          const inputId = `consolidation-wallet-${entry.id}`;
          const errorId = `${inputId}-error`;
          const issue = issues[index];
          const key = toWalletKey(entry.value);
          return (
            <li key={entry.id}>
              <div className="tw-mb-1.5 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                <label
                  htmlFor={inputId}
                  className={DELEGATION_FIELD_LABEL_CLASS_NAME}
                >
                  {t(locale, "delegation.consolidationBuilder.wallets.label", {
                    position,
                  })}
                </label>
                <WalletBadges
                  locale={locale}
                  isConnected={!!key && key === props.connectedKey}
                  isMember={!!key && props.existingMembers.has(key)}
                />
              </div>
              <div className="tw-flex tw-items-start tw-gap-2">
                <input
                  id={inputId}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={t(
                    locale,
                    "delegation.consolidationBuilder.wallets.inputLabel",
                    { position }
                  )}
                  aria-invalid={issue ? true : undefined}
                  aria-describedby={issue ? errorId : undefined}
                  placeholder={t(
                    locale,
                    "delegation.consolidationBuilder.wallets.placeholder"
                  )}
                  value={entry.value}
                  onChange={(event) =>
                    props.onChange(entry.id, event.target.value)
                  }
                  className={`${DELEGATION_FIELD_CLASS_NAME} tw-font-mono tw-text-sm`}
                />
                {canRemove && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="tw-w-11 tw-px-0"
                    aria-label={t(
                      locale,
                      "delegation.consolidationBuilder.wallets.remove",
                      { position }
                    )}
                    onClick={() => props.onRemove(entry.id)}
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="tw-size-4"
                      aria-hidden="true"
                    />
                  </Button>
                )}
              </div>
              {issue && (
                <p
                  id={errorId}
                  className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-5 tw-text-error"
                >
                  {t(locale, ISSUE_MESSAGE_KEYS[issue])}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        {canAdd ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={props.onAdd}
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="tw-size-3.5"
              aria-hidden="true"
            />
            {t(locale, "delegation.consolidationBuilder.wallets.add")}
          </Button>
        ) : (
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "delegation.consolidationBuilder.wallets.limitReached", {
              limit,
            })}
          </p>
        )}
      </div>
      <GroupLookupStatus
        locale={locale}
        state={props.groupLookupState}
        onRetry={props.onRetryGroups}
      />
    </section>
  );
}
