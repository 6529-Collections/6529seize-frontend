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
  "tw-group/step tw-relative tw-isolate tw-flex tw-min-h-16 tw-w-full tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2.5 tw-text-left tw-text-iron-200 tw-no-underline tw-transition-colors before:tw-pointer-events-none before:tw-absolute before:tw-inset-x-0 before:tw-inset-y-0.5 before:-tw-z-10 before:tw-rounded-lg before:tw-border before:tw-border-solid before:tw-border-iron-200/[0.055] before:tw-bg-black/[0.17] before:tw-content-[''] hover:tw-bg-emerald-900/20 hover:tw-text-emerald-400 hover:tw-no-underline hover:before:tw-border-emerald-500/30 hover:before:tw-bg-emerald-950/20 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none";

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
      <span className="tw-mt-0.5 tw-flex tw-size-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-400 group-hover/step:tw-text-emerald-400">
        {icon}
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-sm tw-font-medium tw-leading-5">
          {title}
        </span>
        <span className="tw-mt-1 tw-block tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-300">
          {description}
        </span>
      </span>
      <ArrowRightIcon
        className="tw-mt-0.5 tw-size-4 tw-flex-none tw-text-iron-400 group-hover/step:tw-text-emerald-400"
        aria-hidden="true"
      />
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
      className={`tw-relative tw-scroll-mt-24 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-emerald-500/[0.16] tw-bg-iron-950 tw-bg-[radial-gradient(ellipse_at_0%_0%,rgba(16,185,129,0.045),transparent_55%),linear-gradient(135deg,rgba(6,78,59,0.3),transparent_58%)] tw-antialiased tw-@container/identity-guide before:tw-pointer-events-none before:tw-absolute before:tw-inset-x-0 before:tw-top-0 before:tw-h-px before:tw-bg-[linear-gradient(90deg,transparent_4%,rgba(52,211,153,0.72)_36%,rgba(52,211,153,0.25)_75%,transparent)] before:tw-content-[''] ${className ?? ""}`}
      aria-label={t(locale, "identityGettingStarted.region")}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t(locale, "identityGettingStarted.dismiss")}
        title={t(locale, "identityGettingStarted.dismiss")}
        className="tw-absolute tw-right-2 tw-top-2 tw-z-10 tw-flex tw-size-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        <XMarkIcon className="tw-size-4" aria-hidden="true" />
      </button>
      <div className="tw-contents">
        <span
          className="tw-absolute tw-left-6 tw-top-4 tw-hidden tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-gradient-to-br tw-from-emerald-400 tw-to-emerald-600 tw-text-emerald-950 tw-shadow-[0_3px_12px_rgba(16,185,129,0.12)] @[40rem]/identity-guide:tw-flex"
          aria-hidden="true"
        >
          <svg
            className="tw-size-6"
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
        <div className="tw-grid @[48rem]/identity-guide:tw-grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="tw-min-w-0 tw-p-5 @[40rem]/identity-guide:tw-pl-24 sm:tw-py-6 sm:tw-pr-6">
            <h2 className="tw-m-0 tw-w-full tw-pr-10 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-white @[48rem]/identity-guide:tw-pr-0">
              {t(locale, "identityGettingStarted.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-2 tw-w-full tw-max-w-lg tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-300">
              {t(locale, "identityGettingStarted.introduction")}
            </p>
            <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-1">
              <ButtonLink href="/discover" variant="primary" size="lg">
                {t(locale, "identityGettingStarted.discover")}
                <ArrowRightIcon
                  className="tw-size-4 tw-flex-none"
                  aria-hidden="true"
                />
              </ButtonLink>
              <Link
                href="/join-6529"
                className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-bg-emerald-900/20 hover:tw-text-emerald-400 hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "identityGettingStarted.guide")}
                <ArrowUpRightIcon className="tw-size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-600/35 tw-px-5 tw-py-5 @[48rem]/identity-guide:tw-my-5 @[48rem]/identity-guide:tw-border-l @[48rem]/identity-guide:tw-border-t-0 @[48rem]/identity-guide:tw-py-0 sm:tw-px-6">
            <p className="tw-mb-1 tw-mt-0 tw-px-2 tw-text-xs tw-font-medium tw-uppercase tw-leading-5 tw-tracking-wider tw-text-iron-300 @[48rem]/identity-guide:tw-pr-8">
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
