"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Hex } from "viem";
import {
  useAccount,
  useConfig,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
} from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { publicEnv } from "@/config/env";
import { loadDesktopUrlInPlace } from "@/helpers/desktop-navigation";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  buildWalletResultDeepLink,
  isWalletRequestSignedBy,
  parseWalletRequestFragment,
  type ParsedWalletRequestFragment,
  walletRequestCode,
  type WalletResult,
} from "@/lib/desktop/wallet-forwarding";
import {
  describeWalletRequest,
  type WalletRequestDescription,
  type WalletRequestRefusal,
} from "@/lib/desktop/walletRequestDescribe";

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
 * Verify the request in this page's fragment: shape, origin, lifetime, the
 * 6529 Desktop signature, and whether it can be described. Nothing is
 * shown to sign unless every check passes.
 */
async function verifyFragment(
  hash: string,
  origin: string,
  allowedChainIds: readonly number[]
): Promise<Verified> {
  const parsed = parseWalletRequestFragment(hash, {
    origin,
    now: Date.now(),
    allowedChainIds,
  });
  if (!parsed.ok) {
    return { kind: "invalid", expired: parsed.problem === "expired" };
  }
  const signer = await fetchRequestSigner();
  if (
    signer === null ||
    !(await isWalletRequestSignedBy(parsed.value, signer))
  ) {
    return { kind: "invalid", expired: false };
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
  readonly description: WalletRequestDescription;
  readonly locale: Locale;
}) {
  if (description.kind === "message") {
    return (
      <>
        <p className="tw-m-0 tw-text-lg tw-font-semibold">
          {t(locale, `browserConnector.wallet.format.${description.format}`)}
        </p>
        <pre className="tw-m-0 tw-max-h-72 tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-font-mono tw-text-sm tw-text-iron-100">
          {description.text}
        </pre>
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
 * the requested account, and (for typed data bound to a chain) the
 * requested network. Only then is there a Sign button.
 */
function WalletGate({
  locale,
  request,
  signing,
  onSign,
}: {
  readonly locale: Locale;
  readonly request: Request;
  readonly signing: boolean;
  readonly onSign: () => void;
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
  return (
    <button
      type="button"
      className={BUTTON_CLASS}
      aria-disabled={signing}
      onClick={() => {
        if (!signing) onSign();
      }}
    >
      {t(locale, "browserConnector.wallet.sign")}
    </button>
  );
}

/** Typed data bound to a chain is signed on that chain only. */
const needsNetwork = (request: Request, chainId: number | undefined) =>
  request.method === "eth_signTypedData_v4" &&
  request.typedData.domain["chainId"] !== undefined &&
  chainId !== request.chainId;

/** Ask the wallet for exactly what the request describes. */
function signRequest(
  request: Request,
  signMessage: ReturnType<typeof useSignMessage>["signMessageAsync"],
  signTypedData: ReturnType<typeof useSignTypedData>["signTypedDataAsync"]
): Promise<Hex> {
  if (request.method === "personal_sign") {
    return signMessage({
      account: request.address,
      message: { raw: request.message },
    });
  }
  // viem derives the domain type from the domain itself.
  const { EIP712Domain: _domainType, ...types } = request.typedData.types;
  return signTypedData({
    account: request.address,
    domain: request.typedData.domain,
    types,
    primaryType: request.typedData.primaryType,
    message: request.typedData.message,
  } as Parameters<typeof signTypedData>[0]);
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
    return {
      alert: null,
      status: t(
        locale,
        step.declined
          ? "browserConnector.wallet.declined"
          : "browserConnector.wallet.returned"
      ),
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
  return {
    alert:
      step.kind === "failed"
        ? t(locale, "browserConnector.wallet.failed")
        : null,
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
    setStep({ kind: "returned", deepLink, declined });
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
      const signature = await signRequest(
        request,
        signMessageAsync,
        signTypedDataAsync
      );
      if (!stillCurrent()) return;
      // A request that ran out while the wallet waited is refused by the app.
      if (envelope.expiresAt <= Date.now()) {
        setStep({ kind: "idle" });
        return;
      }
      returnToApp({ v: 1, id: envelope.id, ok: true, value: signature }, false);
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
      <a
        href={step.deepLink}
        className={`${BUTTON_CLASS} tw-inline-flex tw-items-center tw-justify-center tw-no-underline`}
      >
        {t(locale, "browserConnector.openApp")}
      </a>
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
  } else if (!expired && verified.kind === "ready") {
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
