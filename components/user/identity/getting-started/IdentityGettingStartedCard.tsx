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
  "tw-group/step tw-relative tw-mb-2 tw-block tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-white/[0.035] tw-py-3 tw-pl-3.5 tw-pr-8 tw-text-left tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-bg-white/[0.07] hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none @[20rem]/identity-guide:tw-pr-10";

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
          <span className="tw-flex tw-size-4 tw-flex-none tw-items-center tw-justify-center tw-text-iron-500 group-hover/step:tw-text-iron-300">
            {icon}
          </span>
          {title}
        </span>
        <ArrowRightIcon
          className="tw-absolute tw-right-3 tw-top-1/2 tw-size-3.5 -tw-translate-y-1/2 tw-text-iron-600 tw-transition-[color,transform] group-hover/step:tw-translate-x-0.5 group-hover/step:tw-text-iron-300 group-focus-visible/step:tw-text-iron-300 @[20rem]/identity-guide:tw-right-3.5 motion-reduce:tw-transition-none"
          aria-hidden="true"
        />
      </span>
      <span className="tw-ml-6 tw-mt-1 tw-block tw-text-xs tw-font-normal tw-leading-[18px] tw-text-iron-500">
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
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-px-6 tw-pt-4 @[48rem]/identity-guide:tw-px-8 @[48rem]/identity-guide:tw-pt-5">
        <p className="tw-m-0 tw-text-[10px] tw-font-bold tw-uppercase tw-leading-4 tw-tracking-widest tw-text-emerald-400">
          {t(locale, "identityGettingStarted.eyebrow")}
        </p>
        <button
          type="button"
          aria-label={t(locale, "identityGettingStarted.dismiss")}
          title={t(locale, "identityGettingStarted.dismiss")}
          onClick={onDismiss}
          className="-tw-mr-1.5 tw-inline-flex tw-h-8 tw-cursor-pointer tw-items-center tw-gap-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-pl-2.5 tw-pr-1.5 tw-text-[13px] tw-font-medium tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none [@media(pointer:coarse)]:tw-min-h-11"
        >
          {t(locale, "identityGettingStarted.dismissLabel")}
          <XMarkIcon className="tw-size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="tw-relative tw-z-0 tw-grid tw-grid-cols-1 tw-gap-7 tw-p-6 tw-pt-3 @[30rem]/identity-guide:tw-gap-8 @[48rem]/identity-guide:tw-grid-cols-12 @[48rem]/identity-guide:tw-p-8 @[48rem]/identity-guide:tw-pt-5 @[64rem]/identity-guide:tw-gap-12">
        <div className="tw-flex tw-min-w-0 tw-gap-4 @[48rem]/identity-guide:tw-col-span-7 @[48rem]/identity-guide:tw-gap-5">
          <span
            className="tw-mt-0.5 tw-hidden tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-emerald-500/10 tw-text-emerald-400 @[40rem]/identity-guide:tw-flex"
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
            <h2 className="tw-mb-2 tw-mt-0 tw-text-lg tw-font-bold tw-leading-7 tw-tracking-tight tw-text-white">
              {t(locale, "identityGettingStarted.title")}
            </h2>
            <p className="tw-mb-6 tw-mt-0 tw-max-w-lg tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-400">
              {t(locale, "identityGettingStarted.introduction")}
            </p>
            <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-2 @[20rem]/identity-guide:tw-grid-cols-2 @[30rem]/identity-guide:tw-w-fit @[30rem]/identity-guide:tw-gap-3">
              <ButtonLink
                href="/discover"
                variant="primary"
                size="lg"
                className="tw-min-w-0"
              >
                {t(locale, "identityGettingStarted.discover")}
                <ArrowRightIcon
                  className="tw-size-4 tw-flex-none"
                  aria-hidden="true"
                />
              </ButtonLink>
              <Link
                href="/join-6529"
                className="tw-flex tw-min-h-11 tw-min-w-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-650 hover:tw-bg-iron-900 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
              >
                {t(locale, "identityGettingStarted.guide")}
              </Link>
            </div>
          </div>
        </div>
        <div className="tw-flex tw-min-w-0 tw-flex-col @[48rem]/identity-guide:tw-col-span-5">
          <p className="tw-m-0 tw-mb-2.5 tw-mt-1.5 tw-text-[10px] tw-font-bold tw-uppercase tw-leading-[15px] tw-tracking-widest tw-text-iron-400">
            {t(locale, "identityGettingStarted.explore")}
          </p>
          {mainStageHref && (
            <Link href={mainStageHref} className={SECONDARY_ACTION_CLASS}>
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
