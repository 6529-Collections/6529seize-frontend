"use client";

/* The nested visual branches mirror Cosmos's finite display grammar. */
/* eslint-disable no-nested-ternary, sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */

import { useMemo } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumGenerativeStudy,
  MuseumMintedToken,
  MuseumSampledFieldVisualization,
} from "@/lib/museum/generative-studies";
import {
  ComparisonMarker,
  MuseumDiamond,
  booleanTrait,
  coordinate,
  nextSeed,
  seedFromHash,
  seededUnit,
  smallControlClass,
  useModelNumberState,
  useUrlStringState,
  type ProjectComparisonProps,
} from "./shared";

function cosmosPoint(
  index: number,
  count: number,
  cx: number,
  cy: number,
  radius: number
) {
  const ring = Math.floor(Math.sqrt(index));
  const angle = index * 2.399963 + count * 0.07;
  const distance = Math.min(radius, 7 + ring * 4.15);
  return {
    x: cx + Math.cos(angle) * distance,
    y: cy + Math.sin(angle) * distance,
  };
}

function cosmosDisplay(token: MuseumMintedToken): string {
  if (booleanTrait(token.traits["FFFFFF"])) return "White";
  if (booleanTrait(token.traits["FF0000"])) return "Red";
  if (booleanTrait(token.traits["00FF00"])) return "Green";
  if (booleanTrait(token.traits["0000FF"])) return "Blue";
  return "RGB";
}

function CosmosSpecimen({
  id,
  cosmosCount,
  display,
  chunk,
  memory,
  seed,
  label,
  museumHeld = false,
}: {
  readonly id: string;
  readonly cosmosCount: number;
  readonly display: string;
  readonly chunk: number;
  readonly memory: number;
  readonly seed: number;
  readonly label: string;
  readonly museumHeld?: boolean | undefined;
}) {
  const colors =
    display === "White"
      ? ["#f1f1ed", "#d8d8d5", "#bfc0c0"]
      : display === "Red"
        ? ["#f97066"]
        : display === "Green"
          ? ["#3ccb7f"]
          : display === "Blue"
            ? ["#528bff"]
            : ["#f97066", "#3ccb7f", "#528bff"];
  const ghosts = Math.max(2, Math.round(memory / 12));
  const segmentCount = Math.max(120, Math.round(520 / Math.max(1, chunk / 2)));
  const segments = useMemo(
    () =>
      Array.from({ length: segmentCount }, (_, index) => {
        const x = 28 + (index % 26) * 13.9;
        const y =
          32 +
          Math.floor(index / 26) *
            (330 / Math.max(1, Math.ceil(segmentCount / 26)));
        const wave =
          Math.sin(index * 0.71 + seed * 0.00001) * 18 +
          Math.cos(index * 0.17) * 10;
        return { x: x + wave * 0.25, y: y - wave * 0.18, wave };
      }),
    [seed, segmentCount]
  );
  const polygon =
    "0,-58 34,-47 56,-17 54,20 31,49 0,60 -31,49 -54,20 -56,-17 -34,-47";
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label={label}
      className="tw-w-full"
    >
      <defs>
        <radialGradient id={`cosmos-glow-${id}`}>
          <stop offset="0" stopColor="#528bff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="#040405" />
      <circle cx="200" cy="200" r="185" fill={`url(#cosmos-glow-${id})`} />
      <g fill="none">
        {Array.from({ length: ghosts }, (_ghostValue, ghost) => (
          <g
            key={ghost}
            transform={`translate(${ghost * 1.8} ${ghost * 1.15}) rotate(${ghost * 1.9} 200 165)`}
            opacity={0.04 + (ghost / ghosts) * 0.16}
          >
            {Array.from({ length: cosmosCount }, (_, cosmosIndex) => {
              const cx = 200 + (cosmosIndex - (cosmosCount - 1) / 2) * 68;
              const cy = 156 + Math.sin(cosmosIndex * 1.7 + seed) * 24;
              const color = colors[cosmosIndex % colors.length];
              return (
                <g
                  key={cosmosIndex}
                  transform={`translate(${cx} ${cy}) rotate(${cosmosIndex * 23 + ghost * 2})`}
                  stroke={color}
                >
                  <polygon points={polygon} />
                  <path d="M0 -58L31 49 -54 20 54 20 -31 49Z" />
                  <path d="M-34 -47L34 -47 56 -17 0 60 -56 -17Z" />
                </g>
              );
            })}
          </g>
        ))}
        <g strokeWidth="0.8">
          {segments.map((segment, index) => (
            <path
              key={`${segment.x}-${segment.y}-${segment.wave}`}
              d={`M${segment.x.toFixed(1)} ${segment.y.toFixed(1)}l${(4 + Math.abs(segment.wave) * 0.18).toFixed(1)} ${(segment.wave * 0.22).toFixed(1)}`}
              stroke={colors[index % colors.length]}
              opacity={0.12 + Math.min(0.58, Math.abs(segment.wave) / 45)}
            />
          ))}
        </g>
      </g>
      {museumHeld ? (
        <MuseumDiamond x={200} y={200} />
      ) : (
        <ComparisonMarker x={200} y={200} />
      )}
      <text x="18" y="382" fill="#93939f" fontSize="10">
        {cosmosCount} Cosmos · {display} · CHUNK {chunk} · memory {memory}
      </text>
    </svg>
  );
}

