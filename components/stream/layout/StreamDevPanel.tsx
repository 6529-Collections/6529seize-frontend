"use client";

import {
  useStream,
  useStreamNow,
  useStreamQuery,
} from "@/components/stream/data/StreamProvider";
import { formatEth } from "@/components/stream/ui/EthAmount";
import { formatDate, formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import { STREAM_BUTTON_SMALL } from "@/components/stream/ui/styles";
import DevWorkControls from "@/components/stream/work/DevWorkControls";
import type { Address } from "@/lib/stream/types";

const SPEEDS = [1, 60, 600, 3_600] as const;
const STEPS = [
  { seconds: 5 * 60, label: "stream.dev.plus5m" },
  { seconds: 3_600, label: "stream.dev.plus1h" },
  { seconds: 86_400, label: "stream.dev.plus1d" },
] as const;

const BUTTON = STREAM_BUTTON_SMALL;

const NOT_CONNECTED = "none";

/**
 * Mock-only controls: the simulated clock (speed, pause, jumps), the dev
 * account switcher, the page's dispute and delisting actors, and a scenario
 * reset. Hidden when the data source has no dev controls (the chain).
 */
export default function StreamDevPanel({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const { client, account, setAccount } = useStream();
  const now = useStreamNow();
  const dev = client?.dev ?? null;
  const { data: accounts = [] } = useStreamQuery("dev-accounts", [], () =>
    Promise.resolve(dev === null ? [] : dev.accounts())
  );
  if (dev === null) {
    return null;
  }
  const speed = dev.clockSpeed();
  const paused = dev.isClockPaused();
  const current = accounts.find((entry) => entry.address === account);
  return (
    <details className="tailwind-scope tw-fixed tw-bottom-3 tw-right-3 tw-z-50 tw-max-w-[calc(100vw-1.5rem)] tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-text-iron-200 tw-shadow-2xl sm:tw-w-80">
      <summary className="tw-cursor-pointer tw-list-none tw-rounded-xl tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-amber-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
        {t(locale, "stream.dev.title")}
      </summary>
      <div className="tw-space-y-3 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-px-3 tw-py-3">
        <p className="tw-m-0 tw-text-xs" aria-live="polite">
          {t(locale, "stream.dev.time", {
            time: formatDate(locale, now * 1_000, {
              dateStyle: "medium",
              timeStyle: "medium",
              timeZone: "UTC",
            }),
          })}
        </p>
        <div
          className="tw-flex tw-flex-wrap tw-gap-1"
          role="group"
          aria-label={t(locale, "stream.dev.speed")}
        >
          {SPEEDS.map((multiplier) => (
            <button
              key={multiplier}
              type="button"
              className={BUTTON}
              aria-pressed={speed === multiplier}
              onClick={() => dev.setClockSpeed(multiplier)}
            >
              {t(locale, "stream.dev.speedValue", {
                speed: formatInteger(locale, multiplier),
              })}
            </button>
          ))}
          <button
            type="button"
            className={BUTTON}
            aria-pressed={paused}
            onClick={() => dev.setClockPaused(!paused)}
          >
            {t(locale, paused ? "stream.dev.resume" : "stream.dev.pause")}
          </button>
        </div>
        <div
          className="tw-flex tw-flex-wrap tw-gap-1"
          role="group"
          aria-label={t(locale, "stream.dev.jump")}
        >
          {STEPS.map((step) => (
            <button
              key={step.seconds}
              type="button"
              className={BUTTON}
              onClick={() => dev.advance(step.seconds)}
            >
              {t(locale, step.label)}
            </button>
          ))}
          <button
            type="button"
            className={BUTTON}
            onClick={() => dev.jumpToNextEnd()}
          >
            {t(locale, "stream.dev.nextEnd")}
          </button>
        </div>
        <div>
          <label className="tw-block tw-text-xs tw-text-iron-400">
            {t(locale, "stream.dev.account")}
            <select
              value={account ?? NOT_CONNECTED}
              onChange={(event) =>
                setAccount(
                  event.target.value === NOT_CONNECTED
                    ? null
                    : (event.target.value as Address)
                )
              }
              className="tw-mt-1 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2 tw-py-1.5 tw-text-sm tw-text-iron-100"
            >
              <option value={NOT_CONNECTED}>
                {t(locale, "stream.dev.notConnected")}
              </option>
              {accounts.map((entry) => (
                <option key={entry.address} value={entry.address}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
          {current === undefined ? null : (
            <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">
              {t(locale, "stream.dev.balance", {
                amount: formatEth(locale, current.balance),
              })}
            </p>
          )}
        </div>
        <DevWorkControls dev={dev} locale={locale} />
        <button type="button" className={BUTTON} onClick={() => dev.reset()}>
          {t(locale, "stream.dev.reset")}
        </button>
      </div>
    </details>
  );
}
