"use client";

import type { ReactNode } from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Button from "@/components/utils/button/Button";
import { type UseE2eeResult, useE2ee } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeCenteredMessage } from "../ui/E2eePageShell";
import { E2eeDeviceLimitPanel } from "./E2eeDeviceLimitPanel";
import { E2eeEnrollmentCard } from "./E2eeEnrollmentCard";
import { E2eeEnrollmentIdentity } from "./E2eeEnrollmentIdentity";

export function E2eeLoadingState({ label }: { readonly label: string }) {
  return (
    <div
      role="status"
      className="tw-flex tw-items-center tw-justify-center tw-gap-3 tw-px-6 tw-py-12 tw-text-sm tw-text-iron-400"
    >
      <CircleLoader />
      <span>{label}</span>
    </div>
  );
}

interface E2eeRouteGateProps {
  /** Rendered once this device can use encrypted messages. */
  readonly children: (e2ee: UseE2eeResult) => ReactNode;
  /** Wraps the non-ready states (for pages whose ready view has its own header). */
  readonly shell?: ((content: ReactNode) => ReactNode) | undefined;
}

/**
 * Shows the state that stands between the user and encrypted chats: proxy
 * sessions, unsupported browsers, another tab holding the engine, loading,
 * enrollment, the device limit and load errors. Children render only when
 * the engine is ready.
 */
export function E2eeRouteGate({ children, shell }: E2eeRouteGateProps) {
  const e2ee = useE2ee();
  if (e2ee.status === "ready") {
    return children(e2ee);
  }
  if (e2ee.status === "disabled") {
    return null;
  }
  const content = <E2eeGateState e2ee={e2ee} />;
  return shell ? shell(content) : content;
}

function E2eeGateState({ e2ee }: { readonly e2ee: UseE2eeResult }) {
  const locale = useBrowserLocale();
  switch (e2ee.status) {
    case "proxy":
      return (
        <E2eeCenteredMessage
          title={t(locale, "e2ee.gate.proxy.title")}
          body={t(locale, "e2ee.gate.proxy.body")}
        />
      );
    case "unavailable":
      return (
        <E2eeCenteredMessage
          title={t(locale, "e2ee.title")}
          body={t(locale, "e2ee.gate.noWallet")}
        />
      );
    case "elsewhere":
      return (
        <E2eeCenteredMessage
          title={t(locale, "e2ee.gate.elsewhere.title")}
          body={t(locale, "e2ee.gate.elsewhere.body")}
        >
          <Button variant="secondary" size="md" onClick={e2ee.takeOverHere}>
            {t(locale, "e2ee.gate.elsewhere.action")}
          </Button>
        </E2eeCenteredMessage>
      );
    case "unsupported":
      return (
        <E2eeCenteredMessage
          title={t(locale, "e2ee.gate.unsupported.title")}
          body={t(locale, "e2ee.gate.unsupported.body")}
        />
      );
    case "load-failed":
    case "error":
      return (
        <E2eeCenteredMessage
          title={t(locale, "e2ee.gate.error.title")}
          body={
            <>
              <p className="tw-m-0">{t(locale, "e2ee.gate.error.body")}</p>
              {e2ee.error ? (
                <p className="tw-m-0 tw-mt-2 tw-font-mono tw-text-xs tw-text-iron-500">
                  {t(locale, "e2ee.gate.error.code", { code: e2ee.error })}
                </p>
              ) : null}
            </>
          }
        >
          <Button variant="secondary" size="md" onClick={e2ee.restart}>
            {t(locale, "e2ee.action.retry")}
          </Button>
        </E2eeCenteredMessage>
      );
    case "needs-enrollment":
    case "enrolling":
      return (
        <E2eeEnrollmentCard
          engine={e2ee.engine}
          enrolling={e2ee.status === "enrolling"}
          engineError={e2ee.error}
          details={<E2eeEnrollmentIdentity />}
        />
      );
    case "device-limit":
      // The list of devices with revoke buttons, then "turn on this device".
      return (
        <E2eeDeviceLimitPanel engine={e2ee.engine} devices={e2ee.devices} />
      );
    case "idle":
    case "loading":
    case "disabled":
    case "ready":
      return <E2eeLoadingState label={t(locale, "e2ee.loading")} />;
  }
}
