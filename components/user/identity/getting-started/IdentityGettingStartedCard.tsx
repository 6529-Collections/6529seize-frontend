"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";
import { getWavePathRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import { MEMES_SEEKING_NOMINATION_WAVE_ID } from "@/helpers/waves/memes-nomination";
import {
  ArrowRightIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
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
  readonly description?: string;
  readonly href: string;
  readonly icon: ReactNode;
}

const CREATE_WAVE_HREF = "/waves?create=wave";
const COMMUNITY_WAVES_HREF = "/waves";
const NOMINATION_WAVE_HREF = getWavePathRoute(MEMES_SEEKING_NOMINATION_WAVE_ID);

const getProfileHandle = (profile: ApiIdentity): string | null => {
  const handle = profile.handle?.trim();
  if (!handle) {
    return null;
  }
  return handle;
};

function IdentityGettingStartedPrimaryAction({
  href,
}: {
  readonly href: string;
}) {
  return (
    <Link
      href={href}
      className="tw-group/main tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-bg-iron-100 tw-px-4 tw-py-2.5 tw-text-left tw-text-black tw-no-underline tw-shadow-[0_0_24px_rgba(255,255,255,0.08)] tw-transition-all tw-duration-300 hover:-tw-translate-y-0.5 hover:tw-bg-iron-300 hover:tw-text-black hover:tw-no-underline hover:tw-shadow-[0_0_26px_rgba(255,255,255,0.1)] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-w-fit sm:tw-min-w-60"
    >
      <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
        <span className="tw-flex tw-size-4 tw-flex-shrink-0 tw-items-center tw-justify-center tw-text-black md:tw-hidden lg:tw-flex">
          <SparklesIcon className="tw-size-4" />
        </span>
        <span className="tw-min-w-0">
          <span className="tw-block tw-text-sm tw-font-bold tw-leading-5 tw-text-black">
            Explore the Main Stage
          </span>
        </span>
      </span>

      <ArrowRightIcon className="tw-size-4 tw-flex-shrink-0 tw-text-black tw-transition-transform tw-duration-300 desktop-hover:group-hover/main:tw-translate-x-1" />
    </Link>
  );
}

function IdentityGettingStartedSecondaryAction({
  action,
}: {
  readonly action: NextStepAction;
}) {
  return (
    <Link
      href={action.href}
      className="tw-group/item tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-transparent tw-bg-white/[0.02] tw-px-3 tw-py-2.5 tw-text-left tw-no-underline tw-transition-all tw-duration-200 hover:tw-border-white/[0.05] hover:tw-bg-white/[0.04] hover:tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-[0.99] active:tw-bg-white/[0.06] md:tw-p-3"
    >
      <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
        <span className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.03] tw-text-iron-300 tw-shadow-sm tw-transition-colors desktop-hover:group-hover/item:tw-bg-white/[0.06] desktop-hover:group-hover/item:tw-text-white md:tw-bg-white/[0.04]">
          {action.icon}
        </span>

        <span className="tw-min-w-0 tw-pr-1">
          <span className="tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200 tw-transition-colors desktop-hover:group-hover/item:tw-text-white">
            {action.title}
          </span>
          <span className="tw-mt-1 tw-hidden tw-text-xxs tw-leading-4 tw-text-iron-500 tw-transition-colors desktop-hover:group-hover/item:tw-text-iron-400 lg:tw-block">
            {action.description}
          </span>
        </span>
      </span>

      <ArrowRightIcon className="tw-mr-1 tw-size-4 tw-flex-shrink-0 tw-text-iron-600 tw-transition-all tw-duration-300 desktop-hover:group-hover/item:tw-translate-x-0.5 desktop-hover:group-hover/item:tw-text-white" />
    </Link>
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

  const mainStageHref = useMemo(
    () =>
      mainStageWaveId
        ? getWaveRoute({
            waveId: mainStageWaveId,
            isDirectMessage: false,
            isApp: false,
          })
        : null,
    [mainStageWaveId]
  );

  const secondaryActions = useMemo<NextStepAction[]>(
    () => [
      {
        title: "Join conversations",
        description: "Connect with the community in active waves",
        href: COMMUNITY_WAVES_HREF,
        icon: <ChatBubbleLeftRightIcon className="tw-size-4" />,
      },
      {
        title: "Create a wave",
        description: "Start your own space and spark discussions",
        href: CREATE_WAVE_HREF,
        icon: <PlusIcon className="tw-size-4" />,
      },
      {
        title: "Submit art",
        description: "Seek nomination to get featured on the Main Stage",
        href: NOMINATION_WAVE_HREF,
        icon: <ArrowUpTrayIcon className="tw-size-4" />,
      },
    ],
    []
  );

  if (!mainStageHref) {
    return null;
  }

  return (
    <section
      className={`tw-group tw-relative ${className ?? ""}`}
      aria-label="Getting started with your identity"
    >
      <div className="tw-pointer-events-none tw-absolute -tw-inset-2 tw-rounded-xl tw-bg-blue-500/10 tw-opacity-50 tw-blur-2xl tw-transition-opacity tw-duration-700 desktop-hover:group-hover:tw-opacity-75" />

      <div className="tw-relative tw-flex tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#0E1420] tw-shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] md:tw-flex-row">
        <div className="tw-relative tw-flex tw-overflow-hidden tw-p-4 md:tw-w-[45%] lg:tw-p-6">
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-blue-600/15 tw-via-purple-500/5 tw-to-transparent" />
          <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-top-0 tw-h-px tw-w-full tw-bg-gradient-to-r tw-from-transparent tw-via-blue-400/40 tw-to-transparent" />

          <div className="tw-relative tw-z-10 tw-flex tw-w-full tw-flex-col tw-justify-center">
            <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between">
              <div className="tw-relative tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-blue-400/25 tw-bg-blue-500/20 tw-shadow-[0_0_22px_rgba(59,130,246,0.24)]">
                <CheckCircleIcon className="tw-size-5 tw-text-cyan-200 tw-drop-shadow-[0_0_10px_rgba(34,211,238,0.65)]" />
              </div>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss guidance"
                className="tw-flex tw-size-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.05] tw-text-iron-400 tw-transition-colors hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/[0.1] md:tw-hidden md:tw-size-8"
              >
                <XMarkIcon className="tw-size-4 tw-flex-shrink-0" />
              </button>
            </div>

            <h3 className="tw-mb-1.5 tw-text-lg tw-font-bold tw-leading-6 tw-tracking-tight tw-text-white md:tw-text-2xl">
              Getting started
            </h3>
            <p className="tw-mb-3 tw-max-w-[22rem] tw-text-xxs tw-font-medium tw-leading-5 tw-text-iron-400">
              Add an About statement to complete your profile, or dive right
              into the network.
            </p>

            <IdentityGettingStartedPrimaryAction href={mainStageHref} />
          </div>
        </div>

        <div className="tw-relative tw-flex tw-flex-col tw-justify-center tw-bg-[#0A0F18] tw-p-3 md:tw-w-[55%] lg:tw-p-6">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss guidance"
            className="tw-group/close tw-absolute tw-right-3.5 tw-top-3.5 tw-z-20 tw-hidden tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.05] tw-bg-white/[0.03] tw-px-3 tw-py-1.5 tw-text-iron-400 tw-transition-all tw-duration-200 hover:tw-bg-white/[0.08] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 active:tw-scale-[0.97] md:tw-flex"
          >
            <span className="tw-text-xs tw-font-semibold tw-leading-4 tw-transition-colors">
              Dismiss
            </span>
            <XMarkIcon className="tw-size-3.5 tw-transition-colors" />
          </button>

          <div className="tw-pt-2">
            <p className="tw-mb-3 tw-ml-1 tw-hidden tw-pr-24 tw-text-[0.625rem] tw-font-bold tw-uppercase tw-leading-4 tw-tracking-widest tw-text-iron-500 md:tw-block">
              More to explore
            </p>

            <div className="tw-flex tw-flex-col tw-gap-1">
              {secondaryActions.map((action) => (
                <IdentityGettingStartedSecondaryAction
                  key={action.title}
                  action={action}
                />
              ))}
            </div>
          </div>
        </div>
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
  const profileHandle = getProfileHandle(profile);
  const [isDismissed, setIsDismissed] = useState(false);
  const isOwnDirectProfile =
    !!profileHandle &&
    !activeProfileProxy &&
    amIUser({
      profile,
      address,
      connectedHandle: connectedProfile?.handle ?? undefined,
    });
  const hasCreationSession = hasIdentityGettingStartedSession(profileHandle);

  const isVisible = !isDismissed && hasCreationSession;

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
