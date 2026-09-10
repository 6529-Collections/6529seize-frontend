"use client";

import React, { useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { formatList, formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

interface WavePodiumItemContentOutcomesProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly outcomesVisible?: boolean | undefined;
}

const subscribeToClientRender = () => () => undefined;
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

export const WavePodiumItemContentOutcomes: React.FC<
  WavePodiumItemContentOutcomesProps
> = ({ winner, outcomesVisible = true }) => {
  const locale = useBrowserLocale();
  const isTouchDevice = useIsTouchDevice();
  const canRenderTooltip = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );

  // Transform awards into the same format that useDropOutcomes provided
  const { nicOutcomes, repOutcomes, manualOutcomes, haveOutcomes } =
    useMemo(() => {
      if (!outcomesVisible) {
        return {
          nicOutcomes: [],
          repOutcomes: [],
          manualOutcomes: [],
          haveOutcomes: false,
        };
      }

      const memoizedNicOutcomes = winner.awards
        .filter((award) => {
          const amount = award.amount ?? 0;
          return award.credit === ApiWaveOutcomeCredit.Cic && amount > 0;
        })
        .map((award) => ({
          type: ApiWaveOutcomeCredit.Cic,
          value: award.amount ?? 0,
        }));

      const memoizedRepOutcomes = winner.awards
        .filter((award) => {
          const amount = award.amount ?? 0;
          return award.credit === ApiWaveOutcomeCredit.Rep && amount > 0;
        })
        .map((award) => ({
          type: ApiWaveOutcomeCredit.Rep,
          value: award.amount ?? 0,
          category: award.rep_category ?? "",
        }));

      const memoizedManualOutcomes = winner.awards
        .filter((award) => {
          const description = award.description;
          return (
            award.type === ApiWaveOutcomeType.Manual &&
            typeof description === "string" &&
            description.length > 0
          );
        })
        .map((award) => ({
          type: ApiWaveOutcomeType.Manual,
          description: award.description ?? "",
        }));

      const memoizedHaveOutcomes =
        memoizedNicOutcomes.length > 0 ||
        memoizedRepOutcomes.length > 0 ||
        memoizedManualOutcomes.length > 0;

      return {
        nicOutcomes: memoizedNicOutcomes,
        repOutcomes: memoizedRepOutcomes,
        manualOutcomes: memoizedManualOutcomes,
        haveOutcomes: memoizedHaveOutcomes,
      };
    }, [outcomesVisible, winner.awards]);

  if (!outcomesVisible) {
    return null;
  }

  if (!haveOutcomes) {
    return null;
  }

  const tooltipId = `outcome-${winner.place}-${winner.drop.id}`;
  const outcomeDescriptionId = `${tooltipId}-description`;
  const outcomeDescription = formatList(locale, [
    ...nicOutcomes.map(
      (outcome) => `NIC ${formatNumber(locale, outcome.value)}`
    ),
    ...repOutcomes.map(
      (outcome) =>
        `Rep ${formatNumber(locale, outcome.value)}${
          outcome.category ? ` · ${outcome.category}` : ""
        }`
    ),
    ...manualOutcomes.map((outcome) => outcome.description),
  ]);

  const tooltipContent = (
    <div className="tw-flex tw-min-w-0 tw-max-w-full tw-flex-col tw-gap-y-1.5 tw-py-0.5 [overflow-wrap:anywhere]">
      {nicOutcomes.map((nicOutcome) => (
        <div
          key={`NIC-${nicOutcome.value}`}
          className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5"
        >
          <span className="tw-font-medium tw-text-iron-50">NIC</span>
          <span className="tw-text-blue-200/90">
            {formatNumber(locale, nicOutcome.value)}
          </span>
        </div>
      ))}
      {repOutcomes.map((repOutcome) => (
        <div
          key={`REP-${repOutcome.category}-${repOutcome.value}`}
          className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-0.5"
        >
          <span className="tw-font-medium tw-text-iron-50">Rep</span>
          <span className="tw-text-purple-200/90">
            {formatNumber(locale, repOutcome.value)}
          </span>
          {repOutcome.category.length > 0 && (
            <>
              <span className="tw-size-[2px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-300/70" />
              <span className="tw-text-purple-200/90">
                {repOutcome.category}
              </span>
            </>
          )}
        </div>
      ))}
      {manualOutcomes.map((outcome) => (
        <div
          key={`MANUAL-${outcome.description}`}
          className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-1.5"
        >
          <span className="tw-text-amber-100/90">{outcome.description}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="tw-flex tw-min-h-7 tw-max-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700/50 tw-bg-iron-800/40 tw-px-1 tw-py-0.5 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/60 min-[360px]:tw-px-1.5 sm:tw-min-h-8 sm:tw-px-2 sm:tw-py-1"
        data-tooltip-id={tooltipId}
        aria-describedby={outcomeDescriptionId}
      >
        <span className="tw-text-[10px] tw-font-semibold tw-text-iron-300 min-[360px]:tw-text-[11px] sm:tw-text-xs">
          {t(locale, "waves.leaderboard.podium.outcome")}
        </span>
      </button>
      <span id={outcomeDescriptionId} className="tw-sr-only">
        {outcomeDescription}
      </span>
      {canRenderTooltip &&
        createPortal(
          <Tooltip
            id={tooltipId}
            place="top"
            offset={8}
            opacity={1}
            clickable
            openEvents={
              isTouchDevice
                ? { click: true }
                : { mouseenter: true, focus: true }
            }
            closeEvents={
              isTouchDevice ? { click: true } : { mouseleave: true, blur: true }
            }
            globalCloseEvents={{
              escape: true,
              scroll: true,
              clickOutsideAnchor: true,
            }}
            positionStrategy="fixed"
            style={{
              ...TOOLTIP_STYLES,
              pointerEvents: "auto",
              maxWidth: "min(360px, calc(100vw - 32px))",
              whiteSpace: "normal",
            }}
          >
            <div className="tailwind-scope">{tooltipContent}</div>
          </Tooltip>,
          document.body
        )}
    </>
  );
};
