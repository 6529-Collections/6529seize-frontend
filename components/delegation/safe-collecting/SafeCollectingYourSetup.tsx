"use client";

import { getSafeCollectingSectionPath } from "@/components/delegation/safe-collecting-routes";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { formatAddress } from "@/helpers/addressFormatting";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DelegationCenterSection } from "@/types/enums";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type {
  SetupCounterpart,
  SetupWalletFacts,
} from "./safe-collecting-setup";
import { SC_HEADING_3, SC_PANEL, SC_TEXT } from "./SafeCollectingSection";
import {
  useSafeCollectingSetup,
  type SafeCollectingSetupState,
} from "./useSafeCollectingSetup";

type ReadyState = Extract<SafeCollectingSetupState, { kind: "ready" }>;

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function label(name: string) {
  return ADDRESS_PATTERN.test(name) ? formatAddress(name) : name;
}

function names(locale: SupportedLocale, wallets: readonly SetupCounterpart[]) {
  return formatList(
    locale,
    wallets.map((wallet) => label(wallet.display))
  );
}

export default function SafeCollectingYourSetup({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const state = useSafeCollectingSetup();
  const { seizeConnect } = useSeizeConnectContext();

  switch (state.kind) {
    case "disconnected":
      return (
        <div
          className={`${SC_PANEL} tw-flex tw-flex-col tw-items-start tw-gap-4 tw-p-5 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between`}
        >
          <p className={SC_TEXT}>
            {t(locale, "safeCollecting.yourSetup.connectPrompt")}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={seizeConnect}
          >
            {t(locale, "safeCollecting.yourSetup.connect")}
          </Button>
        </div>
      );
    case "loading":
      return (
        <output className={`${SC_PANEL} ${SC_TEXT} tw-block tw-p-5`}>
          {t(locale, "safeCollecting.yourSetup.loading")}
        </output>
      );
    case "error":
      return (
        <div
          role="alert"
          className={`${SC_PANEL} tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-p-5 tw-text-sm tw-leading-6 tw-text-error`}
        >
          <span>{t(locale, "safeCollecting.yourSetup.error")}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={state.retry}
          >
            {t(locale, "safeCollecting.yourSetup.retry")}
          </Button>
        </div>
      );
    case "ready":
      return <ReadySetup locale={locale} state={state} />;
  }
}

function ReadySetup({
  locale,
  state,
}: {
  readonly locale: SupportedLocale;
  readonly state: ReadyState;
}) {
  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className={SC_HEADING_3}>
          {t(locale, "safeCollecting.yourSetup.walletsLabel")}
        </h3>
        <ul className={`${SC_PANEL} tw-m-0 tw-mt-3 tw-list-none tw-p-0`}>
          {state.wallets.map((wallet) => (
            <WalletRow
              key={wallet.wallet}
              locale={locale}
              wallet={wallet}
              isConnected={wallet.wallet === state.connectedWallet}
              isPrimary={wallet.wallet === state.primaryWallet}
            />
          ))}
        </ul>
      </div>
      <Checklist locale={locale} state={state} />
    </div>
  );
}

