"use client";

import type { ReactNode } from "react";
import { formatEther, getAddress, isAddress } from "viem";
import { AppWalletModalShell } from "@/components/app-wallets/AppWalletModal";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDecimalString, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { AppWalletSigningRequest } from "@/wagmiConfig/appWalletSigningConfirmation";

const VALUE_CLASS_NAME =
  "tw-m-0 tw-break-all tw-font-mono tw-text-sm tw-text-iron-50";
const BLOCK_CLASS_NAME =
  "tw-m-0 tw-max-h-48 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/30 tw-p-3 tw-font-mono tw-text-xs tw-text-iron-100";

function displayAddress(address: string): string {
  return isAddress(address, { strict: false }) ? getAddress(address) : address;
}

function DetailRow({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="tw-space-y-1">
      <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-m-0">{children}</dd>
    </div>
  );
}

function formatNetwork(
  locale: SupportedLocale,
  chainId: number | null,
  chainName: string | null
): string {
  if (chainId === null) {
    return t(locale, "appWallet.signing.notSpecified");
  }
  return t(locale, "appWallet.signing.networkName", {
    name: chainName ?? t(locale, "appWallet.signing.unknownNetwork"),
    id: formatInteger(locale, chainId),
  });
}

function RequestDetails({
  locale,
  request,
}: Readonly<{ locale: SupportedLocale; request: AppWalletSigningRequest }>) {
  if (request.kind === "message") {
    return request.text === null ? (
      <DetailRow label={t(locale, "appWallet.signing.rawMessage")}>
        <pre className={BLOCK_CLASS_NAME}>{request.rawHex}</pre>
      </DetailRow>
    ) : (
      <DetailRow label={t(locale, "appWallet.signing.message")}>
        <pre className={BLOCK_CLASS_NAME}>{request.text}</pre>
      </DetailRow>
    );
  }

  if (request.kind === "typedData") {
    return (
      <>
        <DetailRow label={t(locale, "appWallet.signing.primaryType")}>
          <p className={VALUE_CLASS_NAME}>{request.primaryType}</p>
        </DetailRow>
        <DetailRow label={t(locale, "appWallet.signing.domainName")}>
          <p className={VALUE_CLASS_NAME}>
            {request.domainName ?? t(locale, "appWallet.signing.notSpecified")}
          </p>
        </DetailRow>
        <DetailRow label={t(locale, "appWallet.signing.network")}>
          <p className={VALUE_CLASS_NAME}>
            {formatNetwork(
              locale,
              request.domainChainId,
              request.domainChainName
            )}
          </p>
        </DetailRow>
        <DetailRow label={t(locale, "appWallet.signing.verifyingContract")}>
          <p className={VALUE_CLASS_NAME}>
            {request.verifyingContract === null
              ? t(locale, "appWallet.signing.notSpecified")
              : displayAddress(request.verifyingContract)}
          </p>
        </DetailRow>
        <DetailRow label={t(locale, "appWallet.signing.typedDataContent")}>
          <pre className={BLOCK_CLASS_NAME}>{request.messageJson}</pre>
        </DetailRow>
      </>
    );
  }

  return (
    <>
      <DetailRow label={t(locale, "appWallet.signing.to")}>
        <p className={VALUE_CLASS_NAME}>
          {request.to === null
            ? t(locale, "appWallet.signing.newContract")
            : displayAddress(request.to)}
        </p>
      </DetailRow>
      <DetailRow label={t(locale, "appWallet.signing.value")}>
        <p className={VALUE_CLASS_NAME}>
          {t(locale, "appWallet.signing.valueEth", {
            amount: formatDecimalString(locale, formatEther(request.valueWei)),
          })}
        </p>
      </DetailRow>
      <DetailRow label={t(locale, "appWallet.signing.network")}>
        <p className={VALUE_CLASS_NAME}>
          {formatNetwork(locale, request.chainId, request.chainName)}
        </p>
      </DetailRow>
      <DetailRow label={t(locale, "appWallet.signing.callData")}>
        <p className={VALUE_CLASS_NAME}>
          {formatCallData(locale, request.hasCallData, request.selector)}
        </p>
      </DetailRow>
    </>
  );
}

function formatCallData(
  locale: SupportedLocale,
  hasCallData: boolean,
  selector: string | null
): string {
  if (selector !== null) {
    return t(locale, "appWallet.signing.callDataSelector", { selector });
  }
  return t(
    locale,
    hasCallData
      ? "appWallet.signing.callDataPresent"
      : "appWallet.signing.callDataNone"
  );
}

function getTitleKey(request: AppWalletSigningRequest) {
  if (request.kind === "transaction") {
    return "appWallet.signing.transactionTitle" as const;
  }
  return request.kind === "typedData"
    ? ("appWallet.signing.typedDataTitle" as const)
    : ("appWallet.signing.messageTitle" as const);
}

/**
 * The app's own approval step for an app-wallet signature or transaction.
 * It shows the exact request the connector is about to sign.
 */
export function AppWalletSigningConfirmationModal({
  request,
  onConfirm,
  onCancel,
}: Readonly<{
  request: AppWalletSigningRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  const locale = useBrowserLocale();

  return (
    <AppWalletModalShell
      show={request !== null}
      onHide={onCancel}
      title={request === null ? "" : t(locale, getTitleKey(request))}
      footer={
        <>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="md"
          >
            {t(locale, "appWallet.modal.cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} variant="action" size="md">
            {t(
              locale,
              request?.kind === "transaction"
                ? "appWallet.signing.approveTransaction"
                : "appWallet.signing.sign"
            )}
          </Button>
        </>
      }
    >
      {request === null ? null : (
        <div className="tw-space-y-4">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "appWallet.signing.help")}
          </p>
          <dl className="tw-m-0 tw-space-y-4">
            <DetailRow label={t(locale, "appWallet.signing.wallet")}>
              <p className={VALUE_CLASS_NAME}>
                {displayAddress(request.walletAddress)}
              </p>
            </DetailRow>
            <RequestDetails locale={locale} request={request} />
          </dl>
        </div>
      )}
    </AppWalletModalShell>
  );
}
