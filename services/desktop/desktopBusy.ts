"use client";

import { useEffect } from "react";
import { getDesktopUpdater } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

/**
 * 6529 Desktop: tells the app when work in this window would be lost by a
 * restart (`updater.setBusy(busy, reason)`), so "Restart to update" waits.
 * Each piece of work registers while it runs and unregisters when it ends
 * or its component unmounts (navigation unmounts it too). Only builds that
 * install their own updates define `setBusy`; elsewhere this does nothing.
 */

const work = new Map<symbol, string>();
/** What the app was last told: a reason, or null for "not busy". */
let told: string | null = null;

function tell(): void {
  const updater = getDesktopUpdater();
  if (typeof updater?.setBusy !== "function") return;
  const reason: string | null = work.values().next().value ?? null;
  if (reason === told) return;
  told = reason;
  updater.setBusy(reason !== null, reason ?? undefined).catch(() => {
    // Not taken: tell again on the next change.
    told = null;
  });
}

/** Registers `reason` as work in progress while `busy` is true. */
function useDesktopBusy(busy: boolean, reason: string): void {
  useEffect(() => {
    if (!busy) return undefined;
    const token = Symbol(reason);
    work.set(token, reason);
    tell();
    return () => {
      work.delete(token);
      tell();
    };
  }, [busy, reason]);
}

/**
 * The drop composer's work a restart would lose: a file upload in flight
 * and a drop being sent. (A draft being typed is left out: the composer
 * keeps no reliable "unsent changes" signal, and an editor that is merely
 * open would hold every update.)
 */
export function useDropComposerDesktopBusy(
  uploading: boolean,
  sending: boolean
): void {
  const locale = useBrowserLocale();
  useDesktopBusy(uploading, t(locale, "desktop.busy.uploading"));
  useDesktopBusy(sending, t(locale, "desktop.busy.sending"));
}

/** @api Resets the module state between tests. */
export function __resetDesktopBusyForTests(): void {
  work.clear();
  told = null;
}
