"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getNodeEnv } from "@/config/env";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { getWavePathRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import { MEMES_SEEKING_NOMINATION_WAVE_ID } from "@/helpers/waves/memes-nomination";
import { WAVE_TAB_QUERY_PARAM } from "@/helpers/waves/wave-tabs.helpers";
import { MyStreamWaveTab } from "@/types/waves.types";
import {
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  PlusCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import {
  clearIdentityGettingStartedSession,
  hasIdentityGettingStartedSession,
} from "./identityGettingStartedSession";

interface IdentityGettingStartedCardProps {
  readonly profile: ApiIdentity;
  readonly className?: string | undefined;
}

interface NextStepAction {
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly href: string;
  readonly icon: ReactNode;
}

const NOMINATION_WAVE_HREF = getWavePathRoute(MEMES_SEEKING_NOMINATION_WAVE_ID);
const TEST_VISIBILITY_QUERY_PARAM = "showIdentityGettingStarted";
const CREATE_WAVE_HREF = "/waves?create=wave";

const getProfileHandle = (profile: ApiIdentity): string | null => {
  const handle = profile.handle?.trim();
  if (!handle) {
    return null;
  }
  return handle;
};

function IdentityGettingStartedAction({
  action,
  onClick,
}: {
  readonly action: NextStepAction;
  readonly onClick: () => void;
}) {
  return (
    <article className="tw-group tw-relative tw-flex tw-flex-col tw-gap-5 tw-overflow-hidden tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-gradient-to-b tw-from-[#0a0a0c] tw-to-[#050505] tw-p-4 tw-transition-all tw-duration-300 hover:tw-border-primary-400/25 hover:tw-shadow-[0_0_30px_-5px_rgba(59,130,246,0.12)]">
      <div className="tw-pointer-events-none tw-absolute tw-right-0 tw-top-0 tw-size-32 tw-rounded-full tw-bg-primary-500/5 tw-opacity-0 tw-blur-[30px] tw-transition-opacity tw-duration-700 group-hover:tw-opacity-100" />

      <div className="tw-relative tw-z-10 tw-flex tw-gap-4">
        <div className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.02] tw-text-zinc-300 tw-shadow-inner tw-transition-colors tw-duration-300 group-hover:tw-bg-white/[0.05]">
          {action.icon}
        </div>

        <div className="tw-min-w-0 tw-pt-0.5">
          <h4 className="tw-mb-1 tw-text-sm tw-font-bold tw-leading-5 tw-tracking-wide tw-text-white">
            {action.title}
          </h4>
          <p className="tw-mb-0 tw-pr-2 tw-text-[0.8125rem] tw-font-medium tw-leading-snug tw-text-[#88888e]">
            {action.description}
          </p>
        </div>
      </div>

      <Link
        href={action.href}
        onClick={onClick}
        className="tw-relative tw-z-10 tw-flex tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.04] tw-bg-white/[0.02] tw-px-3 tw-py-2.5 tw-text-center tw-text-xs tw-font-semibold tw-leading-5 tw-text-white tw-no-underline tw-transition-all tw-duration-300 hover:tw-border-white/[0.1] hover:tw-bg-white/[0.06] hover:tw-text-white hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        <span>{action.ctaLabel}</span>
        <ArrowRightIcon className="tw-size-3.5 tw-text-[#a1a1aa] tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-white" />
      </Link>
    </article>
  );
}

function IdentityGettingStartedCardContent({
  className,
  onDismiss,
}: {
  readonly className: string | undefined;
  readonly onDismiss: () => void;
}) {
  const settings = useSeizeSettingsOptional();
  const mainStageWaveId = settings?.seizeSettings.memes_wave_id?.trim() ?? "";

  const actions = useMemo<NextStepAction[]>(() => {
    const mainStageHref = mainStageWaveId
      ? getWaveRoute({
          waveId: mainStageWaveId,
          isDirectMessage: false,
          isApp: false,
          extraParams: {
            [WAVE_TAB_QUERY_PARAM]: MyStreamWaveTab.LEADERBOARD,
          },
        })
      : null;

    return [
      ...(mainStageHref
        ? [
            {
              title: "Explore art",
              description: "The Memes Main Stage",
              ctaLabel: "Open Main Stage",
              href: mainStageHref,
              icon: <SparklesIcon className="tw-size-4" />,
            },
          ]
        : []),
      {
        title: "Join conversations",
        description: "Active community waves",
        ctaLabel: "Browse Waves",
        href: "/waves",
        icon: <ChatBubbleLeftRightIcon className="tw-size-4" />,
      },
      {
        title: "Create a wave",
        description: "Start your own space",
        ctaLabel: "Create Wave",
        href: CREATE_WAVE_HREF,
        icon: <PlusCircleIcon className="tw-size-4" />,
      },
      {
        title: "Submit art",
        description: "Seek nomination for The Memes",
        ctaLabel: "Seek Nomination",
        href: NOMINATION_WAVE_HREF,
        icon: <BoltIcon className="tw-size-4" />,
      },
    ];
  }, [mainStageWaveId]);

  return (
    <section
      className={`tw-relative ${className ?? ""}`}
      aria-label="Get started"
    >
      <div className="tw-mb-6 tw-flex tw-items-center tw-justify-between tw-gap-4 tw-px-1">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/10">
            <SparklesIcon className="tw-size-4 tw-text-primary-400" />
          </div>
          <h3 className="tw-mb-0 tw-text-lg tw-font-bold tw-leading-6 tw-tracking-tight tw-text-white">
            Get Started
          </h3>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss getting started"
          className="tw-flex tw-size-8 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-transparent tw-bg-transparent tw-text-iron-500 tw-transition-colors tw-duration-200 hover:tw-bg-white/[0.04] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon className="tw-size-5" />
        </button>
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        {actions.map((action) => (
          <IdentityGettingStartedAction
            key={action.title}
            action={action}
            onClick={onDismiss}
          />
        ))}
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
  const searchParams = useSearchParams();
  const profileHandle = getProfileHandle(profile);
  const [isDismissed, setIsDismissed] = useState(false);
  const forceVisibleForTesting =
    getNodeEnv() !== "production" &&
    searchParams.get(TEST_VISIBILITY_QUERY_PARAM) === "1";
  const isVisible =
    !isDismissed &&
    (forceVisibleForTesting || hasIdentityGettingStartedSession(profileHandle));

  const isOwnDirectProfile =
    !!profileHandle &&
    !activeProfileProxy &&
    amIUser({
      profile,
      address,
      connectedHandle: connectedProfile?.handle ?? undefined,
    });

  const dismiss = () => {
    clearIdentityGettingStartedSession(profileHandle);
    setIsDismissed(true);
  };

  if (!profileHandle || !isOwnDirectProfile || !isVisible) {
    return null;
  }

  return (
    <IdentityGettingStartedCardContent
      className={className}
      onDismiss={dismiss}
    />
  );
}
