"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Hex } from "viem";
import {
  useAccount,
  useConfig,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { publicEnv } from "@/config/env";
import { getTransactionLink } from "@/helpers/Helpers";
import { loadDesktopUrlInPlace } from "@/helpers/desktop-navigation";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  buildWalletResultDeepLink,
  type ParsedWalletRequestFragment,
  verifyWalletRequestFragment,
  walletRequestCode,
  type WalletResult,
} from "@/lib/desktop/wallet-forwarding";
import { shortWalletPayloadHash } from "@/lib/desktop/walletRequestContext";
import {
  describeWalletRequest,
  type WalletRequestDescription,
  type WalletRequestRefusal,
} from "@/lib/desktop/walletRequestDescribe";
import BrowserWalletRequestContent from "./BrowserWalletRequestContent";
import BrowserWalletSafeTxView from "./BrowserWalletSafeTxView";
import BrowserWalletTransactionView from "./BrowserWalletTransactionView";

/** The website's host for this build, for "Continue on {site}" copy. */
function getWebsiteHost(): string {
  try {
    return new URL(publicEnv.BASE_ENDPOINT).host;
  } catch {
    return "6529.io";
  }
}

/** Where the local 6529 Desktop server reports this run's request signer. */
const WALLET_REQUEST_SIGNER_PATH = "/browser-connector/signer";

const BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-5 tw-py-2.5 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";
const SECONDARY_BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-5 tw-py-2.5 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

type Verified =
  | { readonly kind: "checking" }
  | { readonly kind: "invalid"; readonly expired: boolean }
  | {
      readonly kind: "refused";
      readonly fragment: ParsedWalletRequestFragment;
      readonly refusal: WalletRequestRefusal;
    }
  | {
      readonly kind: "ready";
      readonly fragment: ParsedWalletRequestFragment;
      readonly description: WalletRequestDescription;
    };

type Step =
  | { readonly kind: "idle" }
  | { readonly kind: "signing" }
  | { readonly kind: "failed" }
  | {
      readonly kind: "returned";
      readonly deepLink: string;
      readonly declined: boolean;
      /** The sent transaction, with its chain, for a transaction request. */
      readonly transaction?: { readonly hash: Hex; readonly chainId: number };
    };

async function fetchRequestSigner(): Promise<string | null> {
  try {
    const response = await fetch(WALLET_REQUEST_SIGNER_PATH, {
      cache: "no-store",
      credentials: "omit",
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const signer =
      typeof body === "object" && body !== null
        ? (body as { signer?: unknown }).signer
        : undefined;
    return typeof signer === "string" ? signer : null;
  } catch {
    return null;
  }
}

/**
 * Verify the request in this page's fragment: shape, the 6529 Desktop
 * signature, then origin, lifetime, and whether it can be described. A
 * request 6529 Desktop did not sign is invalid whatever its times say.
 * Nothing is shown to sign unless every check passes.
 */
async function verifyFragment(
  hash: string,
  origin: string,
  allowedChainIds: readonly number[]
): Promise<Verified> {
  const signer = await fetchRequestSigner();
  const parsed = await verifyWalletRequestFragment(hash, {
    origin,
    now: Date.now(),
    allowedChainIds,
    signer,
  });
  if (!parsed.ok) {
    return { kind: "invalid", expired: parsed.problem === "expired" };
  }
  const described = describeWalletRequest(parsed.value.request, origin);
  return described.ok
    ? { kind: "ready", fragment: parsed.value, description: described.value }
    : { kind: "refused", fragment: parsed.value, refusal: described.refusal };
}

function useVerifiedRequest(hash: string): Verified {
  const { chains } = useConfig();
  const chainIds = useMemo(() => chains.map((chain) => chain.id), [chains]);
  const [verified, setVerified] = useState<Verified>({ kind: "checking" });
  useEffect(() => {
    let active = true;
    verifyFragment(hash, globalThis.location.origin, chainIds)
      .then((result) => {
        if (active) setVerified(result);
      })
      .catch(() => {
        if (active) setVerified({ kind: "invalid", expired: false });
      });
    return () => {
      active = false;
    };
  }, [hash, chainIds]);
  return verified;
}

/** Turns the request to an expired one when its time runs out. */
function useExpired(expiresAt: number | null): boolean {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (expiresAt === null) return undefined;
    // An expired request never parses, so this only waits out the rest.
    const remaining = Math.max(0, expiresAt - Date.now());
    const timer = setTimeout(() => setExpired(true), remaining);
    return () => clearTimeout(timer);
  }, [expiresAt]);
  return expired;
}

