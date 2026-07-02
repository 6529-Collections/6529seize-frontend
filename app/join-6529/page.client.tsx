"use client";

import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";

type Join6529MessageKey = Extract<MessageKey, `join6529.${string}`>;
type MessageParams = Record<string, string | number>;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type StepStatus = "complete" | "current" | "pending";

interface JourneyStep {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly icon: IconComponent;
  readonly complete: boolean;
}

interface ActionTile {
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly icon: IconComponent;
}

interface CurrentPanelAction {
  readonly kind: "button" | "link";
  readonly label: string;
  readonly href?: string;
  readonly busy?: boolean;
  readonly busyLabel?: string;
  readonly onClick?: () => void;
  readonly onNavigate?: () => void;
}

interface CurrentPanelContent {
  readonly title: string;
  readonly body: string;
  readonly action?: CurrentPanelAction;
}

const CREATE_WAVE_HREF = "/waves?create=wave";
const WAVES_HREF = "/waves";
const WAVES_ENTRY_STORAGE_PREFIX = "join-6529:entered-waves:";

const m = (
  locale: SupportedLocale,
  key: Join6529MessageKey,
  params: MessageParams = {}
) => t(locale, key, params);

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const getProfileRouteIdentity = (
  profile: ApiIdentity | null,
  address: string | undefined
): string | null =>
  profile?.normalised_handle ??
  profile?.handle ??
  profile?.primary_wallet?.toLowerCase() ??
  address?.toLowerCase() ??
  null;

const getProfileHref = (
  profile: ApiIdentity | null,
  address: string | undefined
): string => {
  const routeIdentity = getProfileRouteIdentity(profile, address);
  return routeIdentity ? `/${routeIdentity}` : "/";
};

