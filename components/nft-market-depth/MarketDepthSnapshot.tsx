"use client";

import type { ApiMarketDepth } from "@/generated/models/ApiMarketDepth";
import { ApiMarketDepthStatusEnum } from "@/generated/models/ApiMarketDepth";
import type { SupportedLocale } from "@/i18n/locales";
import { formatRelativeTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useSyncExternalStore } from "react";
import { formatDate } from "./market-depth-format";

const MINUTE_IN_MILLISECONDS = 60_000;
const getMinuteClockSnapshot = () =>
  Math.floor(Date.now() / MINUTE_IN_MILLISECONDS);
const getServerMinuteClockSnapshot = () => null;
const subscribeToMinuteClock = (onStoreChange: () => void) => {
  const intervalId = globalThis.setInterval(
    onStoreChange,
    MINUTE_IN_MILLISECONDS
  );
  return () => globalThis.clearInterval(intervalId);
};

function formatAge(
  locale: SupportedLocale,
  value: Date | string | null,
  minuteClock: number | null
): string | null {
  if (value === null || minuteClock === null) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const difference = timestamp - minuteClock * MINUTE_IN_MILLISECONDS;
  if (difference > 0) return null;
  const absoluteDifference = Math.abs(difference);
  const units = [
    { unit: "year", milliseconds: 365 * 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "month", milliseconds: 30 * 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "day", milliseconds: 24 * 60 * MINUTE_IN_MILLISECONDS },
    { unit: "hour", milliseconds: 60 * MINUTE_IN_MILLISECONDS },
    { unit: "minute", milliseconds: MINUTE_IN_MILLISECONDS },
  ] as const;
  const matchingUnit = units.find(
    ({ milliseconds }) => absoluteDifference >= milliseconds
  );
  if (!matchingUnit)
    return formatRelativeTime(locale, 0, "second", { numeric: "auto" });
  return formatRelativeTime(
    locale,
    Math.round(difference / matchingUnit.milliseconds),
    matchingUnit.unit,
    { numeric: "auto" }
  );
}

function getUpdatedLabel(
  locale: SupportedLocale,
  age: string | null,
  absoluteTime: string | null
): string {
  if (age) return t(locale, "marketDepth.updated", { time: age });
  if (absoluteTime)
    return t(locale, "marketDepth.updatedAt", { time: absoluteTime });
  return t(locale, "marketDepth.updatedUnknown");
}

export default function MarketDepthSnapshot({
  data,
  locale,
}: {
  readonly data: ApiMarketDepth;
  readonly locale: SupportedLocale;
}) {
  const minuteClock = useSyncExternalStore(
    subscribeToMinuteClock,
    getMinuteClockSnapshot,
    getServerMinuteClockSnapshot
  );
  const absoluteTime = formatDate(data.as_of, locale);
  const age = formatAge(locale, data.as_of, minuteClock);
  const updatedLabel = getUpdatedLabel(locale, age, absoluteTime);
  return (
    <p
      title={absoluteTime ?? undefined}
      className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-500"
    >
      <span>{updatedLabel}</span>
      {data.status === ApiMarketDepthStatusEnum.Stale && (
        <>
          <span aria-hidden="true"> · </span>
          <span>{t(locale, "marketDepth.status.stale")}</span>
        </>
      )}
      {data.status === ApiMarketDepthStatusEnum.Unavailable && (
        <>
          <span aria-hidden="true"> · </span>
          <span>{t(locale, "marketDepth.status.unavailable")}</span>
        </>
      )}
    </p>
  );
}
