"use client";

import { useSyncExternalStore } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";
import {
  DEFAULT_STREAM_INSTANCE,
  getStreamInstance,
  OLDER_STREAM_INSTANCES,
  switchStreamInstance,
} from "@/lib/stream/instances";

const LINK =
  "tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-underline-offset-4 hover:tw-text-primary-400";

/** The choice changes only by a reload, so there is nothing to subscribe to. */
const subscribeNever = () => () => undefined;

/**
 * Which Sepolia test instance the pages read. The current one is the default;
 * works made on an older instance stay viewable by switching to it.
 */
export function InstanceSwitch() {
  const locale = useBrowserLocale();
  // The choice lives in this browser's storage; the server renders the default.
  const name = useSyncExternalStore(
    subscribeNever,
    () => getStreamInstance().name,
    () => DEFAULT_STREAM_INSTANCE
  );
  if (name !== DEFAULT_STREAM_INSTANCE) {
    return (
      <p className="tw-m-0 tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/20 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-200">
        <span>{t(locale, "streamSepolia.instance.older", { name })}</span>
        <button type="button" className={LINK} onClick={() => switchStreamInstance(DEFAULT_STREAM_INSTANCE)}>
          {t(locale, "streamSepolia.instance.backToCurrent", { name: DEFAULT_STREAM_INSTANCE })}
        </button>
      </p>
    );
  }
  return (
    <p className="tw-m-0 tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-text-iron-500">
      <span>{t(locale, "streamSepolia.instance.current", { name })}</span>
      {OLDER_STREAM_INSTANCES.map((older) => (
        <button key={older} type="button" className={LINK} onClick={() => switchStreamInstance(older)}>
          {t(locale, "streamSepolia.instance.showOlder", { name: older })}
        </button>
      ))}
    </p>
  );
}
