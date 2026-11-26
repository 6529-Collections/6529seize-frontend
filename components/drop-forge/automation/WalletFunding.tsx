"use client";
import { useState } from "react";
import { formatEther } from "viem";
import { useChainId, useSwitchChain } from "wagmi";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
import Button from "@/components/utils/button/Button";
import OnchainTransactionModal from "@/components/common/OnchainTransactionModal";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/drop-forge";
import { useWalletFunding } from "./useWalletFunding";
import { isFundingAmountDraft, validFundingAmount } from "./funding-amount";

export default function WalletFunding({
  settings,
  onConfirmed,
}: Readonly<{ settings: ApiDropForgeSettings; onConfirmed: () => void }>) {
  const locale = useBrowserLocale();
  const [amount, setAmount] = useState("");
  const [expanded, setExpanded] = useState(false);
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const funding = useWalletFunding(settings, amount, onConfirmed);
  return (
    <div className="tw-mt-3 tw-space-y-3">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <p className="tw-m-0 tw-min-w-0 tw-break-all tw-text-sm tw-text-iron-300">
          {t(locale, "dropForge.settings.balance")}:{" "}
          <strong>
            {settings.balance_wei === null
              ? t(locale, "dropForge.settings.unavailableBalance")
              : formatEther(BigInt(settings.balance_wei))}
          </strong>
        </p>
        {settings.can_top_up && (
          <Button
            disabled={funding.busy}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {t(locale, "dropForge.funding.topUp")}
          </Button>
        )}
      </div>
      {expanded && settings.can_top_up && (
        <div className="tw-space-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-4">
          <p className="tw-m-0 tw-break-all tw-text-xs tw-text-iron-400">
            {t(locale, "dropForge.funding.recipient", {
              address: settings.signer_address,
            })}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "dropForge.funding.network", {
              network: funding.chain.name,
            })}
          </p>
          {chainId !== settings.chain_id ? (
            <Button
              loading={isPending}
              onClick={() => switchChain({ chainId: settings.chain_id })}
            >
              {t(locale, "dropForge.funding.switch", {
                network: funding.chain.name,
              })}
            </Button>
          ) : (
            <>
              <label className="tw-block tw-text-sm tw-text-iron-300">
                {t(locale, "dropForge.funding.amount")}
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  value={amount}
                  disabled={funding.busy}
                  onChange={(event) => {
                    const value = event.target.value.replace(",", ".");
                    if (isFundingAmountDraft(value)) {
                      setAmount(value.startsWith(".") ? `0${value}` : value);
                    }
                  }}
                  className="tw-mt-2 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-3 tw-text-iron-50 focus-visible:tw-outline-primary-400"
                />
              </label>
              {funding.review ? (
                <div className="tw-space-y-3">
                  <p className="tw-text-sm tw-text-iron-300">{amount} ETH</p>
                  <p className="tw-text-xs tw-text-iron-400">
                    {t(locale, "dropForge.funding.fee", {
                      amount: funding.review.fee,
                    })}
                  </p>
                  <div className="tw-flex tw-flex-wrap tw-gap-2">
                    <Button
                      loading={funding.busy}
                      onClick={() => void funding.submit()}
                    >
                      {t(locale, "dropForge.funding.confirm")}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={funding.busy}
                      onClick={funding.cancelReview}
                    >
                      {t(locale, "dropForge.funding.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  loading={funding.busy}
                  disabled={!validFundingAmount(amount)}
                  onClick={() => void funding.prepare()}
                >
                  {t(locale, "dropForge.funding.review")}
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {funding.error && (
        <p role="alert" className="tw-break-words tw-text-sm tw-text-rose-300">
          {funding.error}
        </p>
      )}
      {funding.pending && (
        <output className="tw-block tw-text-xs tw-text-amber-300">
          {t(locale, "dropForge.funding.reportPending")}
        </output>
      )}
      {funding.transaction && (
        <OnchainTransactionModal
          title={t(locale, "dropForge.funding.topUp")}
          status={funding.transaction.status}
          transactionHash={funding.transaction.hash}
          message={funding.transaction.message}
          chain={funding.chain}
          onClose={funding.closeTransaction}
        />
      )}
    </div>
  );
}
