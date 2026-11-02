"use client";

import { LockOpenIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getNewEncryptedChatRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";
import { setE2eeComposePrefill } from "../e2eeComposePrefill";
import { E2eeBadge } from "../ui/E2eeBadge";
import { isPlaintextDmWave, resolveDmParticipants } from "./dmParticipants";

/**
 * One tap from a plaintext DM to `/messages/encrypted/new`, prefilled with
 * the same people. History is not migrated; the new chat starts empty.
 */
export function useStartEncryptedChatFromDm(wave: ApiWave | null) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } = useAuth();
  const [pending, setPending] = useState(false);
  const available =
    isE2eeEnabled() &&
    isPlaintextDmWave(wave) &&
    connectedProfile !== null &&
    activeProfileProxy === null;

  const start = async () => {
    if (!wave || !available || pending) {
      return;
    }
    setPending(true);
    try {
      const people = await resolveDmParticipants(
        queryClient,
        wave,
        connectedProfile.id
      );
      setE2eeComposePrefill({ people, source: "dm" });
      router.push(getNewEncryptedChatRoute());
    } catch {
      setToast({ type: "error", message: t(locale, "e2ee.plaintext.failed") });
    } finally {
      setPending(false);
    }
  };

  return { available, pending, start };
}

interface PlaintextDmEncryptionNoticeProps {
  readonly wave: ApiWave;
  /** inline: label plus a text action; icon: one compact button. */
  readonly variant?: "inline" | "icon" | undefined;
  /** Use the icon variant regardless of `variant` (compact headers). */
  readonly compact?: boolean | undefined;
  /**
   * Render only in the native app shell, where the wave tabs header (which
   * carries this notice on web) is not shown.
   */
  readonly appOnly?: boolean | undefined;
}

/**
 * Quiet "Not end-to-end encrypted" label for plaintext DM headers, with the
 * action to start an encrypted chat with the same people. Renders nothing
 * when encrypted messages are off, for proxies, and for non-DM waves.
 */
export function PlaintextDmEncryptionNotice({
  wave,
  variant = "inline",
  compact = false,
  appOnly = false,
}: PlaintextDmEncryptionNoticeProps) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
  const { available, pending, start } = useStartEncryptedChatFromDm(wave);
  if (!available || (appOnly && !isApp)) {
    return null;
  }
  const label = t(locale, "e2ee.plaintext.label");

  if (compact || variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void start()}
        disabled={pending}
        aria-label={t(locale, "e2ee.plaintext.iconAction")}
        title={t(locale, "e2ee.plaintext.start")}
        className="tw-inline-flex tw-h-8 tw-min-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1.5 tw-text-xs tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-60"
      >
        {pending ? (
          <CircleLoader />
        ) : (
          <LockOpenIcon aria-hidden="true" className="tw-size-4" />
        )}
        <span
          aria-hidden="true"
          className="tw-hidden tw-whitespace-nowrap md:tw-inline"
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
      <E2eeBadge variant="plaintext" label={label} />
      <button
        type="button"
        onClick={() => void start()}
        disabled={pending}
        title={t(locale, "e2ee.plaintext.start")}
        className="hover:tw-text-primary-200 tw-inline-flex tw-items-center tw-gap-1 tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-60"
      >
        {pending ? <CircleLoader /> : null}
        {t(locale, "e2ee.plaintext.startShort")}
      </button>
    </div>
  );
}
