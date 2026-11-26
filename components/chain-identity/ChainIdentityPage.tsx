"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useAccount, useConfig } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import Button from "@/components/utils/button/Button";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import type { ChainIdentity } from "@/lib/chain-identity/gateway";
import {
  getIdentityFreezeAtMs,
  getIdentitySwitchOnMs,
} from "@/lib/identity-move/schedule";
import { formatFake6529 } from "./chainAmount";
import { ChainSection, shortHex } from "./chainIdentityUi";
import ChainIdentityCreate from "./ChainIdentityCreate";
import ChainIdentityFees from "./ChainIdentityFees";
import ChainIdentityHandle from "./ChainIdentityHandle";
import ChainIdentityProfile from "./ChainIdentityProfile";
import ChainIdentitySession from "./ChainIdentitySession";
import ChainIdentityWallets from "./ChainIdentityWallets";
import ChainJoinRequests from "./ChainJoinRequests";
import { useChainIdentityData } from "./useChainIdentityData";

function SummaryRow({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1 tw-break-all tw-text-sm tw-text-iron-100">
        {value}
      </dd>
      {hint && (
        <dd className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">{hint}</dd>
      )}
    </div>
  );
}

const DECIMAL = /^\d+$/;

/**
 * REP and NIC left to give: the identity's TDH (its `level.tdh`, the cap the
 * chain checks) less what it has given in each, both from the chain.
 */
function ChainRatingSummary({
  locale,
  identity,
  given,
}: {
  readonly locale: SupportedLocale;
  readonly identity: ChainIdentity;
  readonly given: { readonly rep: bigint; readonly nic: bigint } | undefined;
}) {
  const raw = identity.level?.tdh;
  const tdh = raw !== undefined && DECIMAL.test(raw) ? BigInt(raw) : null;
  const shown = (value: bigint) => formatInteger(locale, Number(value));
  const left = (spent: bigint | undefined) => {
    if (tdh === null || spent === undefined) {
      return t(locale, "chainIdentity.rating.unknown");
    }
    return t(locale, "chainIdentity.rating.left", {
      left: shown(tdh > spent ? tdh - spent : 0n),
      tdh: shown(tdh),
    });
  };
  return (
    <ChainSection
      id="chain-identity-rating"
      heading={t(locale, "chainIdentity.rating.heading")}
      body={
        tdh === null
          ? t(locale, "chainIdentity.rating.bodyNoTdh")
          : t(locale, "chainIdentity.rating.body", { tdh: shown(tdh) })
      }
    >
      <dl className="tw-m-0 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <SummaryRow
          label={t(locale, "chainIdentity.rating.rep")}
          value={left(given?.rep)}
        />
        <SummaryRow
          label={t(locale, "chainIdentity.rating.nic")}
          value={left(given?.nic)}
        />
      </dl>
    </ChainSection>
  );
}

/**
 * `/network/identity`: the connected wallet's identity on the 6529 Network
 * and every change this site makes there.
 */
