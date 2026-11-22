"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useAccount, useConfig } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import Button from "@/components/utils/button/Button";
import { useSetTitle } from "@/contexts/TitleContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";
import {
  serverPendingJoins,
  snapshotPendingJoins,
  subscribePendingJoins,
} from "@/lib/chain-identity/pendingJoin";
import { formatFake6529 } from "./chainAmount";
import { ChainSection, shortHex } from "./chainIdentityUi";
import ChainIdentityCreate from "./ChainIdentityCreate";
import ChainIdentityFees from "./ChainIdentityFees";
import ChainIdentityHandle from "./ChainIdentityHandle";
import ChainIdentityProfile from "./ChainIdentityProfile";
import ChainIdentitySession from "./ChainIdentitySession";
import ChainIdentityWallets from "./ChainIdentityWallets";
import ChainPendingJoins from "./ChainPendingJoins";
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
  const { identity, ops, balances, session, refresh } =
    useChainIdentityData(wallet);
  const joins = useSyncExternalStore(
    subscribePendingJoins,
    snapshotPendingJoins,
    serverPendingJoins
  );

  const changed = () => {
    void refresh();
  };

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

  const pending = (
    <ChainPendingJoins
      joins={joins}
      config={config}
      connected={wallet}
      onChanged={changed}
    />
  );

  if (!wallet) {
    return (
      <main className={NETWORK_REFERENCE_PAGE_CLASSES}>
        {header}
        <div className="tw-space-y-4">
          {pending}
          <ChainSection
            id="chain-identity-connect"
            heading={t(locale, "chainIdentity.summary.heading")}
            body={t(locale, "chainIdentity.connect.body")}
          >
            <Button variant="primary" size="md" onClick={seizeConnect}>
              {t(locale, "chainIdentity.connect.action")}
            </Button>
          </ChainSection>
        </div>
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
        {pending}
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
                    current.handle ?? t(locale, "chainIdentity.summary.noHandle")
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

        <ChainIdentityFees
          wallet={wallet}
          config={config}
          principalId={current?.principalId ?? null}
          currencyAsset={ops.data.currencyAsset}
          walletBalance={balances.data?.wallet ?? null}
          onChanged={changed}
        />

        {!current && (
          <ChainIdentityCreate
            wallet={wallet}
            config={config}
            onChanged={changed}
          />
        )}

        {current && (
          <>
            <ChainIdentitySession
              wallet={wallet}
              config={config}
              principalId={current.principalId}
              sessionKey={session.data ?? null}
              onChanged={changed}
            />
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
              onChanged={changed}
              onJoinHeld={changed}
            />
            <ChainSection
              id="chain-identity-delegations"
              heading={t(locale, "chainIdentity.delegations.heading")}
              body={t(locale, "chainIdentity.delegations.body")}
            >
              <Link
                href="/safe-collecting"
                className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-200"
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
