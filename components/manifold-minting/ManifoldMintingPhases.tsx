"use client";

import type { Distribution } from "@/entities/IDistribution";
import { Time } from "@/helpers/time";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { formatInteger } from "@/i18n/format";
import { t, type MessageKey } from "@/i18n/messages";
import type { ManifoldClaim, MemePhase } from "@/hooks/useManifoldClaim";
import { PUBLIC_PRODUCTION_API_BASE } from "@/services/api/api-endpoints";
import {
  buildMemesPhases,
  getMemePhaseIdForRootPhase,
  ManifoldClaimStatus,
} from "@/hooks/useManifoldClaim";
import { useEffect, useState } from "react";
import { getDateTimeString } from "./ManifoldMinting.utils";

enum MemePhaseCardStatus {
  UPCOMING = "UPCOMING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

function getMemePhaseCardStatus(
  claim: ManifoldClaim,
  phase: MemePhase
): MemePhaseCardStatus {
  if (
    claim.memePhase?.id === phase.id &&
    claim.status === ManifoldClaimStatus.ACTIVE
  ) {
    return MemePhaseCardStatus.ACTIVE;
  }

  if (phase.end.lt(Time.now()) || claim.isDropComplete) {
    return MemePhaseCardStatus.COMPLETED;
  }

  return MemePhaseCardStatus.UPCOMING;
}

const ELIGIBLE_CLASS_NAME = "tw-font-semibold tw-text-success";
const MUTED_CLASS_NAME = "tw-text-iron-300";

interface PhaseSpots {
  readonly allowlist: number;
  readonly airdrop: number;
}

function getPhaseSpots(
  entry: Distribution["allowlist"][number] | undefined
): PhaseSpots | undefined {
  if (!entry) {
    return undefined;
  }
  const toCount = (value: unknown) => {
    const count = Number(value ?? 0);
    return Number.isFinite(count) && count > 0 ? count : 0;
  };
  // A subscription fills the subscriber's spot in this phase with an airdrop,
  // so only allowlist spots can be minted on this page.
  const allowlist = toCount(entry.spots_allowlist);
  const airdrop = toCount(entry.spots_airdrop);
  if (allowlist === 0 && airdrop === 0) {
    // Entries without the split keep their combined count as mint spots.
    return { allowlist: toCount(entry.spots), airdrop: 0 };
  }
  return { allowlist, airdrop };
}

function getEligibleMintsDetails(
  locale: SupportedLocale,
  phaseId: string,
  spots: PhaseSpots | undefined,
  status: MemePhaseCardStatus,
  eligibilityState: "loading" | "ready" | "unavailable"
): { text: string; className: string } {
  if (phaseId === "public") {
    const text = t(locale, "theMemes.mint.phaseEligibility.unlimited");
    if (status === MemePhaseCardStatus.ACTIVE) {
      return { text, className: ELIGIBLE_CLASS_NAME };
    }

    if (status === MemePhaseCardStatus.UPCOMING) {
      return { text, className: "tw-font-semibold tw-text-primary-300" };
    }

    return { text, className: "tw-font-semibold tw-text-red/75" };
  }

  if (eligibilityState === "loading") {
    return {
      text: t(locale, "theMemes.mint.phaseEligibility.loading"),
      className: MUTED_CLASS_NAME,
    };
  }

  if (eligibilityState === "unavailable") {
    return {
      text: t(locale, "theMemes.mint.phaseEligibility.unavailable"),
      className: MUTED_CLASS_NAME,
    };
  }

  const allowlist = spots?.allowlist ?? 0;
  const airdrop = spots?.airdrop ?? 0;
  const params = {
    allowlist: formatInteger(locale, allowlist),
    airdrop: formatInteger(locale, airdrop),
  };

  if (allowlist > 0 && airdrop > 0) {
    return {
      text: t(locale, "theMemes.mint.phaseEligibility.mixed", params),
      className: ELIGIBLE_CLASS_NAME,
    };
  }

  if (airdrop > 0) {
    return {
      text: t(locale, "theMemes.mint.phaseEligibility.airdrop", params),
      className: ELIGIBLE_CLASS_NAME,
    };
  }

  if (allowlist > 0) {
    return {
      text: t(
        locale,
        allowlist === 1
          ? "theMemes.mint.phaseEligibility.allowlist.one"
          : "theMemes.mint.phaseEligibility.allowlist.many",
        params
      ),
      className: ELIGIBLE_CLASS_NAME,
    };
  }

  return {
    text: t(locale, "theMemes.mint.phaseEligibility.none"),
    className: MUTED_CLASS_NAME,
  };
}

const PHASE_STATUS_LABEL_KEY = {
  [MemePhaseCardStatus.UPCOMING]: "theMemes.mint.phaseCard.status.upcoming",
  [MemePhaseCardStatus.ACTIVE]: "theMemes.mint.phaseCard.status.active",
  [MemePhaseCardStatus.COMPLETED]: "theMemes.mint.phaseCard.status.completed",
} as const satisfies Record<MemePhaseCardStatus, MessageKey>;

function getPhaseDateLabels(
  locale: SupportedLocale,
  status: MemePhaseCardStatus
): {
  start: string;
  end: string;
} {
  if (status === MemePhaseCardStatus.ACTIVE) {
    return {
      start: t(locale, "theMemes.mint.phaseCard.started"),
      end: t(locale, "theMemes.mint.phaseCard.ends"),
    };
  }

  if (status === MemePhaseCardStatus.COMPLETED) {
    return {
      start: t(locale, "theMemes.mint.phaseCard.started"),
      end: t(locale, "theMemes.mint.phaseCard.ended"),
    };
  }

  return {
    start: t(locale, "theMemes.mint.phaseCard.expectedStart"),
    end: t(locale, "theMemes.mint.phaseCard.expectedEnd"),
  };
}

function getPhaseStatusClassName(status: MemePhaseCardStatus): string {
  if (status === MemePhaseCardStatus.ACTIVE) {
    return "tw-text-success";
  }

  if (status === MemePhaseCardStatus.UPCOMING) {
    return "tw-text-primary-300";
  }

  return "tw-text-red/75";
}

function getHighlightedRingClassName(status: MemePhaseCardStatus): string {
  if (status === MemePhaseCardStatus.ACTIVE) {
    return "tw-border-success tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-success";
  }

  return "tw-border-primary-300 tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-primary-300";
}

export default function ManifoldMemesMintingPhases(
  props: Readonly<{
    address: string | null;
    contract: string;
    token_id: number;
    mint_date: Time;
    claim: ManifoldClaim;
    local_timezone: boolean;
  }>
) {
  const locale = useBrowserLocale();
  const [distribution, setDistribution] = useState<Distribution>();
  const [distributionState, setDistributionState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const phaseAnchorDate =
    props.claim.startDate > 0
      ? Time.seconds(props.claim.startDate)
      : props.mint_date;
  const phases = buildMemesPhases(phaseAnchorDate);

  useEffect(() => {
    if (!props.address) {
      setDistribution(undefined);
      setDistributionState("idle");
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 30_000);
    setDistribution(undefined);
    setDistributionState("loading");

    const loadDistribution = async () => {
      try {
        const address = props.address;
        if (!address) {
          return;
        }

        const query = new URLSearchParams({
          card_id: String(props.token_id),
          contract: props.contract,
          page: "1",
          search: address,
        });
        const response = await fetch(
          `${PUBLIC_PRODUCTION_API_BASE}/api/distributions?${query.toString()}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(
            `Distribution request failed with status ${response.status}`
          );
        }
        const data = await response.json();

        if (!isCancelled) {
          setDistribution(data.data[0]);
          setDistributionState("ready");
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to fetch mint distribution", error);
          setDistribution(undefined);
          setDistributionState("error");
        }
      } finally {
        globalThis.clearTimeout(timeoutId);
      }
    };

    void loadDistribution();

    return () => {
      isCancelled = true;
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [props.address, props.contract, props.token_id]);

  return (
    <div>
      {distribution?.airdrops !== undefined && distribution.airdrops > 0 && (
        <div className="tw-pb-2 tw-text-lg tw-font-bold tw-text-white">
          {t(locale, "theMemes.mint.phaseCard.airdrops", {
            count: formatInteger(locale, distribution.airdrops),
          })}
        </div>
      )}
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-12">
        {phases.map((phase) => (
          <ManifoldMemesMintingPhase
            key={`phase-${phase.id}`}
            claim={props.claim}
            address={props.address}
            phase={phase}
            distribution={distribution}
            distributionState={distributionState}
            local_timezone={props.local_timezone}
          />
        ))}
      </div>
    </div>
  );
}

function ManifoldMemesMintingPhase(
  props: Readonly<{
    claim: ManifoldClaim;
    address: string | null;
    phase: MemePhase;
    distribution: Distribution | undefined;
    distributionState: "idle" | "loading" | "ready" | "error";
    local_timezone: boolean;
  }>
) {
  const locale = useBrowserLocale();
  const eligibleMints = props.distribution?.allowlist.find(
    (entry) => getMemePhaseIdForRootPhase(entry.phase) === props.phase.id
  );
  const status = getMemePhaseCardStatus(props.claim, props.phase);
  const phaseDateLabels = getPhaseDateLabels(locale, status);
  let eligibilityState: "loading" | "ready" | "unavailable" = "loading";
  if (props.distributionState === "ready") {
    eligibilityState = "ready";
  } else if (props.distributionState === "error") {
    eligibilityState = "unavailable";
  }
  const eligibleMintsDetails = getEligibleMintsDetails(
    locale,
    props.phase.id,
    getPhaseSpots(eligibleMints),
    status,
    eligibilityState
  );

  let startDate = props.phase.start;
  let endDate = props.phase.end;
  if (status === MemePhaseCardStatus.ACTIVE) {
    startDate = Time.seconds(props.claim.startDate);
    endDate = Time.seconds(props.claim.endDate);
  }

  const startDisplay = getDateTimeString(startDate, props.local_timezone);
  const endDisplay = getDateTimeString(endDate, props.local_timezone);
  const isDropComplete = props.claim.isDropComplete;
  const hasActivePhase = props.claim.status === ManifoldClaimStatus.ACTIVE;
  const isUpcomingClaim = props.claim.status === ManifoldClaimStatus.UPCOMING;
  const hasFinalizedCurrentClaim =
    props.claim.isFinalized && !props.claim.isDropComplete;
  const isHighlighted =
    status === MemePhaseCardStatus.ACTIVE ||
    (status === MemePhaseCardStatus.UPCOMING &&
      !hasActivePhase &&
      ((isUpcomingClaim && props.claim.memePhase?.id === props.phase.id) ||
        (hasFinalizedCurrentClaim &&
          props.claim.nextMemePhase?.id === props.phase.id)) &&
      !isDropComplete);

  return (
    <div className="tw-pb-1 tw-pt-1 md:tw-col-span-3">
      <div
        className={`tw-h-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-p-5 tw-text-left ${
          isHighlighted
            ? getHighlightedRingClassName(status)
            : "tw-border-white/5 tw-bg-iron-900/40"
        }`}
      >
        <div className="tw-text-center tw-text-lg tw-font-bold tw-text-white">
          {props.phase.name}
        </div>
        <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            {t(locale, "theMemes.mint.phaseCard.statusLabel")}
          </span>
          <span
            className={`tw-text-right tw-font-semibold ${getPhaseStatusClassName(
              status
            )}`}
          >
            {t(locale, PHASE_STATUS_LABEL_KEY[status])}
          </span>
        </div>
        <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            {phaseDateLabels.start}
          </span>
          <span className="tw-text-right tw-text-sm tw-text-iron-100">
            {startDisplay}
          </span>
        </div>
        <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            {phaseDateLabels.end}
          </span>
          <span className="tw-text-right tw-text-sm tw-text-iron-100">
            {endDisplay}
          </span>
        </div>
        {props.address && (
          <div
            className={`tw-pt-4 tw-text-center ${eligibleMintsDetails.className}`}
          >
            {eligibleMintsDetails.text}
          </div>
        )}
      </div>
    </div>
  );
}
