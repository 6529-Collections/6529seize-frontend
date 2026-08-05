"use client";

import { useMemo } from "react";
import { t } from "@/i18n/messages";
import type { MuseumMintedToken } from "@/lib/museum/generative-studies";
import { CenturyAdjacencyLoom } from "./CenturySystemVisual";
import {
  ComparisonSelector,
  SuggestedComparisons,
  firstMintedToken,
  invocationFromPosition,
  suggestionTokens,
} from "./ComparisonExplorer";
import { CosmosStateAtlas } from "./CosmosSystemVisual";
import { EmptyRoomsAmphitheater } from "./EmptyRoomsSystemVisual";
import { PhototaxisCausalTrace } from "./PhototaxisSystemVisual";
import { PreProcessCollisionLattice } from "./PreProcessSystemVisual";
import {
  replaceBrowserUrl,
  useUrlSnapshot,
  MuseumRemoteImage,
  type ComparisonMode,
  type MuseumProjectSystemVisualProps,
} from "./shared";

export function MuseumProjectSystemVisual({
  study,
  locale,
  mintedIndex,
  selectedWorkId,
}: MuseumProjectSystemVisualProps) {
  const museumPosition =
    study.heldPositions.find(
      (position) => position.objectId === selectedWorkId
    ) ?? study.heldPositions[0];
  const museumInvocation = invocationFromPosition(museumPosition);
  const museumToken =
    mintedIndex.tokens.find((token) => token.invocation === museumInvocation) ??
    firstMintedToken(mintedIndex);
  const suggestions = useMemo(
    () => suggestionTokens(mintedIndex, museumToken),
    [mintedIndex, museumToken]
  );
  const urlSnapshot = useUrlSnapshot();
  const parameters = urlSnapshot
    ? new URL(urlSnapshot).searchParams
    : new URLSearchParams();
  const requested = parameters.get("compare")?.replace(/^#/u, "");
  const requestedToken = mintedIndex.tokens.find(
    (token) =>
      `${token.invocation}` === requested || token.tokenId === requested
  );
  const candidateMode: ComparisonMode =
    parameters.get("mode") === "model" ? "counterfactual" : "minted";
  const candidateToken = requestedToken ?? suggestions[0]?.token ?? museumToken;
  const persistComparison = (mode: ComparisonMode, invocation: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("compare", `${invocation}`);
    url.searchParams.set("mode", mode === "minted" ? "minted" : "model");
    replaceBrowserUrl(url);
  };
  const selectCandidate = (token: MuseumMintedToken) => {
    persistComparison("minted", token.invocation);
  };
  const selectMode = (mode: ComparisonMode) => {
    persistComparison(mode, candidateToken.invocation);
  };
  const visualization = study.visualization;
  let visual;
  switch (visualization.design) {
    case "century_adjacency_loom":
      visual = (
        <CenturyAdjacencyLoom
          study={study}
          locale={locale}
          selectedWorkId={selectedWorkId}
          candidateMode={candidateMode}
          candidateToken={candidateToken}
        />
      );
      break;
    case "pre_process_collision_lattice":
      visual = (
        <PreProcessCollisionLattice
          visualization={visualization}
          locale={locale}
          candidateMode={candidateMode}
          candidateToken={candidateToken}
        />
      );
      break;
    case "phototaxis_causal_trace":
      visual = (
        <PhototaxisCausalTrace
          visualization={visualization}
          locale={locale}
          candidateMode={candidateMode}
          candidateToken={candidateToken}
        />
      );
      break;
    case "empty_rooms_amphitheater":
      visual = (
        <EmptyRoomsAmphitheater
          visualization={visualization}
          locale={locale}
          candidateMode={candidateMode}
          candidateToken={candidateToken}
        />
      );
      break;
    case "cosmos_state_atlas":
      visual = (
        <CosmosStateAtlas
          visualization={visualization}
          study={study}
          locale={locale}
          candidateMode={candidateMode}
          candidateToken={candidateToken}
        />
      );
      break;
  }
  return (
    <div>
      <ComparisonSelector
        key={candidateToken.tokenId}
        study={study}
        locale={locale}
        index={mintedIndex}
        museumToken={museumToken}
        candidateToken={candidateToken}
        mode={candidateMode}
        setMode={selectMode}
        selectToken={selectCandidate}
      />
      <div className="tw-mt-10">
        {candidateMode === "counterfactual" ? (
          <div className="tw-grid tw-items-start tw-gap-8 xl:tw-grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
            <figure className="tw-m-0 xl:tw-sticky xl:tw-top-24">
              <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-300">
                {t(locale, "museum.network.insideSystem.museumReference")}
              </p>
              <a
                href={museumToken.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tw-relative tw-block tw-aspect-square tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <MuseumRemoteImage
                  src={museumToken.mediaUrl}
                  alt={`${study.projectTitle} #${museumToken.invocation}`}
                  sizes="(max-width: 1279px) 100vw, 34vw"
                  className="tw-object-contain"
                  eager
                  unavailableText={t(
                    locale,
                    "museum.network.insideSystem.officialStillUnavailable"
                  )}
                />
              </a>
              <figcaption className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-text-iron-300">
                <span>
                  {study.projectTitle} #{museumToken.invocation}
                </span>
                <span>
                  {t(locale, "museum.network.insideSystem.openOfficialStill")}
                </span>
              </figcaption>
            </figure>
            <div className="tw-min-w-0">{visual}</div>
          </div>
        ) : (
          visual
        )}
      </div>
      <SuggestedComparisons
        study={study}
        locale={locale}
        museumToken={museumToken}
        selectedToken={candidateToken}
        suggestions={suggestions}
        onSelect={selectCandidate}
      />
    </div>
  );
}
