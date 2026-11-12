"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import MainStageNominationPopover, {
  MainStageNominationPopoverContent,
} from "@/components/brain/my-stream/tabs/MainStageNominationPopover";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useCapacitor from "@/hooks/useCapacitor";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  PaintBrushIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  clearIdentityGettingStartedSession,
  consumeIdentityGettingStartedArrival,
  hasIdentityGettingStartedSession,
} from "./identityGettingStartedSession";

const SECONDARY_ACTION_CLASS =
  "tw-group/step tw-block tw-w-full tw-cursor-pointer tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-black/20 tw-p-3 tw-text-left tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-border-emerald-500/30 hover:tw-bg-emerald-950/20 hover:tw-text-emerald-400 hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none";

function NextStepContent({
  title,
  description,
  icon,
}: {
  readonly title: string;
  readonly description: string;
  readonly icon: ReactNode;
}) {
  return (
    <>
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-leading-5">
          <span className="tw-flex tw-size-4 tw-flex-none tw-items-center tw-justify-center tw-text-iron-500 group-hover/step:tw-text-emerald-400">
            {icon}
          </span>
          {title}
        </span>
        <ArrowRightIcon
          className="tw-size-3 tw-flex-none -tw-translate-x-2 tw-text-iron-600 tw-opacity-0 tw-transition-all group-focus-within/step:tw-translate-x-0 group-focus-within/step:tw-opacity-100 group-hover/step:tw-translate-x-0 group-hover/step:tw-text-emerald-400 group-hover/step:tw-opacity-100 motion-reduce:tw-transition-none [@media(pointer:coarse)]:tw-translate-x-0 [@media(pointer:coarse)]:tw-opacity-100"
          aria-hidden="true"
        />
      </span>
      <span className="tw-ml-6 tw-mt-1 tw-block tw-text-[11px] tw-font-normal tw-leading-relaxed tw-text-iron-500">
        {description}
      </span>
    </>
  );
}