const getProfileLabel = (
  profile: ApiIdentity | null,
  address: string | undefined,
  locale: SupportedLocale
): string => {
  if (profile?.handle) {
    return `@${profile.handle}`;
  }
  if (profile?.display) {
    return profile.display;
  }
  if (address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return m(locale, "join6529.status.missing");
};

const normalizeIdentityValue = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? null;

const isDropByConnectedProfile = (
  drop: ApiDrop,
  profile: ApiIdentity | null
): boolean => {
  if (!profile) {
    return false;
  }

  const expectedValues = new Set(
    [
      profile.id,
      profile.handle,
      profile.normalised_handle,
      profile.primary_wallet,
    ]
      .map(normalizeIdentityValue)
      .filter((value): value is string => Boolean(value))
  );

  return (
    expectedValues.has(normalizeIdentityValue(drop.author.id) ?? "") ||
    expectedValues.has(normalizeIdentityValue(drop.author.handle) ?? "") ||
    expectedValues.has(
      normalizeIdentityValue(drop.author.primary_address) ?? ""
    )
  );
};

const isPublicWaveDropByProfile = (
  drop: ApiDrop,
  profile: ApiIdentity | null
): boolean => {
  const wave = drop.wave;
  return (
    !wave.visibility_group_id &&
    !wave.chat_group_id &&
    !wave.identity_wave &&
    isDropByConnectedProfile(drop, profile)
  );
};

const hasPositiveNumber = (value: number | null | undefined) =>
  typeof value === "number" && value > 0;

const hasItems = (items: readonly unknown[] | null | undefined) =>
  Boolean(items?.length);

const hasEstablishedProfileActivity = (
  profile: ApiIdentity | null
): boolean => {
  if (!profile) {
    return false;
  }

  return (
    profile.is_wave_creator ||
    Boolean(profile.profile_wave_id) ||
    hasPositiveNumber(profile.level) ||
    hasPositiveNumber(profile.cic) ||
    hasPositiveNumber(profile.rep) ||
    hasPositiveNumber(profile.tdh) ||
    hasPositiveNumber(profile.xtdh) ||
    hasItems(profile.active_main_stage_submission_ids) ||
    hasItems(profile.winner_main_stage_drop_ids) ||
    hasItems(profile.artist_of_prevote_cards)
  );
};

export default function Join6529PageClient() {
  const locale = useBrowserLocale();
  useSetTitle(m(locale, "join6529.metadata.title"));

  const {
    actionTiles,
    address,
    checkingPublicMessage,
    completedSteps,
    connectedProfile,
    currentPanel,
    currentStepId,
    didPublicMessageCheckFail,
    formattedCompletedSteps,
    formattedRemainingSteps,
    formattedTotalSteps,
    hasActiveWalletAddress,
    hasEstablishedActivity,
    hasFirstPublicMessage,
    hasProfile,
    hasProfileImage,
    progressDetailKey,
    steps,
    totalSteps,
  } = useJoin6529Journey(locale);

  return (
    <main className="tailwind-scope tw-min-h-screen tw-bg-black tw-text-white">
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[1180px] tw-flex-col tw-gap-8 tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-px-8 lg:tw-py-10">
        <JoinHeader
          completedSteps={completedSteps}
          formattedCompletedSteps={formattedCompletedSteps}
          formattedRemainingSteps={formattedRemainingSteps}
          formattedTotalSteps={formattedTotalSteps}
          locale={locale}
          progressDetailKey={progressDetailKey}
          totalSteps={totalSteps}
        />

        <div className="tw-grid tw-gap-6 xl:tw-grid-cols-[minmax(0,1fr)_380px]">
          <JourneyStepsList
            currentStepId={currentStepId}
            locale={locale}
            steps={steps}
          />
          <JoinStateAside
            address={address}
            checkingPublicMessage={checkingPublicMessage}
            connectedProfile={connectedProfile}
            currentPanel={currentPanel}
            didPublicMessageCheckFail={didPublicMessageCheckFail}
            hasActiveWalletAddress={hasActiveWalletAddress}
            hasEstablishedActivity={hasEstablishedActivity}
            hasFirstPublicMessage={hasFirstPublicMessage}
            hasProfile={hasProfile}
            hasProfileImage={hasProfileImage}
            locale={locale}
          />
        </div>

        <ActionTilesSection actionTiles={actionTiles} locale={locale} />
      </div>
    </main>
  );
}

function useJoin6529Journey(locale: SupportedLocale) {
  const { connectedProfile, fetchingProfile, requestAuth } = useAuth();
  const {
    address,
    hasActiveWalletAddress,
    hasValidWalletAuth,
    seizeConnectFresh,
  } = useSeizeConnectContext();
  const [walletActionPending, setWalletActionPending] = useState(false);
  const [authActionPending, setAuthActionPending] = useState(false);
  const [hasEnteredWavesFromGuide, setHasEnteredWavesFromGuide] =
    useState(false);

  const profileRouteIdentity = getProfileRouteIdentity(
    connectedProfile,
    address
  );
  const profileHref = getProfileHref(connectedProfile, address);
  const subscriptionsHref = profileRouteIdentity
    ? `/${profileRouteIdentity}/subscriptions`
    : "/open-data/meme-subscriptions";
  const profileQueryIdentity =
    connectedProfile?.handle ??
    connectedProfile?.normalised_handle ??
    connectedProfile?.primary_wallet ??
    null;
  const profileStorageKey =
    connectedProfile?.id ??
    connectedProfile?.normalised_handle ??
    connectedProfile?.handle ??
    connectedProfile?.primary_wallet?.toLowerCase() ??
    address?.toLowerCase() ??
    null;
  const wavesEntryStorageKey = profileStorageKey
    ? `${WAVES_ENTRY_STORAGE_PREFIX}${profileStorageKey}`
    : null;
  const hasProfile = Boolean(connectedProfile);
  const hasProfileImage = Boolean(connectedProfile?.pfp);
  const hasEstablishedActivity =
    hasEstablishedProfileActivity(connectedProfile);

  const {
    data: recentProfileDrops,
    isError: didRecentPublicMessageCheckFail,
    isFetching: checkingRecentPublicMessage,
  } = useQuery({
    queryKey: [
      QueryKey.PROFILE_DROPS,
      "join-6529-first-public-message",
      profileQueryIdentity,
    ],
    enabled: Boolean(profileQueryIdentity) && !hasEstablishedActivity,
    staleTime: 60_000,
    queryFn: async () => {
      if (!profileQueryIdentity) {
        return [];
      }
      const params: Record<string, string> = {
        limit: "10",
        author: profileQueryIdentity,
        include_replies: "true",
        context_profile: profileQueryIdentity,
      };
      return await commonApiFetch<ApiDrop[]>({
        endpoint: "/drops",
        params,
      });
    },
  });

  const hasRecentPublicMessage = Boolean(
    recentProfileDrops?.some((drop) =>
      isPublicWaveDropByProfile(drop, connectedProfile)
    )
  );
  const hasFirstPublicMessage =
    hasEstablishedActivity || hasRecentPublicMessage;
  const hasEnteredWaves = hasFirstPublicMessage || hasEnteredWavesFromGuide;
  const checkingPublicMessage =
    !hasFirstPublicMessage && checkingRecentPublicMessage;
  const didPublicMessageCheckFail =
    !hasFirstPublicMessage && didRecentPublicMessageCheckFail;

  useEffect(() => {
    setHasEnteredWavesFromGuide(
      wavesEntryStorageKey
        ? safeLocalStorage.getItem(wavesEntryStorageKey) === "1"
        : false
    );
  }, [wavesEntryStorageKey]);

  const handleConnectWallet = useCallback(async () => {
    setWalletActionPending(true);
    try {
      await seizeConnectFresh();
    } finally {
      setWalletActionPending(false);
    }
  }, [seizeConnectFresh]);

  const handleRequestAuth = useCallback(async () => {
    setAuthActionPending(true);
    try {
      await requestAuth();
    } finally {
      setAuthActionPending(false);
    }
  }, [requestAuth]);

  const markWavesEntered = useCallback(() => {
    if (wavesEntryStorageKey) {
      safeLocalStorage.setItem(wavesEntryStorageKey, "1");
    }
    setHasEnteredWavesFromGuide(true);
  }, [wavesEntryStorageKey]);

  const steps = useMemo<JourneyStep[]>(
    () => [
      {
        id: "wallet",
        title: m(locale, "join6529.steps.wallet.title"),
        body: m(locale, "join6529.steps.wallet.body"),
        icon: WalletIcon,
        complete: hasActiveWalletAddress,
      },
      {
        id: "profile",
        title: m(locale, "join6529.steps.profile.title"),
        body: m(locale, "join6529.steps.profile.body"),
        icon: UserCircleIcon,
        complete: hasProfile,
      },
      {
        id: "waves",
        title: m(locale, "join6529.steps.waves.title"),
        body: m(locale, "join6529.steps.waves.body"),
        icon: ChatBubbleLeftRightIcon,
        complete: hasEnteredWaves,
      },
      {
        id: "message",
        title: m(locale, "join6529.steps.message.title"),
        body: m(locale, "join6529.steps.message.body"),
        icon: PaperAirplaneIcon,
        complete: hasFirstPublicMessage,
      },
      {
        id: "pfp",
        title: m(locale, "join6529.steps.pfp.title"),
        body: m(locale, "join6529.steps.pfp.body"),
        icon: PhotoIcon,
        complete: hasProfileImage,
      },
    ],
    [
      hasActiveWalletAddress,
      hasEnteredWaves,
      hasFirstPublicMessage,
      hasProfile,
      hasProfileImage,
      locale,
    ]
  );

  const currentStepId = useMemo(() => {
    if (!hasActiveWalletAddress) {
      return "wallet";
    }
    if (!hasValidWalletAuth || fetchingProfile || !hasProfile) {
      return "profile";
    }
    if (!hasEnteredWaves) {
      return "waves";
    }
    if (!hasFirstPublicMessage) {
      return "message";
    }
    if (!hasProfileImage) {
      return "pfp";
    }
    return "complete";
  }, [
    fetchingProfile,
    hasActiveWalletAddress,
    hasEnteredWaves,
    hasFirstPublicMessage,
    hasProfile,
    hasProfileImage,
    hasValidWalletAuth,
  ]);

  const completedSteps = steps.filter((step) => step.complete).length;
  const totalSteps = steps.length;
  const remainingSteps = totalSteps - completedSteps;
  const formattedCompletedSteps = formatInteger(locale, completedSteps);
  const formattedRemainingSteps = formatInteger(locale, remainingSteps);
  const formattedTotalSteps = formatInteger(locale, totalSteps);
  const progressDetailKey: Join6529MessageKey =
    remainingSteps === 1
      ? "join6529.progress.detail.one"
      : "join6529.progress.detail.many";

  const currentPanel = useMemo<CurrentPanelContent>(() => {
    if (!hasActiveWalletAddress) {
      return {
        title: m(locale, "join6529.current.wallet.title"),
        body: m(locale, "join6529.current.wallet.body"),
        action: {
          kind: "button",
          label: m(locale, "join6529.action.connect"),
          busyLabel: m(locale, "join6529.action.connecting"),
          busy: walletActionPending,
          onClick: handleConnectWallet,
        },
      };
    }

    if (!hasValidWalletAuth) {
      return {
        title: m(locale, "join6529.current.auth.title"),
        body: m(locale, "join6529.current.auth.body"),
        action: {
          kind: "button",
          label: m(locale, "join6529.action.sign"),
          busyLabel: m(locale, "join6529.action.signing"),
          busy: authActionPending,
          onClick: handleRequestAuth,
        },
      };
    }

    if (fetchingProfile) {
      return {
        title: m(locale, "join6529.current.profile.loadingTitle"),
        body: m(locale, "join6529.current.profile.loadingBody"),
      };
    }

    if (!hasProfile) {
      return {
        title: m(locale, "join6529.current.profile.title"),
        body: m(locale, "join6529.current.profile.body"),
        action: {
          kind: "link",
          label: m(locale, "join6529.action.createProfile"),
          href: profileHref,
        },
      };
    }

    if (!hasEnteredWaves) {
      return {
        title: m(locale, "join6529.current.waves.title"),
        body: m(locale, "join6529.current.waves.body"),
        action: {
          kind: "link",
          label: m(locale, "join6529.action.openWaves"),
          href: WAVES_HREF,
          onNavigate: markWavesEntered,
        },
      };
    }

    if (!hasFirstPublicMessage) {
      return {
        title: m(locale, "join6529.current.message.title"),
        body: m(locale, "join6529.current.message.body"),
        action: {
          kind: "link",
          label: m(locale, "join6529.action.openWaves"),
          href: WAVES_HREF,
          onNavigate: markWavesEntered,
        },
      };
    }

    if (!hasProfileImage) {
      return {
        title: m(locale, "join6529.current.pfp.title"),
        body: m(locale, "join6529.current.pfp.body"),
        action: {
          kind: "link",
          label: m(locale, "join6529.action.openProfile"),
          href: profileHref,
        },
      };
    }

    return {
      title: m(locale, "join6529.current.complete.title"),
      body: m(locale, "join6529.current.complete.body"),
      action: {
        kind: "link",
        label: m(locale, "join6529.action.createWave"),
        href: CREATE_WAVE_HREF,
      },
    };
  }, [
    authActionPending,
    fetchingProfile,
    handleConnectWallet,
    handleRequestAuth,
    hasActiveWalletAddress,
    hasEnteredWaves,
    hasFirstPublicMessage,
    hasProfile,
    hasProfileImage,
    hasValidWalletAuth,
    locale,
    markWavesEntered,
    profileHref,
    walletActionPending,
  ]);

  const actionTiles = useMemo<ActionTile[]>(
    () => [
      {
        title: m(locale, "join6529.things.explore.title"),
        body: m(locale, "join6529.things.explore.body"),
        href: WAVES_HREF,
        icon: ChatBubbleLeftRightIcon,
      },
      {
        title: m(locale, "join6529.things.help.title"),
        body: m(locale, "join6529.things.help.body"),
        href: WAVES_HREF,
        icon: QuestionMarkCircleIcon,
      },
      {
        title: m(locale, "join6529.things.subscriptions.title"),
        body: m(locale, "join6529.things.subscriptions.body"),
        href: subscriptionsHref,
        icon: BookOpenIcon,
      },
      {
        title: m(locale, "join6529.things.memes.title"),
        body: m(locale, "join6529.things.memes.body"),
        href: WAVES_HREF,
        icon: SparklesIcon,
      },
      {
        title: m(locale, "join6529.things.delegation.title"),
        body: m(locale, "join6529.things.delegation.body"),
        href: "/delegation/delegation-center",
        icon: LightBulbIcon,
      },
      {
        title: m(locale, "join6529.things.createWave.title"),
        body: m(locale, "join6529.things.createWave.body"),
        href: CREATE_WAVE_HREF,
        icon: PlusCircleIcon,
      },
    ],
    [locale, subscriptionsHref]
  );

  return {
    actionTiles,
    address,
    checkingPublicMessage,
    completedSteps,
    connectedProfile,
    currentPanel,
    currentStepId,
    didPublicMessageCheckFail,
    formattedCompletedSteps,
    formattedRemainingSteps,
    formattedTotalSteps,
    hasActiveWalletAddress,
    hasEstablishedActivity,
    hasFirstPublicMessage,
    hasProfile,
    hasProfileImage,
    progressDetailKey,
    steps,
    totalSteps,
  };
}

function JoinHeader({
  completedSteps,
  formattedCompletedSteps,
  formattedRemainingSteps,
  formattedTotalSteps,
  locale,
  progressDetailKey,
  totalSteps,
}: {
  readonly completedSteps: number;
  readonly formattedCompletedSteps: string;
  readonly formattedRemainingSteps: string;
  readonly formattedTotalSteps: string;
  readonly locale: SupportedLocale;
  readonly progressDetailKey: Join6529MessageKey;
  readonly totalSteps: number;
}) {
  return (
    <header className="tw-grid tw-gap-6 lg:tw-grid-cols-[minmax(0,1fr)_360px] lg:tw-items-end">
      <div className="tw-space-y-4">
        <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-emerald-300">
          {m(locale, "join6529.eyebrow")}
        </p>
        <div className="tw-space-y-3">
          <h1 className="tw-text-4xl tw-font-semibold tw-leading-tight tw-text-white sm:tw-text-5xl">
            {m(locale, "join6529.title")}
          </h1>
          <p className="tw-max-w-3xl tw-text-base tw-leading-7 tw-text-slate-300 sm:tw-text-lg">
            {m(locale, "join6529.subtitle")}
          </p>
        </div>
      </div>

      <section
        className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-p-5 tw-shadow-2xl tw-shadow-black/20"
        aria-label={m(locale, "join6529.progress.ariaLabel")}
      >
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
          <div>
            <p className="tw-text-sm tw-font-medium tw-text-slate-400">
              {m(locale, "join6529.progress.ariaLabel")}
            </p>
            <p className="tw-mt-1 tw-text-3xl tw-font-semibold tw-text-white">
              {m(locale, "join6529.progress.value", {
                completed: formattedCompletedSteps,
                total: formattedTotalSteps,
              })}
            </p>
          </div>
          <span className="tw-rounded-full tw-border tw-border-sky-300/25 tw-bg-sky-300/10 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-sky-200">
            {m(locale, progressDetailKey, {
              remaining: formattedRemainingSteps,
            })}
          </span>
        </div>
        <progress
          aria-label={m(locale, "join6529.progress.ariaLabel")}
          aria-valuetext={m(locale, "join6529.progress.ariaValue", {
            completed: formattedCompletedSteps,
            total: formattedTotalSteps,
          })}
          className="tw-mt-5 tw-block tw-h-2 tw-w-full tw-appearance-none tw-overflow-hidden tw-rounded-full tw-bg-white/10 [&::-moz-progress-bar]:tw-rounded-full [&::-moz-progress-bar]:tw-bg-emerald-400 [&::-webkit-progress-bar]:tw-rounded-full [&::-webkit-progress-bar]:tw-bg-white/10 [&::-webkit-progress-value]:tw-rounded-full [&::-webkit-progress-value]:tw-bg-emerald-400"
          max={totalSteps}
          value={completedSteps}
        />
      </section>
    </header>
  );
}

function JourneyStepsList({
  currentStepId,
  locale,
  steps,
}: {
  readonly currentStepId: string;
  readonly locale: SupportedLocale;
  readonly steps: JourneyStep[];
}) {
  return (
    <section className="tw-min-w-0">
      <ol
        aria-label={m(locale, "join6529.steps.ariaLabel")}
        className="tw-grid tw-gap-3"
      >
        {steps.map((step, index) => (
          <JourneyStepRow
            key={step.id}
            index={index}
            locale={locale}
            status={getStepStatus(step, currentStepId)}
            step={step}
          />
        ))}
      </ol>
    </section>
  );
}

function JoinStateAside({
  address,
  checkingPublicMessage,
  connectedProfile,
  currentPanel,
  didPublicMessageCheckFail,
  hasActiveWalletAddress,
  hasEstablishedActivity,
  hasFirstPublicMessage,
  hasProfile,
  hasProfileImage,
  locale,
}: {
  readonly address: string | undefined;
  readonly checkingPublicMessage: boolean;
  readonly connectedProfile: ApiIdentity | null;
  readonly currentPanel: CurrentPanelContent;
  readonly didPublicMessageCheckFail: boolean;
  readonly hasActiveWalletAddress: boolean;
  readonly hasEstablishedActivity: boolean;
  readonly hasFirstPublicMessage: boolean;
  readonly hasProfile: boolean;
  readonly hasProfileImage: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <aside className="tw-flex tw-flex-col tw-gap-4">
      <CurrentStepPanel currentPanel={currentPanel} locale={locale} />
      <JourneyStatePanel
        address={address}
        checkingPublicMessage={checkingPublicMessage}
        connectedProfile={connectedProfile}
        didPublicMessageCheckFail={didPublicMessageCheckFail}
        hasActiveWalletAddress={hasActiveWalletAddress}
        hasEstablishedActivity={hasEstablishedActivity}
        hasFirstPublicMessage={hasFirstPublicMessage}
        hasProfile={hasProfile}
        hasProfileImage={hasProfileImage}
        locale={locale}
      />
    </aside>
  );
}

function CurrentStepPanel({
  currentPanel,
  locale,
}: {
  readonly currentPanel: CurrentPanelContent;
  readonly locale: SupportedLocale;
}) {
  return (
    <section className="tw-rounded-lg tw-border tw-border-emerald-300/20 tw-bg-emerald-300/[0.07] tw-p-5">
      <p className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-emerald-200">
        {m(locale, "join6529.current.label")}
      </p>
      <h2 className="tw-mt-3 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-white">
        {currentPanel.title}
      </h2>
      <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-emerald-50/80">
        {currentPanel.body}
      </p>
      {currentPanel.action && (
        <div className="tw-mt-5">
          <CurrentAction action={currentPanel.action} />
        </div>
      )}
    </section>
  );
}

function JourneyStatePanel({
  address,
  checkingPublicMessage,
  connectedProfile,
  didPublicMessageCheckFail,
  hasActiveWalletAddress,
  hasEstablishedActivity,
  hasFirstPublicMessage,
  hasProfile,
  hasProfileImage,
  locale,
}: {
  readonly address: string | undefined;
  readonly checkingPublicMessage: boolean;
  readonly connectedProfile: ApiIdentity | null;
  readonly didPublicMessageCheckFail: boolean;
  readonly hasActiveWalletAddress: boolean;
  readonly hasEstablishedActivity: boolean;
  readonly hasFirstPublicMessage: boolean;
  readonly hasProfile: boolean;
  readonly hasProfileImage: boolean;
  readonly locale: SupportedLocale;
}) {
  return (
    <section className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.03] tw-p-5">
      <h2 className="tw-text-sm tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-slate-300">
        {m(locale, "join6529.status.heading")}
      </h2>
      <div className="tw-mt-4 tw-divide-y tw-divide-white/10">
        <StateRow
          label={m(locale, "join6529.status.wallet")}
          value={
            hasActiveWalletAddress
              ? getProfileLabel(null, address, locale)
              : m(locale, "join6529.status.notConnected")
          }
          good={hasActiveWalletAddress}
        />
        <StateRow
          label={m(locale, "join6529.status.profile")}
          value={
            hasProfile
              ? getProfileLabel(connectedProfile, address, locale)
              : m(locale, "join6529.status.missing")
          }
          good={hasProfile}
        />
        <StateRow
          label={m(locale, "join6529.status.pfp")}
          value={
            hasProfileImage
              ? m(locale, "join6529.status.ready")
              : m(locale, "join6529.status.missing")
          }
          good={hasProfileImage}
        />
        <StateRow
          ariaLive
          label={m(locale, "join6529.status.message")}
          value={getPublicMessageStatus({
            checkingPublicMessage,
            hasEstablishedActivity,
            hasFirstPublicMessage,
            locale,
          })}
          good={hasFirstPublicMessage}
        />
      </div>
      {didPublicMessageCheckFail && (
        <p
          aria-live="polite"
          className="tw-mt-4 tw-text-xs tw-leading-5 tw-text-amber-200"
        >
          {m(locale, "join6529.status.checkFailed")}
        </p>
      )}
    </section>
  );
}

