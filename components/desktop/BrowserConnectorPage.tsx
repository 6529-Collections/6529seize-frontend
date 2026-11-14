"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { publicEnv } from "@/config/env";
import { loadDesktopUrlInPlace } from "@/helpers/desktop-navigation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  buildBrowserConnectorDeepLink,
  parseBrowserConnectorRequest,
  type BrowserConnectorRequest,
} from "@/lib/desktop/browserConnector";
import { getSessionNonce } from "@/services/auth/session-v2.utils";

type Step =
  | { readonly kind: "ready" }
  | { readonly kind: "signing" }
  | { readonly kind: "failed" }
  | { readonly kind: "returned"; readonly deepLink: string };

const BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-5 tw-py-2.5 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

const PROBLEM_MESSAGES = {
  "invalid-scheme": "browserConnector.problem.invalid",
  "invalid-request": "browserConnector.problem.invalid",
  "wrong-build": "browserConnector.problem.wrongBuild",
  expired: "browserConnector.problem.expired",
} as const;

const subscribeToNothing = () => () => undefined;
const getClientHydrated = () => true;
const getServerHydrated = () => false;

// Validity depends on the current time, so it is read only in the browser.
const readRequest = (params: { get(name: string): string | null }) =>
  parseBrowserConnectorRequest(params, Date.now(), publicEnv.CORE_SCHEME);

const hasExpired = (expiresAt: number) => expiresAt <= Date.now();

/**
 * Runs in the system browser, opened by 6529 Desktop. The user connects a
 * browser wallet and signs a 6529 Desktop sign-in challenge; the page then
 * opens the desktop app's link with the signature. It never signs in to this
 * site and sends the signature nowhere else.
 */
export default function BrowserConnectorPage() {
  const locale = useBrowserLocale();
  const searchParams = useSearchParams();
  const { seizeConnect } = useSeizeConnectContext();
  const live = useAccount();
  const { signMessageAsync } = useSignMessage();
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    getClientHydrated,
    getServerHydrated
  );
  const [expired, setExpired] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "ready" });
  const parsed = useMemo<BrowserConnectorRequest | null>(
    () => (hydrated ? readRequest(searchParams) : null),
    [hydrated, searchParams]
  );
  const request: BrowserConnectorRequest | null = expired
    ? { ok: false, problem: "expired" }
    : parsed;

  const address =
    live.isConnected && live.address ? live.address.toLowerCase() : null;

  const signIn = async () => {
    if (!request?.ok || !address) return;
    if (hasExpired(request.expiresAt)) {
      setExpired(true);
      return;
    }
    setStep({ kind: "signing" });
    try {
      const nonce = await getSessionNonce({
        signerAddress: address,
        forDesktopSignIn: true,
      });
      const clientSignature = await signMessageAsync({
        account: address as `0x${string}`,
        message: nonce.signable_message,
      });
      const deepLink = buildBrowserConnectorDeepLink(request.scheme, {
        requestId: request.requestId,
        address,
        serverSignature: nonce.server_signature,
        clientSignature,
      });
      setStep({ kind: "returned", deepLink });
      loadDesktopUrlInPlace(deepLink);
    } catch {
      setStep({ kind: "failed" });
    }
  };

  let content: React.ReactNode;
  if (request === null) {
    content = null;
  } else if (!request.ok) {
    content = (
      <p role="alert">{t(locale, PROBLEM_MESSAGES[request.problem])}</p>
    );
  } else if (step.kind === "returned") {
    content = (
      <>
        <p role="status">{t(locale, "browserConnector.returned")}</p>
        <a
          href={step.deepLink}
          className={`${BUTTON_CLASS} tw-inline-flex tw-items-center tw-no-underline`}
        >
          {t(locale, "browserConnector.openApp")}
        </a>
      </>
    );
  } else if (!address) {
    content = (
      <>
        <p>{t(locale, "browserConnector.connectIntro")}</p>
        <button type="button" className={BUTTON_CLASS} onClick={seizeConnect}>
          {t(locale, "browserConnector.connect")}
        </button>
      </>
    );
  } else {
    content = (
      <>
        <p>{t(locale, "browserConnector.signIntro", { address })}</p>
        {step.kind === "failed" && (
          <p role="alert">{t(locale, "browserConnector.failed")}</p>
        )}
        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={step.kind === "signing"}
          aria-busy={step.kind === "signing"}
          onClick={() => {
            signIn().catch(() => setStep({ kind: "failed" }));
          }}
        >
          {t(locale, "browserConnector.sign")}
        </button>
      </>
    );
  }

  return (
    <main className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-black tw-px-4 tw-py-8 tw-text-white">
      <section className="tw-flex tw-w-full tw-max-w-md tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-6">
        <h1 className="tw-m-0 tw-text-xl tw-font-semibold">
          {t(locale, "browserConnector.title")}
        </h1>
        {content}
      </section>
    </main>
  );
}
