"use client";

import type { Distribution } from "@/entities/IDistribution";
import { Time } from "@/helpers/time";
import type { ManifoldClaim, MemePhase } from "@/hooks/useManifoldClaim";
import {
  buildMemesPhases,
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

function getEligibleMintsDetails(
  phaseId: string,
  eligibleSpots: number | undefined,
  status: MemePhaseCardStatus,
  eligibilityState: "loading" | "ready" | "unavailable"
): { text: string; className: string } {
  if (phaseId === "public") {
    if (status === MemePhaseCardStatus.ACTIVE) {
      return {
        text: "Unlimited spots",
        className: "tw-font-semibold tw-text-success",
      };
    }

    if (status === MemePhaseCardStatus.UPCOMING) {
      return {
        text: "Unlimited spots",
        className: "tw-font-semibold tw-text-primary-300",
      };
    }

    return {
      text: "Unlimited spots",
      className: "tw-font-semibold tw-text-red/75",
    };
  }

  if (eligibilityState === "loading") {
    return {
      text: "Loading eligibility...",
      className: "tw-text-iron-300",
    };
  }

  if (eligibilityState === "unavailable") {
    return {
      text: "Eligibility unavailable",
      className: "tw-text-iron-300",
    };
  }

  if (eligibleSpots === undefined) {
    return {
      text: "No eligible spots",
      className: "tw-text-iron-300",
    };
  }

  if (eligibleSpots === 0) {
    return {
      text: "No eligible spots",
      className: "tw-text-iron-300",
    };
  }

  return {
    text: `${eligibleSpots} eligible spot${eligibleSpots > 1 ? "s" : ""}`,
    className: "tw-font-semibold tw-text-success",
  };
}

function getPhaseDateLabels(status: MemePhaseCardStatus): {
  start: string;
  end: string;
} {
  if (status === MemePhaseCardStatus.ACTIVE) {
    return { start: "Started", end: "Ends" };
  }

  if (status === MemePhaseCardStatus.COMPLETED) {
    return { start: "Started", end: "Ended" };
  }

  return {
    start: "Expected start",
    end: "Expected end",
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
          `https://api.6529.io/api/distributions?${query.toString()}`
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
        console.error("Failed to fetch mint distribution", error);
        if (!isCancelled) {
          setDistribution(undefined);
          setDistributionState("error");
        }
      }
    };

    void loadDistribution();

    return () => {
      isCancelled = true;
    };
  }, [props.address, props.contract, props.token_id]);

  return (
    <div>
      {distribution?.airdrops !== undefined && distribution.airdrops > 0 && (
        <div className="tw-pb-2 tw-text-lg tw-font-bold tw-text-white">
          Airdrops: x{distribution.airdrops}
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
  const eligibleMints = props.distribution?.allowlist.find((phase) =>
    phase.phase.includes(props.phase.id)
  );
  const status = getMemePhaseCardStatus(props.claim, props.phase);
  const phaseDateLabels = getPhaseDateLabels(status);
  let eligibilityState: "loading" | "ready" | "unavailable" = "loading";
  if (props.distributionState === "ready") {
    eligibilityState = "ready";
  } else if (props.distributionState === "error") {
    eligibilityState = "unavailable";
  }
  const eligibleMintsDetails = getEligibleMintsDetails(
    props.phase.id,
    eligibleMints?.spots,
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
            Status
          </span>
          <span
            className={`tw-text-right tw-font-semibold ${getPhaseStatusClassName(
              status
            )}`}
          >
            {status}
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