function ActionTilesSection({
  actionTiles,
  locale,
}: {
  readonly actionTiles: ActionTile[];
  readonly locale: SupportedLocale;
}) {
  return (
    <section className="tw-space-y-4">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <h2 className="tw-text-2xl tw-font-semibold tw-text-white">
            {m(locale, "join6529.things.heading")}
          </h2>
          <p className="tw-mt-2 tw-max-w-2xl tw-text-sm tw-leading-6 tw-text-slate-400">
            {m(locale, "join6529.things.subheading")}
          </p>
        </div>
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
        {actionTiles.map((tile) => (
          <ActionTileCard key={tile.title} tile={tile} />
        ))}
      </div>
    </section>
  );
}

function getStepStatus(step: JourneyStep, currentStepId: string): StepStatus {
  if (step.complete) {
    return "complete";
  }
  if (step.id === currentStepId) {
    return "current";
  }
  return "pending";
}

function JourneyStepRow({
  index,
  locale,
  status,
  step,
}: {
  readonly index: number;
  readonly locale: SupportedLocale;
  readonly status: StepStatus;
  readonly step: JourneyStep;
}) {
  const Icon = step.complete ? CheckCircleIcon : step.icon;
  const statusLabels: Record<StepStatus, string> = {
    complete: m(locale, "join6529.progress.done"),
    current: m(locale, "join6529.progress.current"),
    pending: m(locale, "join6529.progress.pending"),
  };
  const statusLabel = statusLabels[status];

  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      className={cx(
        "tw-grid tw-grid-cols-[44px_minmax(0,1fr)] tw-gap-4 tw-rounded-lg tw-border tw-p-4 tw-transition",
        status === "complete" &&
          "tw-border-emerald-300/25 tw-bg-emerald-300/[0.06]",
        status === "current" && "tw-border-sky-300/30 tw-bg-sky-300/[0.07]",
        status === "pending" && "tw-border-white/10 tw-bg-white/[0.03]"
      )}
    >
      <div
        className={cx(
          "tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-rounded-lg tw-border",
          status === "complete" &&
            "tw-border-emerald-300/30 tw-bg-emerald-300/10 tw-text-emerald-200",
          status === "current" &&
            "tw-border-sky-300/30 tw-bg-sky-300/10 tw-text-sky-200",
          status === "pending" &&
            "tw-border-white/10 tw-bg-black/30 tw-text-slate-400"
        )}
      >
        {step.complete ? (
          <Icon aria-hidden="true" className="tw-h-6 tw-w-6" />
        ) : (
          <>
            <Icon aria-hidden="true" className="tw-h-5 tw-w-5" />
            <span className="tw-sr-only">{index + 1}</span>
          </>
        )}
      </div>
      <div className="tw-min-w-0 tw-space-y-2">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <h3 className="tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
            {step.title}
          </h3>
          <span
            className={cx(
              "tw-rounded-full tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide",
              status === "complete" &&
                "tw-bg-emerald-300/10 tw-text-emerald-200",
              status === "current" && "tw-bg-sky-300/10 tw-text-sky-200",
              status === "pending" && "tw-bg-white/10 tw-text-slate-300"
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="tw-text-sm tw-leading-6 tw-text-slate-400">{step.body}</p>
      </div>
    </li>
  );
}

function CurrentAction({ action }: { readonly action: CurrentPanelAction }) {
  const label = action.busy ? (action.busyLabel ?? action.label) : action.label;
  const content = (
    <>
      <span>{label}</span>
      <ArrowRightIcon aria-hidden="true" className="tw-h-4 tw-w-4" />
    </>
  );
  const className =
    "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-black tw-no-underline tw-transition hover:tw-bg-slate-200 hover:tw-no-underline focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/70 focus:tw-no-underline disabled:tw-cursor-not-allowed disabled:tw-opacity-70";

  if (action.kind === "link" && action.href) {
    const linkProps = {
      ...(action.onClick ? { onClick: action.onClick } : {}),
      ...(action.onNavigate ? { onNavigate: action.onNavigate } : {}),
    };
    return (
      <Link className={className} href={action.href} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      disabled={action.busy}
      onClick={action.onClick}
      type="button"
    >
      {content}
    </button>
  );
}

function StateRow({
  ariaLive = false,
  good,
  label,
  value,
}: {
  readonly ariaLive?: boolean;
  readonly good: boolean;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-py-3 first:tw-pt-0 last:tw-pb-0">
      <span className="tw-text-sm tw-text-slate-400">{label}</span>
      <span
        aria-live={ariaLive ? "polite" : undefined}
        className={cx(
          "tw-min-w-0 tw-truncate tw-text-right tw-text-sm tw-font-semibold",
          good ? "tw-text-emerald-200" : "tw-text-slate-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ActionTileCard({ tile }: { readonly tile: ActionTile }) {
  const Icon = tile.icon;
  return (
    <Link
      className="tw-group tw-flex tw-min-h-[150px] tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-border-white/10 tw-bg-zinc-950 tw-p-4 tw-text-inherit tw-no-underline tw-transition hover:tw-border-sky-300/35 hover:tw-bg-sky-300/[0.06] hover:tw-text-inherit hover:tw-no-underline focus:tw-no-underline focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-300/60"
      href={tile.href}
    >
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-text-sky-200">
          <Icon aria-hidden="true" className="tw-h-5 tw-w-5" />
        </div>
        <ArrowRightIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-text-slate-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-sky-200"
        />
      </div>
      <div className="tw-mt-5 tw-space-y-2">
        <h3 className="tw-text-base tw-font-semibold tw-leading-6 tw-text-white">
          {tile.title}
        </h3>
        <p className="tw-text-sm tw-leading-6 tw-text-slate-400">{tile.body}</p>
      </div>
    </Link>
  );
}

function getPublicMessageStatus({
  checkingPublicMessage,
  hasEstablishedActivity,
  hasFirstPublicMessage,
  locale,
}: {
  readonly checkingPublicMessage: boolean;
  readonly hasEstablishedActivity: boolean;
  readonly hasFirstPublicMessage: boolean;
  readonly locale: SupportedLocale;
}) {
  if (hasFirstPublicMessage) {
    return m(
      locale,
      hasEstablishedActivity
        ? "join6529.progress.done"
        : "join6529.status.detected"
    );
  }
  if (checkingPublicMessage) {
    return m(locale, "join6529.status.checking");
  }
  return m(locale, "join6529.status.notDetected");
}
