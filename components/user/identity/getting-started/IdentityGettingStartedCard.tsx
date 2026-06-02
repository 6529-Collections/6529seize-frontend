"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser, formatNumberWithCommas } from "@/helpers/Helpers";
import { getWavePathRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import {
  MEMES_NOMINEE_CATEGORY,
  MEMES_NOMINEE_REQUIRED_REP,
  MEMES_SEEKING_NOMINATION_WAVE_ID,
} from "@/helpers/waves/memes-nomination";
import { WAVE_TAB_QUERY_PARAM } from "@/helpers/waves/wave-tabs.helpers";
import useLocalPreference from "@/hooks/useLocalPreference";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

interface IdentityGettingStartedCardProps {
  readonly profile: ApiIdentity;
  readonly className?: string | undefined;
}

const PROFILE_ABOUT_HASH = "#profile-about";
const DISMISSAL_STORAGE_PREFIX = "identity-getting-started-dismissed";
const NOMINATION_WAVE_HREF = getWavePathRoute(MEMES_SEEKING_NOMINATION_WAVE_ID);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const getDismissalProfileKey = (profile: ApiIdentity): string | null => {
  const key = [
    profile.id,
    profile.handle,
    profile.query,
    profile.primary_wallet,
  ]
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0);

  return key ? key.toLowerCase() : null;
};

const hasItems = (items: readonly unknown[] | null | undefined): boolean =>
  (items?.length ?? 0) > 0;

const isEmptyNewProfile = (profile: ApiIdentity): boolean =>
  profile.rep === 0 &&
  profile.cic === 0 &&
  !hasItems(profile.active_main_stage_submission_ids) &&
  !hasItems(profile.winner_main_stage_drop_ids);

function SubmissionStep({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <div className="tw-flex tw-gap-3">
      <CheckCircleIcon className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-primary-300" />
      <div className="tw-min-w-0">
        <p className="tw-mb-1 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
          {title}
        </p>
        <p className="tw-mb-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-400">
          {children}
        </p>
      </div>
    </div>
  );
}

function ArtworkSubmissionPopover({
  faqHref,
}: {
  readonly faqHref: string | null;
}) {
  return (
    <div className="tw-w-[min(88vw,24rem)] tw-p-1">
      <div className="tw-space-y-5 tw-px-2 tw-py-1">
        <SubmissionStep title="1. Share your work">
          Post finished work, sketches, or portfolio links in Seeking
          Nomination.
        </SubmissionStep>
        <SubmissionStep title="2. Earn community REP">
          Community members can give you {MEMES_NOMINEE_CATEGORY} REP for great
          work.
        </SubmissionStep>
        <SubmissionStep title="3. Reach 50k REP">
          Once you hit {formatNumberWithCommas(MEMES_NOMINEE_REQUIRED_REP)}{" "}
          {MEMES_NOMINEE_CATEGORY} REP, you can submit to Main Stage.
        </SubmissionStep>
      </div>

      <div className="tw-mt-6 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-5">
        <Link
          href={NOMINATION_WAVE_HREF}
          className="tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition tw-duration-200 hover:tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <span>Go to Seeking Nomination</span>
          <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0" />
        </Link>

        {faqHref ? (
          <Link
            href={faqHref}
            className="tw-mt-4 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-400 tw-no-underline tw-transition hover:tw-text-iron-200 hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            <BookOpenIcon className="tw-size-4 tw-flex-shrink-0" />
            <span>Read the full FAQ</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function AddAboutLink() {
  const handleClick = () => {
    if (
      typeof window !== "undefined" &&
      window.location.hash === PROFILE_ABOUT_HASH
    ) {
      window.dispatchEvent(new Event("hashchange"));
    }
  };

  return (
    <Link
      href={PROFILE_ABOUT_HASH}
      onClick={handleClick}
      className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-transition hover:tw-border-primary-400 hover:tw-bg-primary-400 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
    >
      Add About
    </Link>
  );
}

function IdentityGettingStartedCardInner({
  className,
  profileKey,
}: {
  readonly className: string | undefined;
  readonly profileKey: string;
}) {
  const settings = useSeizeSettingsOptional();
  const [dismissed, setDismissed] = useLocalPreference(
    `${DISMISSAL_STORAGE_PREFIX}:${profileKey}`,
    false,
    isBoolean
  );

  if (dismissed) {
    return null;
  }

  const mainStageWaveId = settings?.seizeSettings.memes_wave_id?.trim() ?? "";
  const faqHref = mainStageWaveId
    ? getWaveRoute({
        waveId: mainStageWaveId,
        isDirectMessage: false,
        isApp: false,
        extraParams: {
          [WAVE_TAB_QUERY_PARAM]: MyStreamWaveTab.FAQ,
        },
      })
    : null;

  return (
    <section
      className={`tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0b0d12] tw-p-4 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:tw-p-5 ${className ?? ""}`}
      aria-label="Getting started"
    >
      <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-[radial-gradient(circle_at_0%_0%,rgba(64,106,254,0.12),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.1),transparent_30%)]" />
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss getting started"
        className="tw-absolute tw-right-3 tw-top-3 tw-z-10 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <XMarkIcon className="tw-size-5" />
      </button>

      <div className="tw-relative tw-z-10 tw-flex tw-gap-4 tw-pr-8">
        <div className="tw-flex tw-size-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/25 tw-bg-primary-500/10 tw-text-primary-300">
          <SparklesIcon className="tw-size-5" />
        </div>

        <div className="tw-min-w-0 tw-flex-1">
          <h3 className="tw-mb-1 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
            Getting started
          </h3>
          <p className="tw-mb-0 tw-max-w-3xl tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-400">
            Your identity is live. Add an About statement, explore Waves, or
            learn how artwork reaches The Memes Main Stage.
          </p>
        </div>
      </div>

      <div className="tw-relative tw-z-10 tw-mt-5 tw-flex tw-flex-wrap tw-gap-2">
        <AddAboutLink />
        <Link
          href="/waves"
          className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          Explore Waves
        </Link>
        <HoverCard
          content={<ArtworkSubmissionPopover faqHref={faqHref} />}
          ariaLabel="Artwork submission guidance"
          placement="bottom"
          delayShow={150}
          delayHide={0}
          offset={12}
          openOnClick
        >
          <button
            type="button"
            className="tw-inline-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3.5 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            Artwork submissions
          </button>
        </HoverCard>
      </div>
    </section>
  );
}

export default function IdentityGettingStartedCard({
  profile,
  className,
}: IdentityGettingStartedCardProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { address } = useSeizeConnectContext();
  const profileKey = getDismissalProfileKey(profile);
  const isOwnDirectProfile =
    !!profile.handle?.trim() &&
    !activeProfileProxy &&
    amIUser({
      profile,
      address,
      connectedHandle: connectedProfile?.handle ?? undefined,
    });

  if (!profileKey || !isOwnDirectProfile || !isEmptyNewProfile(profile)) {
    return null;
  }

  return (
    <IdentityGettingStartedCardInner
      key={profileKey}
      className={className}
      profileKey={profileKey}
    />
  );
}