export function CosmosStateAtlas({
  visualization,
  study,
  locale,
  candidateMode,
  candidateToken,
}: {
  readonly visualization: MuseumSampledFieldVisualization;
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
} & ProjectComparisonProps) {
  const dimensionIds = visualization.dimensions.map(
    (dimension) => dimension.id
  );
  const [dimensionId, setDimensionId] = useUrlStringState(
    "mDimension",
    visualization.dimensions[0]?.id ?? "",
    dimensionIds,
    true
  );
  const [seed, setSeed] = useModelNumberState(
    "mSeed",
    24_800,
    0,
    4_294_967_295
  );
  const [counterCosmos, setCounterCosmos] = useModelNumberState(
    "mCosmos",
    2,
    1,
    3
  );
  const [counterDisplay, setCounterDisplay] = useUrlStringState(
    "mDisplay",
    "RGB",
    ["RGB", "White", "Red", "Green", "Blue"],
    true
  );
  const [counterChunk, setCounterChunk] = useModelNumberState(
    "mChunk",
    5,
    1,
    10
  );
  const [memory, setMemory] = useModelNumberState("mMemory", 72, 24, 120);
  const dimension =
    visualization.dimensions.find((item) => item.id === dimensionId) ??
    visualization.dimensions[0];
  if (dimension === undefined) return null;
  const held = study.heldPositions[0];
  const heldValue =
    held === undefined
      ? ""
      : dimension.id === "cosmos"
        ? coordinate(held, "Cosmos")
        : dimension.id === "display"
          ? coordinate(held, "Display")
          : coordinate(held, "Published CHUNK");
  const groupWidth = 680 / Math.max(1, dimension.values.length);
  const comparisonCosmos =
    candidateMode === "minted"
      ? Number.parseInt(candidateToken.traits["# COSMOS"] ?? "1", 10)
      : counterCosmos;
  const comparisonDisplay =
    candidateMode === "minted" ? cosmosDisplay(candidateToken) : counterDisplay;
  const comparisonChunk =
    candidateMode === "minted"
      ? Number.parseInt(candidateToken.traits["CHUNK"] ?? "1", 10)
      : counterChunk;
  const comparisonSeed =
    candidateMode === "minted" ? seedFromHash(candidateToken.tokenHash) : seed;
  const comparisonValue =
    dimension.id === "cosmos"
      ? `${comparisonCosmos}`
      : dimension.id === "display"
        ? comparisonDisplay
        : `${comparisonChunk}`;
  const randomize = () => {
    const next = nextSeed(seed);
    setSeed(next);
    setCounterCosmos(1 + Math.floor(seededUnit(next, 0) * 3));
    setCounterDisplay(
      ["RGB", "White", "Red", "Green", "Blue"][
        Math.floor(seededUnit(next, 1) * 5)
      ] ?? "RGB"
    );
    setCounterChunk([1, 3, 5, 7, 10][Math.floor(seededUnit(next, 2) * 5)] ?? 3);
    setMemory(24 + Math.floor(seededUnit(next, 3) * 97));
  };

  return (
    <figure className="tw-m-0">
      <div
        className="tw-flex tw-flex-wrap tw-gap-2"
        aria-label={t(locale, "museum.network.insideSystem.dimensionSelector")}
      >
        {visualization.dimensions.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === dimensionId}
            onClick={() => setDimensionId(item.id)}
            className={`${smallControlClass} ${item.id === dimensionId ? "tw-border-primary-300 tw-bg-primary-500 tw-text-white" : "tw-border-iron-700 tw-bg-black tw-text-iron-300 hover:tw-text-white"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tw-mt-5 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950">
        <svg
          viewBox="0 0 720 430"
          role="img"
          aria-labelledby="cosmos-atlas-title cosmos-atlas-desc"
          className="tw-w-full"
        >
          <title id="cosmos-atlas-title">
            {t(locale, "museum.network.insideSystem.cosmosAtlasTitle")}
          </title>
          <desc id="cosmos-atlas-desc">
            {t(locale, "museum.network.insideSystem.cosmosAtlasDescription")}
          </desc>
          <defs>
            <radialGradient id="cosmos-atlas-glow">
              <stop offset="0" stopColor="#528bff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#131316" stopOpacity="0" />
            </radialGradient>
            <filter
              id="cosmos-selected-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="720" height="430" fill="#131316" />
          <g opacity="0.24" fill="none" stroke="#528bff">
            <path d="M42 348C156 246 229 406 346 280S548 178 694 314" />
            <path d="M18 388C154 302 251 432 378 330S596 254 714 365" />
            <path d="M112 314L167 226 260 238 301 330 246 396 153 382Z" />
            <path d="M410 304L466 214 559 228 603 321 548 392 452 382Z" />
          </g>
          {dimension.values.map((value, groupIndex) => {
            const count = value.count ?? 0;
            const cx = 20 + groupWidth * groupIndex + groupWidth / 2;
            const radius = Math.min(72, groupWidth * 0.37);
            const selectedGroup =
              value.label.toLowerCase() === heldValue.toLowerCase();
            const comparisonGroup =
              value.label.toLowerCase() === comparisonValue.toLowerCase();
            return (
              <g key={value.label}>
                <circle
                  cx={cx}
                  cy="172"
                  r={radius + 16}
                  fill="url(#cosmos-atlas-glow)"
                  opacity={selectedGroup || comparisonGroup ? 1 : 0.34}
                />
                {Array.from({ length: count }, (_, index) => {
                  const point = cosmosPoint(index, count, cx, 172, radius);
                  return (
                    <circle
                      key={`${point.x}-${point.y}`}
                      cx={point.x}
                      cy={point.y}
                      r={selectedGroup && index === count - 1 ? 2.5 : 1.25}
                      fill={
                        selectedGroup && index === count - 1
                          ? "#f5f5f5"
                          : "#848490"
                      }
                      opacity={selectedGroup ? 0.9 : 0.52}
                    />
                  );
                })}
                <text
                  x={cx}
                  y="278"
                  textAnchor="middle"
                  fill={selectedGroup ? "#f5f5f5" : "#ceced4"}
                  fontSize="12"
                  fontWeight={selectedGroup ? "600" : "400"}
                >
                  {value.label}
                </text>
                <text
                  x={cx}
                  y="298"
                  textAnchor="middle"
                  fill="#93939f"
                  fontSize="10"
                >
                  {formatInteger(locale, count)} states
                </text>
                {selectedGroup ? (
                  <g filter="url(#cosmos-selected-glow)">
                    <MuseumDiamond
                      x={cx + radius * 0.62}
                      y={172 - radius * 0.52}
                    />
                  </g>
                ) : null}
                {comparisonGroup ? (
                  <ComparisonMarker
                    x={cx - radius * 0.62}
                    y={172 + radius * 0.52}
                  />
                ) : null}
              </g>
            );
          })}
          <g
            transform="translate(360 360)"
            fill="none"
            stroke="#f5f5f5"
            opacity="0.65"
          >
            <path d="M-78 0L-38 -32 0 -18 38 -32 78 0 38 32 0 18 -38 32Z" />
            <path
              d="M-38 -32L-38 32M38 -32L38 32M0 -18V18M-78 0H78"
              opacity="0.5"
            />
            <path
              d="M-86 8L-46 -24 -8 -10 30 -24 70 8"
              stroke="#528bff"
              opacity="0.55"
            />
            <path
              d="M-94 16L-54 -16 -16 -2 22 -16 62 16"
              stroke="#84adff"
              opacity="0.3"
            />
          </g>
          <text
            x="360"
            y="414"
            textAnchor="middle"
            fill="#ceced4"
            fontSize="11"
          >
            ◆ Ex Nihilo (Cosmos) #248 · {heldValue}
          </text>
        </svg>
      </div>
      <div
        className={`tw-mt-7 tw-grid tw-gap-5 ${candidateMode === "minted" ? "md:tw-grid-cols-2" : ""}`}
      >
        {candidateMode === "minted" ? (
          <figure className="tw-m-0 tw-min-w-0">
            <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
              {t(locale, "museum.network.insideSystem.museumModelHeld")}
            </p>
            <CosmosSpecimen
              id="cosmos-museum"
              cosmosCount={3}
              display="White"
              chunk={3}
              memory={72}
              seed={248}
              label="Museum model of Ex Nihilo Cosmos #248 conditions"
              museumHeld
            />
          </figure>
        ) : null}
        <figure className="tw-m-0 tw-min-w-0">
          <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
            {candidateMode === "minted"
              ? t(locale, "museum.network.insideSystem.museumModelMinted", {
                  invocation: `${candidateToken.invocation}`,
                })
              : t(locale, "museum.network.insideSystem.unmintedCounterfactual")}
          </p>
          <CosmosSpecimen
            id="cosmos-candidate"
            cosmosCount={comparisonCosmos}
            display={comparisonDisplay}
            chunk={comparisonChunk}
            memory={memory}
            seed={comparisonSeed}
            label="Museum model of Ex Nihilo Cosmos comparison conditions"
          />
        </figure>
      </div>
      {candidateMode === "counterfactual" ? (
        <div className="tw-mt-5 tw-grid tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.cosmosCountControl", {
              value: `${counterCosmos}`,
            })}
            <input
              type="range"
              min="1"
              max="3"
              value={counterCosmos}
              onChange={(event) => setCounterCosmos(Number(event.target.value))}
              className="tw-mt-3 tw-w-full"
            />
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.displayControl")}
            <select
              value={counterDisplay}
              onChange={(event) => setCounterDisplay(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option>RGB</option>
              <option>White</option>
              <option>Red</option>
              <option>Green</option>
              <option>Blue</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.chunkControl")}
            <select
              value={counterChunk}
              onChange={(event) => setCounterChunk(Number(event.target.value))}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
              <option value="10">10</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.memoryControl", {
              value: `${memory}`,
            })}
            <input
              type="range"
              min="24"
              max="120"
              value={memory}
              onChange={(event) => setMemory(Number(event.target.value))}
              className="tw-mt-3 tw-w-full"
            />
          </label>
          <button
            type="button"
            onClick={randomize}
            className={`${smallControlClass} tw-border-primary-400 tw-bg-primary-500 tw-text-white`}
          >
            {t(locale, "museum.network.insideSystem.randomize")}
          </button>
        </div>
      ) : null}
      <figcaption className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "museum.network.insideSystem.cosmosAtlasNote")}
      </figcaption>
    </figure>
  );
}