type Locale = ReturnType<typeof useBrowserLocale>;
type Request = ParsedWalletRequestFragment["request"];

function Details({
  description,
  locale,
}: {
  readonly description: Exclude<
    WalletRequestDescription,
    { readonly kind: "transaction" | "safeTx" }
  >;
  readonly locale: Locale;
}) {
  if (description.kind === "message") {
    return (
      <>
        <p className="tw-m-0 tw-text-lg tw-font-semibold">
          {t(locale, `browserConnector.wallet.format.${description.format}`)}
        </p>
        <BrowserWalletRequestContent
          text={description.text}
          fingerprint={shortWalletPayloadHash(description.payloadHash)}
          content={description.content}
          locale={locale}
        />
      </>
    );
  }
  return (
    <>
      <p className="tw-m-0 tw-text-lg tw-font-semibold">
        {t(
          locale,
          `browserConnector.wallet.schema.${description.schema}`,
          description.summary
        )}
      </p>
      {description.statement && (
        <p className="tw-m-0 tw-text-iron-200">{description.statement}</p>
      )}
      <details className="tw-rounded-lg tw-bg-iron-900 tw-p-3">
        <summary className="tw-cursor-pointer tw-font-semibold focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "browserConnector.wallet.details")}
        </summary>
        <dl className="tw-m-0 tw-mt-3 tw-flex tw-flex-col tw-gap-2 tw-text-sm">
          {description.details.map((detail) => (
            <div key={detail.label}>
              <dt className="tw-font-mono tw-text-iron-400">{detail.label}</dt>
              <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-100">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}

/**
 * What stands between the user and the wallet prompt: a connected wallet,
 * the requested account, and (for typed data bound to a chain, and for
 * every transaction) the requested network. Only then is there a Sign (or
 * Send) button; `disabled` holds it back while checks are open.
 */
function WalletGate({
  locale,
  request,
  signing,
  onSign,
  disabled = false,
  describedBy,
}: {
  readonly locale: Locale;
  readonly request: Request;
  readonly signing: boolean;
  readonly onSign: () => void;
  readonly disabled?: boolean;
  /** The id of what explains whether the button is offered. */
  readonly describedBy?: string;
}) {
  const { seizeConnect } = useSeizeConnectContext();
  const live = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const address = request.address;
  const connected =
    live.isConnected && live.address ? live.address.toLowerCase() : null;

  if (connected === null) {
    return (
      <>
        <p className="tw-m-0 tw-w-full tw-break-all">
          {t(locale, "browserConnector.wallet.connectIntro", { address })}
        </p>
        <button type="button" className={BUTTON_CLASS} onClick={seizeConnect}>
          {t(locale, "browserConnector.connect")}
        </button>
      </>
    );
  }
  if (connected !== address.toLowerCase()) {
    return (
      <p className="tw-m-0 tw-w-full tw-break-all">
        {t(locale, "browserConnector.wallet.switchAccount", {
          connected,
          address,
        })}
      </p>
    );
  }
  if (needsNetwork(request, live.chainId)) {
    return (
      <>
        <p className="tw-m-0 tw-w-full">
          {t(locale, "browserConnector.wallet.switchNetwork")}
        </p>
        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => {
            switchChainAsync({ chainId: request.chainId }).catch(
              () => undefined
            );
          }}
        >
          {t(locale, "browserConnector.wallet.switchNetworkAction")}
        </button>
      </>
    );
  }
  const isTransaction = request.method === "eth_sendTransaction";
  return (
    <button
      type="button"
      className={BUTTON_CLASS}
      disabled={disabled}
      aria-disabled={signing}
      aria-describedby={describedBy}
      onClick={() => {
        if (!signing && !disabled) onSign();
      }}
    >
      {t(
        locale,
        isTransaction
          ? "browserConnector.tx.send"
          : "browserConnector.wallet.sign"
      )}
    </button>
  );
}

/**
 * A transaction is sent on its chain only; typed data bound to a chain is
 * signed on that chain only.
 */
const needsNetwork = (request: Request, chainId: number | undefined) => {
  if (request.method === "eth_sendTransaction") {
    return chainId !== request.chainId;
  }
  return (
    request.method === "eth_signTypedData_v4" &&
    request.typedData.domain["chainId"] !== undefined &&
    chainId !== request.chainId
  );
};

interface WalletActions {
  readonly signMessage: ReturnType<typeof useSignMessage>["signMessageAsync"];
  readonly signTypedData: ReturnType<
    typeof useSignTypedData
  >["signTypedDataAsync"];
  readonly sendTransaction: ReturnType<
    typeof useSendTransaction
  >["sendTransactionAsync"];
}

/**
 * Ask the wallet for exactly what the request describes: a signature, or
 * the transaction itself (fees and nonce are the wallet's to choose).
 */
function signRequest(request: Request, wallet: WalletActions): Promise<Hex> {
  if (request.method === "personal_sign") {
    return wallet.signMessage({
      account: request.address,
      message: { raw: request.message },
    });
  }
  if (request.method === "eth_sendTransaction") {
    const { to, data, value } = request.transaction;
    return wallet.sendTransaction({
      account: request.address,
      chainId: request.chainId,
      to: to as Hex,
      data,
      value: BigInt(value),
    });
  }
  // viem derives the domain type from the domain itself.
  const { EIP712Domain: _domainType, ...types } = request.typedData.types;
  return wallet.signTypedData({
    account: request.address,
    domain: request.typedData.domain,
    types,
    primaryType: request.typedData.primaryType,
    message: request.typedData.message,
  } as Parameters<WalletActions["signTypedData"]>[0]);
}

interface PanelMessages {
  readonly alert: string | null;
  readonly status: string | null;
}

function getMessages(
  locale: Locale,
  verified: Verified,
  step: Step,
  expired: boolean
): PanelMessages {
  if (verified.kind === "checking") {
    return {
      alert: null,
      status: t(locale, "browserConnector.wallet.checking"),
    };
  }
  if (step.kind === "returned") {
    let key:
      | "browserConnector.wallet.declined"
      | "browserConnector.wallet.returned"
      | "browserConnector.tx.sent" = "browserConnector.wallet.returned";
    if (step.declined) key = "browserConnector.wallet.declined";
    else if (step.transaction) key = "browserConnector.tx.sent";
    return {
      alert: null,
      status: t(locale, key, { hash: step.transaction?.hash ?? "" }),
    };
  }
  if (verified.kind === "invalid" || expired) {
    const invalid = verified.kind === "invalid" && !verified.expired;
    return {
      alert: t(
        locale,
        invalid
          ? "browserConnector.wallet.problem.invalid"
          : "browserConnector.wallet.problem.expired"
      ),
      status: null,
    };
  }
  if (verified.kind === "refused") {
    return {
      alert: t(locale, `browserConnector.wallet.refusal.${verified.refusal}`, {
        site: getWebsiteHost(),
      }),
      status: null,
    };
  }
  const failedKey =
    verified.fragment.request.method === "eth_sendTransaction"
      ? "browserConnector.tx.failed"
      : "browserConnector.wallet.failed";
  return {
    alert: step.kind === "failed" ? t(locale, failedKey) : null,
    status:
      step.kind === "signing"
        ? t(locale, "browserConnector.wallet.signing")
        : null,
  };
}

/**
 * Runs in the system browser, opened by 6529 Desktop with a wallet request
 * in the fragment. Shows what the request signs, asks the browser wallet to
 * sign it only when the user approves with the right account, and returns
 * the answer through the app's link scheme. Requests that 6529 Desktop did
 * not sign, that have expired or that cannot be described are never sent
 * to the wallet.
 */
export default function BrowserWalletRequestPanel({
  hash,
}: {
  readonly hash: string;
}) {
  const locale = useBrowserLocale();
  const verified = useVerifiedRequest(hash);
  const live = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const [step, setStep] = useState<Step>({ kind: "idle" });

  const fragment =
    verified.kind === "refused" || verified.kind === "ready"
      ? verified.fragment
      : null;
  const expired = useExpired(fragment?.envelope.expiresAt ?? null);

  // The page answers at most once. Each sign attempt has an id; declining
  // (or any answer) ends the request, so a wallet that resolves afterwards
  // is ignored.
  const answered = useRef(false);
  const attempt = useRef(0);

  const returnToApp = (result: WalletResult, declined: boolean) => {
    if (!fragment || answered.current) return;
    answered.current = true;
    attempt.current += 1;
    const deepLink = buildWalletResultDeepLink(
      fragment.envelope.scheme,
      result
    );
    const sent =
      result.ok && fragment.request.method === "eth_sendTransaction"
        ? { hash: result.value, chainId: fragment.request.chainId }
        : undefined;
    setStep({
      kind: "returned",
      deepLink,
      declined,
      ...(sent ? { transaction: sent } : {}),
    });
    loadDesktopUrlInPlace(deepLink);
  };

  const decline = (code: "rejected" | "refused") => {
    if (!fragment || expired) return;
    returnToApp({ v: 1, id: fragment.envelope.id, ok: false, code }, true);
  };

  const sign = async () => {
    if (verified.kind !== "ready" || expired || answered.current) return;
    const { request, envelope } = verified.fragment;
    // The gate shows the button only for this account; check again here.
    if (
      live.address?.toLowerCase() !== request.address.toLowerCase() ||
      needsNetwork(request, live.chainId)
    ) {
      return;
    }
    // Never open a wallet prompt for a request that has already run out.
    if (envelope.expiresAt <= Date.now()) {
      setStep({ kind: "idle" });
      return;
    }
    attempt.current += 1;
    const current = attempt.current;
    const stillCurrent = () => current === attempt.current && !answered.current;
    setStep({ kind: "signing" });
    try {
      const value = await signRequest(request, {
        signMessage: signMessageAsync,
        signTypedData: signTypedDataAsync,
        sendTransaction: sendTransactionAsync,
      });
      const isTransaction = request.method === "eth_sendTransaction";
      // A sent transaction is on its way whatever happens here: its hash
      // always goes back (6529 Desktop checks late ones on chain). This page
      // serves one request; the link carries its id, and the shell takes
      // one answer per id and checks a later one as a late transaction.
      if (!isTransaction && !stillCurrent()) return;
      // A signature that ran out while the wallet waited is refused by the app.
      if (!isTransaction && envelope.expiresAt <= Date.now()) {
        setStep({ kind: "idle" });
        return;
      }
      if (isTransaction) answered.current = false;
      returnToApp({ v: 1, id: envelope.id, ok: true, value }, false);
    } catch (error) {
      if (!stillCurrent()) return;
      if (isUserRejectedSigningError(error)) {
        decline("rejected");
        return;
      }
      setStep({ kind: "failed" });
    }
  };

  const messages = getMessages(locale, verified, step, expired);
  let content: React.ReactNode = null;
  if (step.kind === "returned") {
    content = (
      <>
        {step.transaction && (
          <a
            href={getTransactionLink(
              step.transaction.chainId,
              step.transaction.hash
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-break-all tw-font-mono tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "browserConnector.tx.explorer")}
          </a>
        )}
        <a
          href={step.deepLink}
          className={`${BUTTON_CLASS} tw-inline-flex tw-items-center tw-justify-center tw-no-underline`}
        >
          {t(locale, "browserConnector.openApp")}
        </a>
      </>
    );
  } else if (!expired && verified.kind === "refused") {
    content = (
      <button
        type="button"
        className={SECONDARY_BUTTON_CLASS}
        onClick={() => decline("refused")}
      >
        {t(locale, "browserConnector.wallet.tellApp")}
      </button>
    );
  } else if (
    !expired &&
    verified.kind === "ready" &&
    verified.description.kind === "transaction" &&
    verified.fragment.request.method === "eth_sendTransaction"
  ) {
    const { request, envelope } = verified.fragment;
    content = (
      <BrowserWalletTransactionView
        locale={locale}
        request={request}
        description={verified.description.transaction}
        expiresAt={envelope.expiresAt}
      >
        {(canSend, describedBy) => (
          <>
            <WalletGate
              locale={locale}
              request={request}
              signing={step.kind === "signing"}
              disabled={!canSend}
              describedBy={describedBy}
              onSign={() => {
                sign().catch(() => setStep({ kind: "failed" }));
              }}
            />
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => decline("rejected")}
            >
              {t(locale, "browserConnector.wallet.decline")}
            </button>
          </>
        )}
      </BrowserWalletTransactionView>
    );
  } else if (
    !expired &&
    verified.kind === "ready" &&
    verified.description.kind === "safeTx"
  ) {
    const { request } = verified.fragment;
    content = (
      <BrowserWalletSafeTxView
        locale={locale}
        signer={request.address}
        requestKey={JSON.stringify(request)}
        description={verified.description.safeTx}
      >
        {(canSign, describedBy) => (
          <>
            <WalletGate
              locale={locale}
              request={request}
              signing={step.kind === "signing"}
              disabled={!canSign}
              describedBy={describedBy}
              onSign={() => {
                sign().catch(() => setStep({ kind: "failed" }));
              }}
            />
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => decline("rejected")}
            >
              {t(locale, "browserConnector.wallet.decline")}
            </button>
          </>
        )}
      </BrowserWalletSafeTxView>
    );
  } else if (
    !expired &&
    verified.kind === "ready" &&
    verified.description.kind !== "transaction" &&
    verified.description.kind !== "safeTx"
  ) {
    const { request } = verified.fragment;
    content = (
      <>
        <p className="tw-m-0 tw-break-all">
          {t(
            locale,
            verified.description.kind === "message"
              ? "browserConnector.wallet.messageIntro"
              : "browserConnector.wallet.typedIntro",
            { address: request.address }
          )}
        </p>
        <Details description={verified.description} locale={locale} />
        <p className="tw-m-0 tw-text-sm tw-text-iron-300">
          {t(locale, "browserConnector.wallet.safety")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <WalletGate
            locale={locale}
            request={request}
            signing={step.kind === "signing"}
            onSign={() => {
              sign().catch(() => setStep({ kind: "failed" }));
            }}
          />
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASS}
            onClick={() => decline("rejected")}
          >
            {t(locale, "browserConnector.wallet.decline")}
          </button>
        </div>
      </>
    );
  }

  return (
    <main className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-black tw-px-4 tw-py-8 tw-text-white">
      <section className="tw-flex tw-w-full tw-max-w-xl tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-6">
        <h1 className="tw-m-0 tw-text-xl tw-font-semibold">
          {t(locale, "browserConnector.wallet.title")}
        </h1>
        {fragment && (
          <p className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400 tw-p-3 tw-font-semibold">
            {t(locale, "browserConnector.wallet.code", {
              code: walletRequestCode(fragment.envelope.id),
            })}
          </p>
        )}
        <div role="alert" className="empty:tw-hidden">
          {messages.alert}
        </div>
        <output
          aria-live="polite"
          aria-atomic="true"
          className="tw-block empty:tw-hidden"
        >
          {messages.status}
        </output>
        {content}
      </section>
    </main>
  );
}