export default function ChainIdentityPage() {
  const locale = useBrowserLocale();
  useSetTitle(t(locale, "chainIdentity.title"));
  const config = useConfig();
  const { address } = useAccount();
  const { seizeConnect } = useSeizeConnectContext();
  const wallet = address;
  const active = useChainIdentityActive();
  const { identity, ops, balances, given, session, refresh } =
    useChainIdentityData(active ? wallet : undefined);

  // Stable, so effects that refresh after a change run once per change.
  const changed = useCallback(() => {
    void refresh();
  }, [refresh]);

  const header = (
    <header className="tw-pb-6">
      <h1 className={NETWORK_PAGE_TITLE_CLASSES}>
        {t(locale, "chainIdentity.title")}
      </h1>
      <p className="tw-mb-0 tw-mt-2 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">
        {t(locale, "chainIdentity.intro")}
      </p>
    </header>
  );

  if (!active) {
    const freezeAtMs = getIdentityFreezeAtMs();
    return (
      <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
        {header}
        <p role="status" className="tw-text-sm tw-text-iron-300">
          {freezeAtMs === null
            ? t(locale, "chainIdentity.notOpenNoDate")
            : t(locale, "chainIdentity.notOpen", {
                date: formatDate(locale, getIdentitySwitchOnMs(freezeAtMs), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
        </p>
      </main>
    );
  }

  if (!wallet) {
    return (
      <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
        {header}
        <ChainSection
          id="chain-identity-connect"
          heading={t(locale, "chainIdentity.summary.heading")}
          body={t(locale, "chainIdentity.connect.body")}
        >
          <Button variant="primary" size="md" onClick={seizeConnect}>
            {t(locale, "chainIdentity.connect.action")}
          </Button>
        </ChainSection>
      </main>
    );
  }

  if (identity.isError || ops.isError) {
    return (
      <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
        {header}
        <p role="alert" className="tw-text-sm tw-text-iron-300">
          {t(locale, "chainIdentity.readError")}
        </p>
        <Button variant="secondary" size="md" onClick={() => void refresh()}>
          {t(locale, "chainIdentity.retry")}
        </Button>
      </main>
    );
  }

  if (identity.isPending || ops.isPending) {
    return (
      <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
        {header}
        <p role="status" className="tw-text-sm tw-text-iron-400">
          {t(locale, "chainIdentity.loading")}
        </p>
      </main>
    );
  }

  const current = identity.data;
  const rejoinWaitMs =
    typeof ops.data.rejoinWaitMs === "number" ? ops.data.rejoinWaitMs : null;
  const amount = (value: bigint | null | undefined) =>
    value === null || value === undefined
      ? "—"
      : t(locale, "chainIdentity.amount", {
          amount: formatFake6529(locale, value),
        });

  return (
    <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
      {header}
      <div className="tw-max-w-4xl tw-space-y-4">
        {!current && (
          <ChainJoinRequests
            wallet={wallet}
            config={config}
            rejoinWaitMs={rejoinWaitMs}
            onChanged={changed}
          />
        )}
        <ChainSection
          id="chain-identity-summary"
          heading={t(locale, "chainIdentity.summary.heading")}
        >
          <dl className="tw-m-0 tw-grid tw-gap-4 sm:tw-grid-cols-2">
            {current && (
              <>
                <SummaryRow
                  label={t(locale, "chainIdentity.summary.handle")}
                  value={
                    current.handle ??
                    t(locale, "chainIdentity.summary.noHandle")
                  }
                />
                <SummaryRow
                  label={t(locale, "chainIdentity.summary.id")}
                  value={shortHex(current.principalId)}
                />
                <SummaryRow
                  label={t(locale, "chainIdentity.summary.identityBalance")}
                  value={amount(balances.data?.identity)}
                  hint={t(locale, "chainIdentity.summary.identityBalanceHint")}
                />
              </>
            )}
            <SummaryRow
              label={t(locale, "chainIdentity.summary.walletBalance")}
              value={amount(balances.data?.wallet)}
              hint={t(locale, "chainIdentity.summary.walletBalanceHint")}
            />
          </dl>
        </ChainSection>

        {current && (
          <ChainRatingSummary
            locale={locale}
            identity={current}
            given={given.data}
          />
        )}

        <ChainIdentityFees
          wallet={wallet}
          config={config}
          principalId={current?.principalId ?? null}
          currencyAsset={ops.data.currencyAsset}
          walletBalance={balances.data?.wallet ?? null}
          identityBalance={balances.data?.identity ?? null}
          onChanged={changed}
        />

        {!current && (
          <ChainIdentityCreate
            wallet={wallet}
            config={config}
            rejoinWaitMs={rejoinWaitMs}
            onChanged={changed}
          />
        )}

        {current && (
          <>
            <ChainIdentityHandle
              wallet={wallet}
              config={config}
              principalId={current.principalId}
              currentHandle={current.handle}
              onChanged={changed}
            />
            <ChainIdentityProfile
              wallet={wallet}
              config={config}
              identity={current}
              sessionKey={session.data ?? null}
              onChanged={changed}
            />
            <ChainIdentityWallets
              wallet={wallet}
              config={config}
              identity={current}
              rejoinWaitMs={rejoinWaitMs}
              onChanged={changed}
            />
            <ChainIdentitySession
              wallet={wallet}
              config={config}
              principalId={current.principalId}
              sessionKey={session.data ?? null}
              onChanged={changed}
            />
            <ChainSection
              id="chain-identity-delegations"
              heading={t(locale, "chainIdentity.delegations.heading")}
              body={t(locale, "chainIdentity.delegations.body")}
            >
              <Link
                href="/safe-collecting"
                className="hover:tw-text-primary-200 tw-text-sm tw-font-semibold tw-text-primary-300"
              >
                {t(locale, "chainIdentity.delegations.link")}
              </Link>
            </ChainSection>
          </>
        )}
      </div>
    </main>
  );
}
