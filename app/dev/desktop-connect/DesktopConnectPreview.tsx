"use client";

import { useState } from "react";
import DesktopConnectDialogView from "@/components/desktop/DesktopConnectDialogView";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

const PHONE_ERROR_STATE = "walletconnect-failed";

const SCENARIOS = [
  { value: "idle", label: "desktopConnectPreview.state.idle" },
  { value: "starting", label: "desktopConnectPreview.state.starting" },
  { value: "waiting", label: "desktopConnectPreview.state.waiting" },
  { value: "signing-in", label: "desktopConnectPreview.state.signingIn" },
  { value: "failed", label: "desktopConnectPreview.state.failed" },
  { value: "expired", label: "desktopConnectPreview.state.expired" },
  { value: "start-failed", label: "desktopConnectPreview.state.startFailed" },
  {
    value: PHONE_ERROR_STATE,
    label: "desktopConnectPreview.state.walletConnectFailed",
  },
] as const;

type PreviewState = (typeof SCENARIOS)[number]["value"];

export default function DesktopConnectPreview() {
  const locale = useBrowserLocale();
  const [state, setState] = useState<PreviewState>("idle");
  const [isOpen, setIsOpen] = useState(true);
  const problem =
    state === "start-failed" || state === PHONE_ERROR_STATE ? state : null;
  const status =
    state === "starting" ||
    state === "start-failed" ||
    state === PHONE_ERROR_STATE
      ? "idle"
      : state;
  const isBusy =
    state === "starting" || state === "waiting" || state === "signing-in";

  return (
    <div className="tailwind-scope tw-mx-auto tw-max-w-2xl tw-px-5 tw-py-12 tw-text-iron-100 sm:tw-px-8">
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold">
        {t(locale, "desktopConnectPreview.title")}
      </h1>
      <p className="tw-mb-6 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "desktopConnectPreview.description")}
      </p>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
        <label
          htmlFor="desktop-connect-preview-state"
          className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-medium"
        >
          {t(locale, "desktopConnectPreview.stateLabel")}
          <select
            id="desktop-connect-preview-state"
            value={state}
            onChange={(event) => {
              const scenario = SCENARIOS.find(
                (candidate) => candidate.value === event.target.value
              );
              if (scenario) setState(scenario.value);
            }}
            className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-base tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            {SCENARIOS.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {t(locale, scenario.label)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-primary-400 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-iron-950 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-primary-300"
        >
          {t(locale, "desktopConnectPreview.open")}
        </button>
      </div>
      <p className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "desktopConnectPreview.instructions")}
      </p>
      <DesktopConnectDialogView
        isOpen={isOpen}
        isBusy={isBusy}
        status={status}
        problem={problem}
        onClose={() => setIsOpen(false)}
        onBrowserWallet={() => setState("waiting")}
        onWalletConnect={() => setState(PHONE_ERROR_STATE)}
        onCancel={() => setState("idle")}
      />
    </div>
  );
}
