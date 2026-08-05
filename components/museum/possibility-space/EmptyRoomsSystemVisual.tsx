"use client";

/* The nested branch selects one of the project's finite color-pass states. */
/* eslint-disable no-nested-ternary, sonarjs/no-nested-conditional */

import { useMemo } from "react";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumFiniteCombinatorialVisualization } from "@/lib/museum/generative-studies";
import {
  ComparisonMarker,
  booleanTrait,
  nextSeed,
  seedFromHash,
  seededUnit,
  smallControlClass,
  useModelNumberState,
  useUrlStringState,
  type ProjectComparisonProps,
} from "./shared";

export function EmptyRoomsAmphitheater({
  visualization,
  locale,
  candidateMode,
  candidateToken,
}: {
  readonly visualization: MuseumFiniteCombinatorialVisualization;
  readonly locale: SupportedLocale;
} & ProjectComparisonProps) {
  const [selectedGroup, setSelectedGroup] = useModelNumberState(
    "mGroup",
    visualization.selectedGroupIndex,
    0,
    visualization.groups.length - 1
  );
  const [seed, setSeed] = useModelNumberState(
    "mSeed",
    9_230_713,
    0,
    4_294_967_295
  );
  const [counterTotal, setCounterTotal] = useModelNumberState(
    "mTotal",
    4,
    1,
    6
  );
  const [depth, setDepth] = useModelNumberState("mDepth", 255, 80, 520);
  const [channel, setChannel] = useUrlStringState(
    "mChannel",
    "Green",
    ["Red", "Green", "Blue", "RGB"],
    true
  );
  const radii = [30, 49, 70, 94, 121, 151];
  const selectedInvocation = 713;
  const groupStart = visualization.groups
    .slice(0, visualization.selectedGroupIndex)
    .reduce((total, group) => total + group.count, 1);
  const offset = selectedInvocation - groupStart;
  const selectedAngle =
    (offset /
      (visualization.groups[visualization.selectedGroupIndex]?.count ?? 1)) *
      Math.PI *
      2 -
    Math.PI / 2;
  const selectedRadius = radii[visualization.selectedGroupIndex] ?? 151;
  const selectedPoint = {
    x: 190 + Math.cos(selectedAngle) * selectedRadius,
    y: 190 + Math.sin(selectedAngle) * selectedRadius,
  };
  const candidateGroupIndex = Math.max(
    0,
    Math.min(
      visualization.groups.length - 1,
      Number.parseInt(candidateToken.traits["# Shapes"] ?? "1", 10) - 1
    )
  );
  const candidateGroupStart = visualization.groups
    .slice(0, candidateGroupIndex)
    .reduce((total, group) => total + group.count, 1);
  const candidateOffset = candidateToken.invocation - candidateGroupStart;
  const candidateGroupCount =
    visualization.groups[candidateGroupIndex]?.count ?? 1;
  const candidateAngle =
    (candidateOffset / candidateGroupCount) * Math.PI * 2 - Math.PI / 2;
  const candidateRadius = radii[candidateGroupIndex] ?? 30;
  const candidatePoint = {
    x: 190 + Math.cos(candidateAngle) * candidateRadius,
    y: 190 + Math.sin(candidateAngle) * candidateRadius,
  };
  const traitCounts = useMemo(
    () =>
      [
        "# Suns",
        "# Shards",
        "# Cargos",
        "# Hives",
        "# Pyramids",
        "# Moons",
      ].map((trait) =>
        Number.parseInt(candidateToken.traits[trait] ?? "0", 10)
      ),
    [candidateToken]
  );
  const counterCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (let index = 0; index < counterTotal; index += 1) {
      const slot = Math.floor(seededUnit(seed, index) * counts.length);
      counts[slot] = (counts[slot] ?? 0) + 1;
    }
    return counts;
  }, [counterTotal, seed]);
  const comparisonCounts =
    candidateMode === "minted" ? traitCounts : counterCounts;
  const comparisonChannels = (
    candidateMode === "minted"
      ? ["Red", "Green", "Blue"].filter((candidateChannel) =>
          booleanTrait(candidateToken.traits[candidateChannel])
        )
      : channel === "RGB"
        ? ["Red", "Green", "Blue"]
        : [channel]
  ) as Array<"Red" | "Green" | "Blue">;
  if (comparisonChannels.length === 0) comparisonChannels.push("Green");
  const comparisonChannelLabel = comparisonChannels.join(" + ");
  const comparisonDepth = candidateMode === "minted" ? 255 : depth;
  const comparisonSeed =
    candidateMode === "minted" ? seedFromHash(candidateToken.tokenHash) : seed;
  const formLabels = ["Sun", "Shard", "Cargo", "Hive", "Pyramid", "Moon"];
  const decodedForms = formLabels.flatMap((form, index) =>
    Array.from({ length: comparisonCounts[index] ?? 0 }, () => form)
  );
  const comparisonCode =
    candidateMode === "minted"
      ? (candidateToken.traits["Code"] ?? "—")
      : comparisonCounts
          .flatMap((count, index) =>
            Array.from({ length: count }, () => `${index + 1}`)
          )
          .join("")
          .padEnd(6, "9");
  const channelColors = {
    Red: "#f97066",
    Green: "#3ccb7f",
    Blue: "#528bff",
  } as const;
  const roomSegments = useMemo(
    () =>
      Array.from({ length: 650 }, (_, index) => {
        const column = index % 26;
        const row = Math.floor(index / 26);
        const nx = column / 25 - 0.5;
        const ny = row / 24 - 0.5;
        const wave =
          comparisonCounts.reduce(
            (total, count, formIndex) =>
              total +
              count *
                Math.sin(
                  (nx * (formIndex + 2) + ny * (formIndex + 3)) * Math.PI * 2 +
                    comparisonSeed * 0.00001
                ),
            0
          ) / Math.max(1, decodedForms.length);
        const z = wave * (comparisonDepth / 255) * 34;
        const x = 260 + nx * 390 + z * 0.65;
        const y = 142 + ny * 205 - z * 0.42;
        return { x, y, z };
      }),
    [comparisonCounts, comparisonDepth, comparisonSeed, decodedForms.length]
  );
  const randomize = () => {
    const next = nextSeed(seed);
    setSeed(next);
    setCounterTotal(1 + Math.floor(seededUnit(next, 0) * 6));
    setDepth(80 + Math.floor(seededUnit(next, 1) * 441));
    setChannel(
      ["Red", "Green", "Blue", "RGB"][Math.floor(seededUnit(next, 2) * 4)] ??
        "Green"
    );
  };

  return (
    <div className="tw-grid tw-gap-8 xl:tw-grid-cols-[minmax(22rem,0.85fr)_minmax(0,1fr)]">
      <figure className="tw-m-0 tw-min-w-0">
        <svg
          viewBox="0 0 380 405"
          role="img"
          aria-labelledby="empty-rooms-map-title empty-rooms-map-desc"
          className="tw-w-full"
        >
          <title id="empty-rooms-map-title">
            {t(locale, "museum.network.insideSystem.emptyRoomsMapTitle")}
          </title>
          <desc id="empty-rooms-map-desc">
            {t(locale, "museum.network.insideSystem.emptyRoomsMapDescription")}
          </desc>
          <defs>
            <radialGradient id="empty-rooms-field">
              <stop offset="0" stopColor="#3ccb7f" stopOpacity="0.08" />
              <stop offset="1" stopColor="#131316" stopOpacity="0" />
            </radialGradient>
            <filter
              id="empty-rooms-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="190" cy="190" r="180" fill="url(#empty-rooms-field)" />
          {visualization.groups.map((group, groupIndex) => {
            const radius = radii[groupIndex] ?? 151;
            const active = selectedGroup === groupIndex;
            return (
              <g key={group.label} opacity={active ? 1 : 0.32}>
                <circle
                  cx="190"
                  cy="190"
                  r={radius}
                  fill="none"
                  stroke={active ? "#3ccb7f" : "#37373e"}
                  strokeWidth={active ? 1 : 0.6}
                />
                {Array.from({ length: group.count }, (_, index) => {
                  const angle =
                    (index / group.count) * Math.PI * 2 - Math.PI / 2;
                  return (
                    <circle
                      key={index}
                      cx={190 + Math.cos(angle) * radius}
                      cy={190 + Math.sin(angle) * radius}
                      r={groupIndex === 5 ? 0.72 : 1.15}
                      fill={active ? "#83bf6e" : "#848490"}
                    />
                  );
                })}
              </g>
            );
          })}
          <path
            d={`M${selectedPoint.x} ${selectedPoint.y - 9}L${selectedPoint.x + 9} ${selectedPoint.y}L${selectedPoint.x} ${selectedPoint.y + 9}L${selectedPoint.x - 9} ${selectedPoint.y}Z`}
            fill="#f5f5f5"
            stroke="#3ccb7f"
            strokeWidth="3"
            filter="url(#empty-rooms-glow)"
          />
          {candidateMode === "minted" && candidateToken.invocation > 0 ? (
            <ComparisonMarker x={candidatePoint.x} y={candidatePoint.y} />
          ) : null}
          <path
            d={`M${selectedPoint.x} ${selectedPoint.y}L190 374`}
            stroke="#3ccb7f"
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />
          <text
            x="190"
            y="391"
            textAnchor="middle"
            fill="#f5f5f5"
            fontSize="11"
            fontWeight="600"
          >
            ◆ #713 · 555536
          </text>
          <circle
            cx="24"
            cy="366"
            r="5"
            fill="none"
            stroke="#848490"
            strokeWidth="1"
          />
          <text x="36" y="370" fill="#93939f" fontSize="9">
            invocation 0 · outside the 923-node grammar
          </text>
        </svg>
        <div
          className="tw-flex tw-flex-wrap tw-justify-center tw-gap-2"
          aria-label={t(
            locale,
            "museum.network.insideSystem.combinatorialGroups"
          )}
        >
          {visualization.groups.map((group, index) => (
            <button
              key={group.label}
              type="button"
              aria-pressed={selectedGroup === index}
              onClick={() => setSelectedGroup(index)}
              className={`${smallControlClass} ${selectedGroup === index ? "tw-border-green tw-bg-green/10 tw-text-white" : "tw-border-iron-700 tw-bg-black tw-text-iron-300"}`}
            >
              {group.label} · {formatInteger(locale, group.count)}
            </button>
          ))}
        </div>
      </figure>
      <figure className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-justify-center">
        <p className="tw-m-0 tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
          {candidateMode === "minted"
            ? t(locale, "museum.network.insideSystem.museumModelMinted", {
                invocation: `${candidateToken.invocation}`,
              })
            : t(locale, "museum.network.insideSystem.sessionComparison")}
        </p>
        <div
          className="tw-grid tw-grid-cols-6 tw-gap-2"
          aria-label={t(
            locale,
            "museum.network.insideSystem.decodedFormsLabel"
          )}
        >
          {decodedForms.map((form, index) => (
            <div
              key={`${form}-${index}`}
              className="tw-flex tw-aspect-square tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-green/50 tw-bg-green/5 tw-text-center tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-text-iron-100"
            >
              {form.slice(0, 2)}
            </div>
          ))}
        </div>
        <svg
          viewBox="0 0 520 285"
          className="tw-mt-6 tw-w-full tw-bg-black"
          role="img"
          aria-label={t(
            locale,
            "museum.network.insideSystem.emptyRoomsPipelineLabel"
          )}
        >
          <rect width="520" height="285" fill="#050706" />
          {comparisonChannels.map((comparisonChannel, channelIndex) => {
            const passOffset =
              (channelIndex - (comparisonChannels.length - 1) / 2) * 1.6;
            const channelColor = channelColors[comparisonChannel];
            return (
              <g
                key={comparisonChannel}
                stroke={channelColor}
                strokeLinecap="square"
                transform={`translate(${passOffset.toFixed(1)} 0)`}
              >
                {roomSegments.map((segment, index) => (
                  <path
                    key={index}
                    d={`M${segment.x.toFixed(1)} ${segment.y.toFixed(1)}l${(4 + Math.abs(segment.z) * 0.2).toFixed(1)} ${(-2 - segment.z * 0.12).toFixed(1)}`}
                    strokeWidth="0.7"
                    opacity={
                      (0.18 + Math.min(0.72, Math.abs(segment.z) / 45)) /
                      Math.max(1, comparisonChannels.length * 0.72)
                    }
                  />
                ))}
                <path
                  d="M62 248L258 18 462 248"
                  fill="none"
                  strokeWidth="0.8"
                  opacity="0.25"
                />
              </g>
            );
          })}
          <ComparisonMarker x={260} y={142} />
        </svg>
        <figcaption className="tw-text-sm tw-leading-6 tw-text-iron-400">
          {comparisonCode} → {decodedForms.join(" · ") || "gradient only"}{" "}
          → {comparisonChannelLabel} depth field → line-built room.
        </figcaption>
        {candidateMode === "counterfactual" ? (
          <div className="tw-mt-5 tw-grid tw-gap-4 sm:tw-grid-cols-3">
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.totalFormsControl", {
                value: `${counterTotal}`,
              })}
              <input
                type="range"
                min="1"
                max="6"
                value={counterTotal}
                onChange={(event) =>
                  setCounterTotal(Number(event.target.value))
                }
                className="tw-mt-3 tw-w-full"
              />
            </label>
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.depthControl", {
                value: `${depth}`,
              })}
              <input
                type="range"
                min="80"
                max="520"
                value={depth}
                onChange={(event) => setDepth(Number(event.target.value))}
                className="tw-mt-3 tw-w-full"
              />
            </label>
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.channelControl")}
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              >
                <option>Red</option>
                <option>Green</option>
                <option>Blue</option>
                <option>RGB</option>
              </select>
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
        <p className="tw-m-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(locale, "museum.network.insideSystem.exhaustiveGrammarNote")}
        </p>
      </figure>
    </div>
  );
}
