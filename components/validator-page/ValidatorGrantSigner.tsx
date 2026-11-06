"use client";

import "@/i18n/namespaces/validator-sign";
import { useRef, useState } from "react";
import { getAddress, recoverTypedDataAddress, type Hex } from "viem";
import { useAccount, useConfig, useSignTypedData } from "wagmi";
import { getAccount } from "wagmi/actions";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isE2eeSignatureRejection } from "@/components/e2ee/e2eeErrors";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  isValidatorSignature,
  type ValidatorGrant,
} from "@/lib/validator-page/grant";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TEXT_BUTTON,
} from "./validatorStyles";

const BUTTON = `${PRIMARY_BUTTON} disabled:tw-cursor-not-allowed disabled:tw-opacity-50`;
const FIELD =
  "tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-950 tw-p-3 tw-font-mono tw-text-sm tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

export default function ValidatorGrantSigner({
  grant,
  onReset,
}: {
  readonly grant: ValidatorGrant;
  readonly onReset: () => void;
}) {
  const locale = useBrowserLocale();
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const { seizeConnect, seizeConnectFresh, isSafeWallet } =
    useSeizeConnectContext();
  const { signTypedDataAsync } = useSignTypedData();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [signature, setSignature] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const expected = grant.message.account;
  const matches =
    isConnected && address?.toLowerCase() === expected.toLowerCase();
  const revoke = grant.message.keys.length === 0;

  const actionLabel = t(
    locale,
    revoke ? "validator.sign.signRevoke" : "validator.sign.sign"
  );
  const signLabel = pending ? t(locale, "validator.sign.signing") : actionLabel;

  async function sign() {
    if (busy.current || !confirmed || isSafeWallet) return;
    const live = getAccount(config);
    if (
      !live.isConnected ||
      live.address?.toLowerCase() !== expected.toLowerCase()
    ) {
      setError(t(locale, "validator.sign.error.changed"));
      return;
    }
    busy.current = true;
    setPending(true);
    setSignature(null);
    setError(null);
    try {
      const signed = await signTypedDataAsync({ ...grant, account: expected });
      if (
        !isValidatorSignature(signed) ||
        getAddress(
          await recoverTypedDataAddress({ ...grant, signature: signed })
        ) !== expected
      ) {
        setError(t(locale, "validator.sign.error.signature"));
        return;
      }
      const current = getAccount(config);
      if (
        !current.isConnected ||
        current.address?.toLowerCase() !== expected.toLowerCase() ||
        current.connector?.uid !== live.connector?.uid
      ) {
        setError(t(locale, "validator.sign.error.changed"));
        return;
      }
      setSignature(signed);
    } catch (cause) {
      setError(
        t(
          locale,
          isE2eeSignatureRejection(cause)
            ? "validator.sign.error.rejected"
            : "validator.sign.error.sign"
        )
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function changeWallet() {
    setSignature(null);
    setCopyStatus(null);
    setError(null);
    try {
      await seizeConnectFresh();
    } catch {
      setError(t(locale, "validator.sign.error.connect"));
    }
  }

  async function copySignature() {
    if (!signature) return;
    try {
      await navigator.clipboard.writeText(signature);
      setCopyStatus(t(locale, "validator.sign.copied"));
    } catch {
      setCopyStatus(t(locale, "validator.sign.copyError"));
    }
  }

  function downloadSignature() {
    if (!signature) return;
    const url = URL.createObjectURL(
      new Blob([signature], { type: "text/plain" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "validator-signature.txt";
    link.click();
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="tw-mt-6 tw-space-y-4">
      <label className="tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-text-sm tw-leading-6">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={pending}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="tw-mt-1 tw-size-5 tw-shrink-0 tw-accent-primary-500"
        />
        <span>
          {t(
            locale,
            revoke ? "validator.sign.confirmRevoke" : "validator.sign.confirm"
          )}
        </span>
      </label>
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-4">
        {isConnected && address ? (
          <>
            <p className="tw-mb-2 tw-text-sm">
              {t(locale, "validator.sign.connected")}
            </p>
            <p className="tw-mb-3 tw-break-all tw-font-mono tw-text-sm tw-text-iron-50">
              {address}
            </p>
            {matches && (
              <p
                role="status"
                className="tw-text-sm tw-leading-6 tw-text-success"
              >
                {t(locale, "validator.sign.walletMatch")}
              </p>
            )}
            {!matches && (
              <p role="alert" className="tw-text-sm tw-leading-6 tw-text-error">
                {t(locale, "validator.sign.mismatch", { address: expected })}
              </p>
            )}
            <button
              type="button"
              className={SECONDARY_BUTTON}
              disabled={pending}
              onClick={() => void changeWallet()}
            >
              {t(locale, "validator.sign.changeWallet")}
            </button>
          </>
        ) : (
          <>
            <p className="tw-mb-3 tw-text-sm">
              {t(locale, "validator.sign.notConnected")}
            </p>
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={seizeConnect}
            >
              {t(locale, "validator.sign.connect")}
            </button>
          </>
        )}
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "validator.sign.walletHelp")}
        </p>
      </div>
      {isSafeWallet && (
        <p role="alert" className="tw-text-sm tw-text-error">
          {t(locale, "validator.sign.safe")}
        </p>
      )}
      {error && (
        <p role="alert" className="tw-text-sm tw-leading-6 tw-text-error">
          {error}
        </p>
      )}
      {!signature && (
        <button
          type="button"
          className={BUTTON}
          disabled={!confirmed || !matches || isSafeWallet || pending}
          onClick={() => void sign()}
        >
          {signLabel}
        </button>
      )}
      {pending && (
        <p role="status" className="tw-text-sm">
          {t(locale, "validator.sign.pending")}
        </p>
      )}
      {signature && (
        <section
          aria-labelledby="return-signature"
          className="tw-space-y-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6"
        >
          <h2
            id="return-signature"
            className="tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "validator.sign.returnTitle")}
          </h2>
          <p role="status" className="tw-text-sm tw-leading-6 tw-text-iron-100">
            {t(locale, "validator.sign.success")}
          </p>
          <p className="tw-text-sm tw-leading-6">
            {t(locale, "validator.sign.returnHelp")}
          </p>
          <label htmlFor="validator-signature" className="tw-block tw-text-sm">
            {t(locale, "validator.sign.signature")}
          </label>
          <textarea
            id="validator-signature"
            readOnly
            rows={4}
            value={signature}
            className={FIELD}
            onFocus={(event) => event.target.select()}
          />
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={() => void copySignature()}
            >
              {t(locale, "validator.sign.copy")}
            </button>
            <button
              type="button"
              className={SECONDARY_BUTTON}
              onClick={downloadSignature}
            >
              {t(locale, "validator.sign.download")}
            </button>
          </div>
          {copyStatus && (
            <p role="status" className="tw-text-sm">
              {copyStatus}
            </p>
          )}
        </section>
      )}
      <button
        type="button"
        disabled={pending}
        className={`${TEXT_BUTTON} disabled:tw-opacity-50`}
        onClick={onReset}
      >
        {t(locale, "validator.sign.reset")}
      </button>
    </div>
  );
}
