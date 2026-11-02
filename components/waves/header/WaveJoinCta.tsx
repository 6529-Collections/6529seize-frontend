"use client";

import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import Button from "@/components/utils/button/Button";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveJoin } from "@/hooks/waves/useWaveJoin";
import {
  getWaveJoinCtaState,
  JOIN_CONFIRMATION_MS,
} from "@/helpers/waves/wave-join.helpers";
import { t } from "@/i18n/messages";

type WaveJoinCtaVariant = "header" | "app-header";

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

const BUTTON_SIZE_CLASSES: Record<WaveJoinCtaVariant, string> = {
  header: "tw-h-8",
  "app-header": "tw-h-9",
};

interface WaveJoinCtaProps {
  readonly wave: ApiWave;
  readonly variant?: WaveJoinCtaVariant | undefined;
  /** Shared header tooltip id; omit on touch-first headers. */
  readonly tooltipId?: string | undefined;
  readonly className?: string | undefined;
}

type RuntimeChatWave = Omit<ApiWave, "chat"> & {
  readonly chat?: {
    readonly scope?: {
      readonly group?: { readonly is_direct_message?: boolean | null } | null;
    } | null;
  } | null;
};

// Header fixtures and partial cache entries can omit chat scope at runtime.
const isDirectMessageWave = (wave: ApiWave): boolean =>
  (wave as RuntimeChatWave).chat?.scope?.group?.is_direct_message === true;

// Keyboard activation leaves the button focus-visible; pointer and touch
// activation do not.
const isKeyboardActivation = (button: HTMLButtonElement): boolean => {
  try {
    return button.matches(":focus-visible");
  } catch {
    return document.activeElement === button;
  }
};

const isFocusWithin = (
  container: HTMLElement | null,
  activeElement: Element | null
): boolean =>
  activeElement === null ||
  activeElement === document.body ||
  (container?.contains(activeElement) ?? false);

export default function WaveJoinCta({
  wave,
  variant = "header",
  tooltipId,
  className,
}: WaveJoinCtaProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const {
    connectionState,
    hasActiveWalletAddress,
    seizeConnect,
    seizeConnectOpen,
  } = useSeizeConnectContext();
  const locale = useBrowserLocale();
  const { isJoined, isPending, join } = useWaveJoin(wave);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );
  const [joinedWaveId, setJoinedWaveId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusConfirmationRef = useRef(false);
  const confirmationExpiredRef = useRef(false);

  const state = getWaveJoinCtaState({
    isDirectMessage: isDirectMessageWave(wave),
    hasProfileHandle: !!connectedProfile?.handle,
    isProxy: !!activeProfileProxy,
    isSignedOut: connectionState === "disconnected" && !hasActiveWalletAddress,
    isJoined,
    joinedHere: joinedWaveId === wave.id,
  });
  const isConfirming = state === "joined";

  // The "Joined" confirmation settles into the member header after a short
  // beat. It never disappears while it holds keyboard focus; blur ends it.
  useEffect(() => {
    if (!isConfirming) {
      return;
    }
    confirmationExpiredRef.current = false;
    const timer = globalThis.setTimeout(() => {
      confirmationExpiredRef.current = true;
      if (!rootRef.current?.contains(document.activeElement)) {
        setJoinedWaveId(null);
      }
    }, JOIN_CONFIRMATION_MS);
    return () => globalThis.clearTimeout(timer);
  }, [isConfirming]);

  // Server and hydration renders cannot know the session; render nothing
  // until the client resolves it so members never see a flash of Join.
  if (!hydrated || state === "hidden") {
    return null;
  }

  const waveName = wave.name;
  const sizeClasses = BUTTON_SIZE_CLASSES[variant];

  const handleJoin = async (viaKeyboard: boolean) => {
    const joined = await join();
    // Keep keyboard focus in place: the button is disabled while joining,
    // which can drop focus to the page. Pointer and touch joins never move
    // focus, so their confirmation can settle on its own.
    const keepFocusHere =
      viaKeyboard && isFocusWithin(rootRef.current, document.activeElement);
    if (joined) {
      focusConfirmationRef.current = keepFocusHere;
      setJoinedWaveId(wave.id);
      return;
    }
    if (keepFocusHere) {
      buttonRef.current?.focus();
    }
  };

  const focusConfirmation = (node: HTMLSpanElement | null) => {
    if (node && focusConfirmationRef.current) {
      focusConfirmationRef.current = false;
      node.focus();
    }
  };

  const renderControl = () => {
    if (state === "joined") {
      return (
        <span
          ref={focusConfirmation}
          tabIndex={-1}
          onBlur={() => {
            if (confirmationExpiredRef.current) {
              setJoinedWaveId(null);
            }
          }}
          data-testid="wave-join-confirmation"
          className={clsx(
            "tw-inline-flex tw-flex-shrink-0 tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.05] tw-px-2.5 tw-text-xs tw-font-semibold tw-text-iron-200 focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400",
            sizeClasses
          )}
        >
          <CheckIcon
            className="tw-size-4 tw-flex-shrink-0 tw-text-emerald-400"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{t(locale, "waves.join.joined")}</span>
        </span>
      );
    }

    const isSignIn = state === "sign-in";
    const tooltip = t(
      locale,
      isSignIn ? "waves.join.signInTooltip" : "waves.join.actionTooltip"
    );

    return (
      <Button
        ref={buttonRef}
        variant="primary"
        size={null}
        loading={!isSignIn && isPending}
        disabled={isSignIn && seizeConnectOpen}
        aria-busy={isSignIn && seizeConnectOpen ? true : undefined}
        aria-label={t(locale, "waves.join.actionAriaLabel", { waveName })}
        {...(tooltipId
          ? {
              "data-tooltip-id": tooltipId,
              "data-tooltip-content": tooltip,
            }
          : {})}
        onClick={(event) => {
          if (isSignIn) {
            seizeConnect();
            return;
          }
          void handleJoin(isKeyboardActivation(event.currentTarget));
        }}
        className={clsx("tw-px-2.5 tw-text-xs", sizeClasses)}
      >
        {!isPending && (
          <PlusIcon
            className="-tw-ml-0.5 tw-size-4 tw-flex-shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <span>{t(locale, "waves.join.action")}</span>
      </Button>
    );
  };

  return (
    <div
      ref={rootRef}
      className={clsx("tw-flex tw-flex-shrink-0 tw-items-center", className)}
    >
      {renderControl()}
      <output aria-live="polite" className="tw-sr-only">
        {state === "joined"
          ? t(locale, "waves.join.joinedAnnouncement", { waveName })
          : ""}
      </output>
    </div>
  );
}
