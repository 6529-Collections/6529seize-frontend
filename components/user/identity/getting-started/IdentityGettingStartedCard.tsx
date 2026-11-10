"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { MainStageNominationPopoverContent } from "@/components/brain/my-stream/tabs/MainStageNominationPopover";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import ButtonLink from "@/components/utils/button/ButtonLink";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { t } from "@/i18n/messages";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  PaintBrushIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import IdentityGettingStartedAboutAction from "./IdentityGettingStartedAboutAction";
import {
  clearIdentityGettingStartedSession,
  consumeIdentityGettingStartedArrival,
  hasIdentityGettingStartedSession,
} from "./identityGettingStartedSession";

const SECONDARY_ACTION_CLASS =
  "tw-group/step tw-flex tw-min-h-16 tw-w-full tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-0 tw-py-3 tw-text-left tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-bg-white/[0.03] hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none";

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
      <span className="tw-mt-0.5 tw-flex tw-size-5 tw-flex-none tw-items-center tw-justify-center tw-text-iron-400">
        {icon}
      </span>
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-sm tw-font-semibold tw-leading-5">
          {title}
        </span>
        <span className="tw-mt-1 tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
          {description}
        </span>
      </span>
      <ArrowRightIcon
        className="tw-mt-0.5 tw-size-4 tw-flex-none tw-text-iron-400"
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
    // Wait for the rendered target and let any route scroll run first.
    const frame = globalThis.requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card || !consumeIdentityGettingStartedArrival(profile.handle)) {
        return;
      }
      const reduceMotion = globalThis.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      card.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "instant" : "smooth",
      });
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [profile.handle]);

  return (
    <section
      ref={cardRef}
      className={`tw-relative tw-scroll-mt-24 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 ${className ?? ""}`}
      aria-label={t(locale, "identityGettingStarted.region")}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t(locale, "identityGettingStarted.dismiss")}
        className="tw-absolute tw-right-2 tw-top-2 tw-z-10 tw-flex tw-size-11 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none"
      >
        <XMarkIcon className="tw-size-4" aria-hidden="true" />
      </button>
      <div className="tw-p-5 sm:tw-p-6">
        <p className="tw-mb-4 tw-mt-0 tw-flex tw-items-center tw-gap-2 tw-pr-10 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
          <CheckCircleIcon
            className="tw-size-4 tw-text-emerald-300"
            aria-hidden="true"
          />
          {t(locale, "identityGettingStarted.created")}
        </p>
        <div className="tw-grid tw-gap-6 md:tw-grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:tw-gap-10">
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-start">
            <h2 className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50 lg:tw-text-[28px] lg:tw-leading-9">
              {t(locale, "identityGettingStarted.title")}
            </h2>
            <p className="tw-mb-0 tw-mt-3 tw-max-w-md tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-300">
              {t(locale, "identityGettingStarted.introduction")}
            </p>
            <ButtonLink
              href="/discover"
              variant="primary"
              size="md"
              className="tw-mt-5 tw-min-h-11 tw-w-full tw-justify-between tw-gap-5 sm:tw-w-auto"
            >
              {t(locale, "identityGettingStarted.discover")}
              <ArrowRightIcon
                className="tw-size-4 tw-flex-none"
                aria-hidden="true"
              />
            </ButtonLink>
            <p className="tw-mb-0 tw-mt-3 tw-max-w-sm tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-300">
              {t(locale, "identityGettingStarted.wavesDescription")}
            </p>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col md:tw-pt-1">
            <p className="tw-mb-2 tw-mt-0 tw-pl-8 tw-text-xs tw-font-medium tw-uppercase tw-leading-5 tw-tracking-wider tw-text-iron-400">
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
            <button
              type="button"
              className={SECONDARY_ACTION_CLASS}
              aria-haspopup="dialog"
              onClick={() => setIsSubmissionGuideOpen(true)}
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
      <div className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-px-5 tw-py-2 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center sm:tw-gap-x-6 sm:tw-px-6">
        <IdentityGettingStartedAboutAction profile={profile} />
        <Link
          href="/join-6529"
          className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-text-xs tw-font-medium tw-text-iron-300 tw-no-underline hover:tw-text-iron-50 hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "identityGettingStarted.guide")}
          <ArrowUpRightIcon className="tw-size-4" aria-hidden="true" />
        </Link>
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