function IdentityGettingStartedCardContent({
  profile,
  className,
  onDismiss,
}: {
  readonly profile: ApiIdentity;
  readonly className: string | undefined;
  readonly onDismiss: () => void;
}) {
  const locale = useBrowserLocale();
  const settings = useSeizeSettingsOptional();
  const isTouchDevice = useIsTouchDevice();
  const { isCapacitor } = useCapacitor();
  const useTouchDialog = isTouchDevice || isCapacitor;
  const cardRef = useRef<HTMLElement>(null);
  const [isSubmissionGuideOpen, setIsSubmissionGuideOpen] = useState(false);
  const mainStageWaveId = settings?.seizeSettings.memes_wave_id?.trim();
  const mainStageHref = mainStageWaveId
    ? getWaveRoute({
        waveId: mainStageWaveId,
        isDirectMessage: false,
        isApp: false,
      })
    : null;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let frame: number | undefined;

    const reveal = () => {
      frame = undefined;
      // Native startup can mount this card under a hidden layout. Preserve the
      // one-time request until scrolling can reach an actual rendered box.
      if (card.getClientRects().length === 0) return;
      observer.disconnect();
      if (!consumeIdentityGettingStartedArrival(profile.handle)) return;

      const reduceMotion = globalThis.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      card.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "instant" : "smooth",
      });
    };
    const observer = new ResizeObserver(() => {
      frame ??= globalThis.requestAnimationFrame(reveal);
    });
    observer.observe(card);
    // Let the layout and any route scroll settle before the one-time reveal.
    frame = globalThis.requestAnimationFrame(reveal);

    return () => {
      observer.disconnect();
      if (frame !== undefined) globalThis.cancelAnimationFrame(frame);
    };
  }, [profile.handle]);

  return (
    <section
      ref={cardRef}
      className={`tw-relative tw-scroll-mt-24 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-emerald-500/10 tw-bg-iron-950 tw-bg-gradient-to-br tw-from-emerald-900/20 tw-via-transparent tw-to-transparent tw-antialiased tw-@container/identity-guide before:tw-pointer-events-none before:tw-absolute before:tw-inset-x-0 before:tw-top-0 before:tw-h-px before:tw-bg-gradient-to-r before:tw-from-transparent before:tw-via-emerald-400/80 before:tw-to-transparent before:tw-content-[''] ${className ?? ""}`}
      aria-label={t(locale, "identityGettingStarted.region")}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t(locale, "identityGettingStarted.dismiss")}
        title={t(locale, "identityGettingStarted.dismiss")}
        className="tw-absolute tw-right-2 tw-top-2 tw-z-10 tw-flex tw-size-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors hover:tw-bg-white/10 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        <XMarkIcon className="tw-size-4" aria-hidden="true" />
      </button>
      <div className="tw-relative tw-z-0 tw-grid tw-grid-cols-1 tw-gap-8 tw-p-6 @[48rem]/identity-guide:tw-grid-cols-12 @[48rem]/identity-guide:tw-p-8 @[64rem]/identity-guide:tw-gap-12">
        <div className="tw-flex tw-min-w-0 tw-gap-4 @[48rem]/identity-guide:tw-col-span-7 @[48rem]/identity-guide:tw-gap-5">
          <span
            className="tw-mt-0.5 tw-hidden tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-emerald-400 tw-to-emerald-600 tw-text-emerald-950 tw-shadow-md tw-shadow-emerald-500/20 @[40rem]/identity-guide:tw-flex"
            aria-hidden="true"
          >
            <svg
              className="tw-size-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m20 6-11 11-5-5" />
            </svg>
          </span>
          <div className="tw-min-w-0">
            <h2 className="tw-mb-2 tw-mt-0 tw-pr-10 tw-text-lg tw-font-bold tw-leading-7 tw-tracking-tight tw-text-white @[48rem]/identity-guide:tw-pr-0">
              {t(locale, "identityGettingStarted.title")}
            </h2>
            <p className="tw-mb-6 tw-mt-0 tw-max-w-lg tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-400">
              {t(locale, "identityGettingStarted.introduction")}
            </p>
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
              <ButtonLink href="/discover" variant="primary" size="lg">
                {t(locale, "identityGettingStarted.discover")}
                <ArrowRightIcon
                  className="tw-size-4 tw-flex-none"
                  aria-hidden="true"
                />
              </ButtonLink>
              <Link
                href="/join-6529"
                className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/40 tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-border-iron-700 hover:tw-bg-iron-800 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
              >
                {t(locale, "identityGettingStarted.guide")}
                <ArrowUpRightIcon
                  className="tw-size-3 tw-text-iron-500"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-justify-center @[48rem]/identity-guide:tw-col-span-5">
          <div className="tw-mb-3 tw-flex tw-items-center tw-gap-2 tw-px-1 @[48rem]/identity-guide:tw-pr-8">
            <span
              className="tw-size-1.5 tw-flex-none tw-rounded-full tw-bg-emerald-500/50"
              aria-hidden="true"
            />
            <p className="tw-m-0 tw-text-[10px] tw-font-bold tw-uppercase tw-leading-[15px] tw-tracking-widest tw-text-iron-400">
              {t(locale, "identityGettingStarted.explore")}
            </p>
          </div>
          {mainStageHref && (
            <Link
              href={mainStageHref}
              className={`${SECONDARY_ACTION_CLASS} tw-mb-2`}
            >
              <NextStepContent
                title={t(locale, "identityGettingStarted.mainStage")}
                description={t(
                  locale,
                  "identityGettingStarted.mainStageDescription"
                )}
                icon={<PhotoIcon className="tw-size-4" aria-hidden="true" />}
              />
            </Link>
          )}
          <MainStageNominationPopover
            disabled={useTouchDialog}
            focusOnKeyboardActivation={!useTouchDialog}
          >
            <button
              type="button"
              className={SECONDARY_ACTION_CLASS}
              aria-haspopup="dialog"
              onClick={() => {
                if (useTouchDialog) setIsSubmissionGuideOpen(true);
              }}
            >
              <NextStepContent
                title={t(locale, "identityGettingStarted.submission")}
                description={t(
                  locale,
                  "identityGettingStarted.submissionDescription"
                )}
                icon={
                  <PaintBrushIcon className="tw-size-4" aria-hidden="true" />
                }
              />
            </button>
          </MainStageNominationPopover>
          <MobileWrapperDialog
            title={t(locale, "identityGettingStarted.submission")}
            isOpen={isSubmissionGuideOpen}
            onClose={() => setIsSubmissionGuideOpen(false)}
            tabletModal
            showHeaderCloseButton
            maxWidthClass="md:tw-max-w-md"
          >
            <div className="tw-flex tw-justify-center tw-px-4">
              <MainStageNominationPopoverContent />
            </div>
          </MobileWrapperDialog>
        </div>
      </div>
    </section>
  );
}

export default function IdentityGettingStartedCard({
  profile,
  className,
}: {
  readonly profile: ApiIdentity;
  readonly className?: string | undefined;
}) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const hasHydrated = useHasHydrated();
  const [isDismissed, setIsDismissed] = useState(false);
  const profileHandle = profile.handle?.trim();
  const isOwnDirectProfile =
    !activeProfileProxy &&
    amIUser({
      profile,
      address,
      connectedHandle: connectedProfile?.handle ?? undefined,
    });

  if (
    !hasHydrated ||
    !profileHandle ||
    !isOwnDirectProfile ||
    isDismissed ||
    !hasIdentityGettingStartedSession(profileHandle)
  )
    return null;

  return (
    <IdentityGettingStartedCardContent
      profile={profile}
      className={className}
      onDismiss={() => {
        clearIdentityGettingStartedSession(profileHandle);
        setIsDismissed(true);
      }}
    />
  );
}