function WalletRow({
  locale,
  wallet,
  isConnected,
  isPrimary,
}: {
  readonly locale: SupportedLocale;
  readonly wallet: SetupWalletFacts;
  readonly isConnected: boolean;
  readonly isPrimary: boolean;
}) {
  const facts = [
    wallet.managedBy.length > 0 &&
      t(locale, "safeCollecting.yourSetup.managedBy", {
        wallets: names(locale, wallet.managedBy),
      }),
    wallet.manages.length > 0 &&
      t(locale, "safeCollecting.yourSetup.manages", {
        wallets: names(locale, wallet.manages),
      }),
    wallet.mintsFor.length > 0 &&
      t(locale, "safeCollecting.yourSetup.mintsFor", {
        wallets: names(locale, wallet.mintsFor),
      }),
    wallet.airdropsTo.length > 0 &&
      t(locale, "safeCollecting.yourSetup.airdropsTo", {
        wallets: names(locale, wallet.airdropsTo),
      }),
    wallet.airdropsFrom.length > 0 &&
      t(locale, "safeCollecting.yourSetup.airdropsFrom", {
        wallets: names(locale, wallet.airdropsFrom),
      }),
  ].filter((fact): fact is string => typeof fact === "string");

  return (
    <li className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-5 tw-py-4 last:tw-border-b-0">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-min-w-0 tw-break-all tw-text-sm tw-font-semibold tw-text-iron-100">
          {label(wallet.display)}
        </span>
        {isConnected && (
          <span className="tw-text-primary-200 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium">
            {t(locale, "safeCollecting.yourSetup.connected")}
          </span>
        )}
        {isPrimary && (
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-iron-200">
            {t(locale, "safeCollecting.yourSetup.primary")}
          </span>
        )}
        <span className="tw-ml-auto tw-text-xs tw-tabular-nums tw-text-iron-400">
          {t(locale, "safeCollecting.yourSetup.tdh", {
            tdh: formatInteger(locale, Math.round(wallet.tdh)),
          })}
        </span>
      </div>
      {wallet.display !== wallet.wallet && (
        <p className="tw-m-0 tw-mt-0.5 tw-break-all tw-font-mono tw-text-xs tw-text-iron-500">
          {wallet.wallet}
        </p>
      )}
      {facts.length > 0 && (
        <ul className="tw-m-0 tw-mt-2 tw-list-none tw-space-y-1 tw-p-0">
          {facts.map((fact) => (
            <li key={fact} className="tw-text-xs tw-leading-5 tw-text-iron-300">
              {fact}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Checklist({
  locale,
  state,
}: {
  readonly locale: SupportedLocale;
  readonly state: ReadyState;
}) {
  const { checklist } = state;
  const items = [
    {
      key: "combined",
      done: checklist.combined,
      text: checklist.combined
        ? t(locale, "safeCollecting.yourSetup.check.combined.done", {
            count: formatInteger(locale, state.wallets.length),
          })
        : t(locale, "safeCollecting.yourSetup.check.combined.todo"),
      action: t(locale, "safeCollecting.yourSetup.check.combined.action"),
      href: getSafeCollectingSectionPath(
        DelegationCenterSection.BUILD_CONSOLIDATION
      ),
    },
    {
      key: "manager",
      done: checklist.managedWallets.length > 0,
      text:
        checklist.managedWallets.length > 0
          ? t(locale, "safeCollecting.yourSetup.check.manager.done", {
              wallets: names(locale, checklist.managedWallets),
            })
          : t(locale, "safeCollecting.yourSetup.check.manager.todo"),
      action: t(locale, "safeCollecting.yourSetup.check.manager.action"),
      href: getSafeCollectingSectionPath(
        DelegationCenterSection.REGISTER_SUB_DELEGATION
      ),
    },
    {
      key: "mint",
      done: checklist.mintDelegators.length > 0,
      text:
        checklist.mintDelegators.length > 0
          ? t(locale, "safeCollecting.yourSetup.check.mint.done", {
              wallets: names(locale, checklist.mintDelegators),
            })
          : t(locale, "safeCollecting.yourSetup.check.mint.todo"),
      action: t(locale, "safeCollecting.yourSetup.check.mint.action"),
      href: `${getSafeCollectingSectionPath(DelegationCenterSection.REGISTER_DELEGATION)}?use_case=2`,
    },
  ];

  return (
    <div>
      <h3 className={SC_HEADING_3}>
        {t(locale, "safeCollecting.yourSetup.checklistLabel")}
      </h3>
      <ul className="tw-m-0 tw-mt-3 tw-list-none tw-space-y-3 tw-p-0">
        {items.map((item) => (
          <li
            key={item.key}
            className={`${SC_PANEL} tw-flex tw-flex-col tw-gap-3 tw-p-4 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between`}
          >
            <div className="tw-flex tw-items-start tw-gap-3">
              {item.done ? (
                <CheckCircleIcon
                  aria-hidden="true"
                  className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-success"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="tw-mt-1 tw-size-4 tw-flex-shrink-0 tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-600"
                />
              )}
              <p className={SC_TEXT}>{item.text}</p>
            </div>
            {!item.done && (
              <ButtonLink
                href={item.href}
                variant="secondary"
                size="sm"
                className="tw-self-start sm:tw-self-auto"
              >
                {item.action}
              </ButtonLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
