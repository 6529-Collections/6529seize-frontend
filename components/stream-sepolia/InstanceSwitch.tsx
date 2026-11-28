"use client";

import { useState, useSyncExternalStore } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import {
  DEFAULT_STREAM_INSTANCE,
  getStreamInstance,
  OLDER_STREAM_INSTANCES,
  switchStreamInstance,
} from "@/lib/stream/instances";

import { isRunActive } from "./runInProgress";

const LINK =
  "tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

/** The choice changes only by a reload, so there is nothing to subscribe to. */
const subscribeNever = () => () => undefined;

function useInstanceName(): string {
  // The choice lives in this browser's storage; the server renders the default.
  return useSyncExternalStore(
    subscribeNever,
    () => getStreamInstance().name,
    () => DEFAULT_STREAM_INSTANCE
  );
}

/** Switches instance, asking first while a creation run is under way (the reload would drop it). */
function SwitchButton({ target, label }: { readonly target: Parameters<typeof switchStreamInstance>[0]; readonly label: string }) {
  const locale = useBrowserLocale();
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span role="alert" className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-text-amber-200">
        <span>{t(locale, "streamSepolia.instance.runWarning")}</span>
        <button type="button" className={LINK} onClick={() => switchStreamInstance(target)}>
          {t(locale, "streamSepolia.instance.switchAnyway", { name: target })}
        </button>
        <button type="button" className={LINK} onClick={() => setConfirming(false)}>
          {t(locale, "streamSepolia.instance.stay")}
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={LINK}
      onClick={() => (isRunActive() ? setConfirming(true) : switchStreamInstance(target))}
    >
      {label}
    </button>
  );
}

/** Shown at the top only while an older test instance is chosen, so nobody mistakes it for the current one. */
export function InstanceNotice() {
  const locale = useBrowserLocale();
  const name = useInstanceName();
  if (name === DEFAULT_STREAM_INSTANCE) return null;
  return (
    <p className="tw-m-0 tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/20 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-200">
      <span>{t(locale, "streamSepolia.instance.older", { name })}</span>
      <SwitchButton
        target={DEFAULT_STREAM_INSTANCE}
        label={t(locale, "streamSepolia.instance.backToCurrent", { name: DEFAULT_STREAM_INSTANCE })}
      />
    </p>
  );
}

/**
 * Which Sepolia test instance the pages read, in the footer. The current one
 * is the default; works made on an older instance stay viewable by switching.
 */
export function InstanceSwitch() {
  const locale = useBrowserLocale();
  const name = useInstanceName();
  return (
    <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-text-iron-500">
      <span>{t(locale, "streamSepolia.instance.footer", { name })}</span>
      {name === DEFAULT_STREAM_INSTANCE
        ? OLDER_STREAM_INSTANCES.map((older) => (
            <SwitchButton key={older} target={older} label={t(locale, "streamSepolia.instance.showOlder", { name: older })} />
          ))
        : null}
    </p>
  );
}
