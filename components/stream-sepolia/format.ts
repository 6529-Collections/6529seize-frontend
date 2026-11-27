import { formatEther } from "viem";

import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import "@/i18n/namespaces/stream-sepolia";

/** An ETH amount with up to six decimals, in the viewer's number format. */
export function formatEth(wei: bigint, locale: SupportedLocale): string {
  const value = Number(formatEther(wei));
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: value !== 0 && Math.abs(value) < 0.001 ? 8 : 6,
  }).format(value);
}

export function formatCount(value: number | bigint, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** "2h 05m", "4m 09s", "12s". */
export function formatDuration(seconds: number, locale: SupportedLocale): string {
  const total = Math.max(0, Math.ceil(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const secs = total % 60;
  const two = (value: number) => String(value).padStart(2, "0");
  if (days > 0) {
    return t(locale, "streamSepolia.time.daysHours", { days, hours });
  }
  if (hours > 0) {
    return t(locale, "streamSepolia.time.hoursMinutes", { hours, minutes: two(minutes) });
  }
  if (minutes > 0) {
    return t(locale, "streamSepolia.time.minutesSeconds", { minutes, seconds: two(secs) });
  }
  return t(locale, "streamSepolia.time.seconds", { seconds: secs });
}

/** A clock time in the viewer's locale and time zone. */
export function formatClock(unixSeconds: number | bigint, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(Number(unixSeconds) * 1000));
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function sepoliaTxUrl(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function sepoliaAddressUrl(address: string): string {
  return `https://sepolia.etherscan.io/address/${address}`;
}
