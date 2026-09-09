"use client";

import { t } from "@/i18n/messages";
import type { MuseumHeldPosition } from "@/lib/museum/generative-studies";
import {
  ComparisonMarker,
  MuseumDiamond,
  booleanTrait,
  coordinate,
  nextSeed,
  numericCoordinate,
  seedFromHash,
  seededUnit,
  selectedHeldPosition,
  shuffledIndexes,
  smallControlClass,
  useModelBooleanState,
  useModelNumberState,
  useUrlStringState,
  type MuseumProjectSystemVisualProps,
  type ProjectComparisonProps,
} from "./shared";

interface CenturyRenderConfig {
  readonly background: string;
  readonly lineColors: readonly string[];
  readonly ellipseColors: readonly string[];
  readonly permutation: readonly number[];
  readonly seed: number;
}

const CHAOS_ORDER = "Chaos";
const COSMOS_ORDER = "Cosmos";
const INITIAL_ORDER_LABEL = "Initial order";

const CENTURY_RENDER_CONFIG: Readonly<Record<string, CenturyRenderConfig>> = {
  "6529NM.2026.001.01": {
    background: "#101b2c",
    lineColors: ["#e6dfc9", "#59769e", "#b8c7d6", "#263e61"],
    ellipseColors: ["#e9dfc5", "#263e61"],
    permutation: [0, 13, 8, 4, 5, 3, 1, 11, 6, 9, 14, 15, 7, 10, 2, 12],
    seed: 31,
  },
  "6529NM.2026.001.02": {
    background: "#ded5bd",
    lineColors: ["#7b3025", "#1c1b19", "#b97249", "#5f5144"],
    ellipseColors: ["#8e3e2f", "#292725"],
    permutation: [2, 0, 5, 4, 3, 1, 6],
    seed: 724,
  },
  "6529NM.2026.001.03": {
    background: "#090909",
    lineColors: ["#f2f2ef", "#929292"],
    ellipseColors: ["#d3d3d0", "#686868"],
    permutation: [6, 1, 9, 2, 5, 3, 0, 8, 4, 7],
    seed: 401,
  },
};

function counterfactualCenturyConfig(
  position: MuseumHeldPosition,
  seed: number
): CenturyRenderConfig {
  const palette = coordinate(position, "Palette");
  const paletteConfig: Readonly<
    Record<string, Omit<CenturyRenderConfig, "permutation" | "seed">>
  > = {
    A: {
      background: "#101b2c",
      lineColors: ["#e6dfc9", "#59769e", "#b8c7d6", "#263e61"],
      ellipseColors: ["#e9dfc5", "#263e61"],
    },
    B: {
      background: "#ded5bd",
      lineColors: ["#7b3025", "#1c1b19", "#b97249", "#5f5144"],
      ellipseColors: ["#8e3e2f", "#292725"],
    },
    C: {
      background: "#090909",
      lineColors: ["#f2f2ef", "#929292"],
      ellipseColors: ["#d3d3d0", "#686868"],
    },
    D: {
      background: "#321847",
      lineColors: ["#f1bd50", "#d44f68", "#68c6c1", "#ece4d5"],
      ellipseColors: ["#d44f68", "#68c6c1"],
    },
  };
  const selected = paletteConfig[palette] ?? paletteConfig["A"]!;
  const slices = numericCoordinate(position, "Slices", 10);
  const permutation =
    coordinate(position, INITIAL_ORDER_LABEL) === COSMOS_ORDER
      ? Array.from({ length: slices }, (_, index) => index)
      : shuffledIndexes(slices, seed);
  return { ...selected, permutation, seed };
}

function CenturyGlyph({
  position,
  locale,
  selected,
  museumHeld = false,
  renderConfig,
}: {
  readonly position: MuseumHeldPosition;
  readonly locale: MuseumProjectSystemVisualProps["locale"];
  readonly selected: boolean;
  readonly museumHeld?: boolean | undefined;
  readonly renderConfig?: CenturyRenderConfig | undefined;
}) {
  const slices = numericCoordinate(position, "Slices", 10);
  const bands = numericCoordinate(position, "Bands", 15);
  const janky = coordinate(position, "Janky") === "Yes";
  const alpha = coordinate(position, "Alpha") !== "No";
  const config =
    renderConfig ??
    CENTURY_RENDER_CONFIG[position.objectId] ??
    counterfactualCenturyConfig(position, slices * 101 + bands);
  const safeId = position.objectId.replaceAll(".", "-");
  const stripWidth = 176 / slices;
  const stripIndexes = Array.from({ length: slices }, (_, index) => index);
  const bandIndexes = Array.from({ length: bands }, (_, index) => index);

  return (
    <svg
      viewBox="0 0 240 280"
      className="tw-w-full"
      aria-label={t(locale, "museum.network.insideSystem.centuryGlyphLabel", {
        title: position.title,
        slices,
        alignment: t(
          locale,
          janky
            ? "museum.network.insideSystem.displaced"
            : "museum.network.insideSystem.aligned"
        ),
        alpha: t(
          locale,
          alpha
            ? "museum.network.insideSystem.enabled"
            : "museum.network.insideSystem.disabled"
        ),
      })}
    >
      <defs>
        <clipPath id={`century-circle-${safeId}`}>
          <circle cx="120" cy="142" r="88" />
        </clipPath>
        <radialGradient id={`century-glow-${safeId}`}>
          <stop offset="0" stopColor="#528bff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#528bff" stopOpacity="0" />
        </radialGradient>
        <filter
          id={`century-shadow-${safeId}`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <g id={`century-source-${safeId}`}>
          <rect
            x="25"
            y="47"
            width="190"
            height="190"
            fill={config.background}
          />
          <ellipse
            cx="102"
            cy="123"
            rx="86"
            ry="32"
            transform="rotate(33 102 123)"
            fill={config.ellipseColors[0]}
            opacity={alpha ? 0.72 : 0.92}
          />
          <ellipse
            cx="151"
            cy="164"
            rx="62"
            ry="25"
            transform="rotate(-33 151 164)"
            fill={config.ellipseColors[1]}
            opacity={alpha ? 0.68 : 0.9}
          />
          {bandIndexes.map((index) => {
            const y = 58 + (index / Math.max(1, bands - 1)) * 168;
            const bend = (seededUnit(config.seed, index) - 0.5) * 52;
            const phase = seededUnit(config.seed, index + bands) * 34;
            const width = 2 + seededUnit(config.seed, index + bands * 2) * 7;
            return (
              <path
                key={`band-${y}-${bend}-${phase}`}
                d={`M10 ${y + phase * 0.22}Q120 ${y + bend} 230 ${y - phase * 0.18}`}
                fill="none"
                stroke={config.lineColors[index % config.lineColors.length]}
                strokeWidth={width}
                strokeLinecap="square"
                opacity={alpha ? 0.72 : 0.9}
              />
            );
          })}
        </g>
      </defs>

      <circle
        cx="120"
        cy="142"
        r="112"
        fill={`url(#century-glow-${safeId})`}
        opacity={selected ? 1 : 0.35}
      />
      <g opacity="0.42" stroke="#60606c" strokeWidth="0.8">
        {stripIndexes.map((index) => {
          const sourceX = 32 + index * stripWidth + stripWidth / 2;
          const destination = config.permutation[index] ?? index;
          const targetX = 32 + destination * stripWidth + stripWidth / 2;
          return (
            <path
              key={`thread-${sourceX}-${targetX}`}
              d={`M${sourceX} 10 C${sourceX} 48 ${targetX} 48 ${targetX} 70`}
              fill="none"
            />
          );
        })}
      </g>
      <g clipPath={`url(#century-circle-${safeId})`}>
        <rect x="25" y="47" width="190" height="190" fill={config.background} />
        {stripIndexes.map((index) => {
          const source = config.permutation[index] ?? index;
          const x = 32 + index * stripWidth;
          const sourceX = 32 + source * stripWidth;
          const y = janky ? ((source % 3) - 1) * 8 : 0;
          return (
            <g key={`strip-${x}-${sourceX}`}>
              <clipPath id={`century-strip-${safeId}-${index}`}>
                <rect
                  x={x}
                  y="46"
                  width={Math.max(2, stripWidth - 0.7)}
                  height="192"
                />
              </clipPath>
              <g
                clipPath={`url(#century-strip-${safeId}-${index})`}
                transform={`translate(${x - sourceX} ${y})`}
              >
                <use href={`#century-source-${safeId}`} />
              </g>
              <path
                d={`M${x} 48V236`}
                stroke={
                  config.lineColors[(index + 1) % config.lineColors.length]
                }
                strokeWidth="0.6"
                opacity="0.45"
              />
            </g>
          );
        })}
      </g>
      <circle
        cx="120"
        cy="142"
        r="88"
        fill="none"
        stroke={selected ? "#84adff" : "#60606c"}
        strokeWidth={selected ? 2.5 : 1}
        filter={selected ? `url(#century-shadow-${safeId})` : undefined}
      />
      {coordinate(position, "Oculi") === "Yes" ? (
        <circle
          cx="120"
          cy="142"
          r="16"
          fill="none"
          stroke="#f5f5f5"
          strokeWidth="1.4"
          opacity="0.8"
        />
      ) : null}
      {museumHeld ? (
        <MuseumDiamond x={120} y={142} />
      ) : (
        <ComparisonMarker x={120} y={142} />
      )}
      <text
        x="120"
        y="258"
        textAnchor="middle"
        fill="#f5f5f5"
        fontSize="13"
        fontWeight="600"
      >
        {position.title}
      </text>
      <text x="120" y="276" textAnchor="middle" fill="#93939f" fontSize="10">
        {t(locale, "museum.network.insideSystem.centuryGlyphSummary", {
          bands,
          slices,
          alignment: t(
            locale,
            janky
              ? "museum.network.insideSystem.displaced"
              : "museum.network.insideSystem.aligned"
          ),
          alpha: alpha
            ? ` · ${t(locale, "museum.network.insideSystem.alphaControl")}`
            : "",
        })}
      </text>
    </svg>
  );
}

export function CenturyAdjacencyLoom({
  study,
  locale,
  selectedWorkId,
  candidateMode,
  candidateToken,
}: Omit<MuseumProjectSystemVisualProps, "onSelectWork" | "mintedIndex"> &
  ProjectComparisonProps) {
  const selectedPosition = selectedHeldPosition(study, selectedWorkId);
  const referenceSlices = numericCoordinate(selectedPosition, "Slices", 10);
  const referenceBands = numericCoordinate(selectedPosition, "Bands", 15);
  const referencePalette = coordinate(selectedPosition, "Palette") || "A";
  const [seed, setSeed] = useModelNumberState(
    "mSeed",
    20_260_804,
    0,
    4_294_967_295
  );
  const [slices, setSlices] = useModelNumberState(
    "mSlices",
    Math.max(3, referenceSlices - 2),
    3,
    20
  );
  const [bands, setBands] = useModelNumberState(
    "mBands",
    Math.min(52, referenceBands + 6),
    8,
    52
  );
  const [palette, setPalette] = useUrlStringState(
    "mPalette",
    referencePalette === "D" ? "A" : "D",
    ["A", "B", "C", "D"],
    true
  );
  const [janky, setJanky] = useModelBooleanState(
    "mJanky",
    !coordinate(selectedPosition, "Janky").includes("Yes")
  );
  const [alpha, setAlpha] = useModelBooleanState(
    "mAlpha",
    !coordinate(selectedPosition, "Alpha").includes("No")
  );
  const [oculi, setOculi] = useModelBooleanState(
    "mOculi",
    coordinate(selectedPosition, "Oculi") !== "Yes"
  );
  const referenceOrder =
    coordinate(selectedPosition, INITIAL_ORDER_LABEL) || CHAOS_ORDER;
  const [initialOrder, setInitialOrder] = useUrlStringState(
    "mOrder",
    referenceOrder === CHAOS_ORDER ? COSMOS_ORDER : CHAOS_ORDER,
    [CHAOS_ORDER, COSMOS_ORDER],
    true
  );
  const counterfactualPosition: MuseumHeldPosition = {
    objectId: "century-counterfactual",
    title: t(locale, "museum.network.insideSystem.counterfactualTitle"),
    coordinates: [
      { label: "Palette", value: palette },
      { label: "Bands", value: `${bands}` },
      { label: "Oculi", value: oculi ? "Yes" : "No" },
      { label: "Alpha", value: alpha ? "220 analytical" : "No" },
      { label: "Janky", value: janky ? "Yes" : "No" },
      { label: "Slices", value: `${slices}` },
      { label: INITIAL_ORDER_LABEL, value: initialOrder },
    ],
    reading: "",
  };
  const mintedSliceCount = Number.parseInt(
    candidateToken.traits["Slice Count"] ?? "10",
    10
  );
  const mintedPosition: MuseumHeldPosition = {
    objectId: `century-minted-${candidateToken.invocation}`,
    title: `CENTURY #${candidateToken.invocation}`,
    coordinates: [
      { label: "Palette", value: candidateToken.traits["Palette"] ?? "A" },
      { label: "Bands", value: candidateToken.traits["Line Count"] ?? "15" },
      {
        label: "Oculi",
        value: booleanTrait(candidateToken.traits["Oculi"]) ? "Yes" : "No",
      },
      {
        label: "Alpha",
        value: booleanTrait(candidateToken.traits["Alpha"])
          ? (candidateToken.traits["Alpha Value"] ?? "Yes")
          : "No",
      },
      {
        label: "Janky",
        value: booleanTrait(candidateToken.traits["Janky"]) ? "Yes" : "No",
      },
      {
        label: "Slices",
        value: `${mintedSliceCount > 2 ? mintedSliceCount : 10}`,
      },
      {
        label: INITIAL_ORDER_LABEL,
        value: candidateToken.traits["Slice Order"] ?? CHAOS_ORDER,
      },
    ],
    reading: "",
  };
  const comparisonPosition =
    candidateMode === "minted" ? mintedPosition : counterfactualPosition;
  const comparisonSeed =
    candidateMode === "minted" ? seedFromHash(candidateToken.tokenHash) : seed;
  const randomize = () => {
    const next = nextSeed(seed);
    setSeed(next);
    setSlices(3 + Math.floor(seededUnit(next, 0) * 18));
    setBands(8 + Math.floor(seededUnit(next, 1) * 45));
    setPalette(
      ["A", "B", "C", "D"][Math.floor(seededUnit(next, 2) * 4)] ?? "A"
    );
    setJanky(seededUnit(next, 3) > 0.5);
    setAlpha(seededUnit(next, 4) > 0.5);
    setOculi(seededUnit(next, 5) > 0.5);
    setInitialOrder(seededUnit(next, 6) > 0.5 ? CHAOS_ORDER : COSMOS_ORDER);
  };
  const reset = () => {
    setSlices(referenceSlices);
    setBands(referenceBands);
    setPalette(referencePalette);
    setJanky(coordinate(selectedPosition, "Janky") === "Yes");
    setAlpha(coordinate(selectedPosition, "Alpha") !== "No");
    setOculi(coordinate(selectedPosition, "Oculi") === "Yes");
    setInitialOrder(referenceOrder);
  };

  return (
    <figure className="tw-m-0">
      <div
        className={`tw-grid tw-gap-5 ${candidateMode === "minted" ? "lg:tw-grid-cols-2" : ""}`}
      >
        {candidateMode === "minted" ? (
          <div className="tw-min-w-0">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-400">
              {t(locale, "museum.network.insideSystem.museumModelHeld")}
            </p>
            <CenturyGlyph
              position={selectedPosition}
              locale={locale}
              selected
              museumHeld
            />
          </div>
        ) : null}
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-primary-300">
            {candidateMode === "minted"
              ? t(locale, "museum.network.insideSystem.museumModelMinted", {
                  invocation: `${candidateToken.invocation}`,
                })
              : t(locale, "museum.network.insideSystem.unmintedCounterfactual")}
          </p>
          <CenturyGlyph
            position={comparisonPosition}
            locale={locale}
            selected
            renderConfig={counterfactualCenturyConfig(
              comparisonPosition,
              comparisonSeed
            )}
          />
        </div>
      </div>
      {candidateMode === "counterfactual" ? (
        <>
          <div className="tw-mt-5 tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-4">
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.paletteControl")}
              <select
                value={palette}
                onChange={(event) => setPalette(event.target.value)}
                className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              >
                {["A", "B", "C", "D"].map((value) => (
                  <option key={value} value={value}>
                    {t(locale, "museum.network.insideSystem.paletteOption", {
                      value,
                    })}
                  </option>
                ))}
              </select>
            </label>
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.bandsControl", {
                value: `${bands}`,
              })}
              <input
                type="range"
                min="8"
                max="52"
                value={bands}
                onChange={(event) => setBands(Number(event.target.value))}
                className="tw-mt-3 tw-w-full"
              />
            </label>
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.slicesControl", {
                value: `${slices}`,
              })}
              <input
                type="range"
                min="3"
                max="20"
                value={slices}
                onChange={(event) => setSlices(Number(event.target.value))}
                className="tw-mt-3 tw-w-full"
              />
            </label>
            <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-self-end tw-text-sm tw-text-iron-200">
              <input
                type="checkbox"
                checked={janky}
                onChange={(event) => setJanky(event.target.checked)}
                className="tw-size-5"
              />
              <span>
                {t(locale, "museum.network.insideSystem.jankyControl")}
              </span>
            </label>
            <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-self-end tw-text-sm tw-text-iron-200">
              <input
                type="checkbox"
                checked={alpha}
                onChange={(event) => setAlpha(event.target.checked)}
                className="tw-size-5"
              />
              <span>
                {t(locale, "museum.network.insideSystem.alphaControl")}
              </span>
            </label>
            <label className="tw-flex tw-min-h-11 tw-items-center tw-gap-3 tw-self-end tw-text-sm tw-text-iron-200">
              <input
                type="checkbox"
                checked={oculi}
                onChange={(event) => setOculi(event.target.checked)}
                className="tw-size-5"
              />
              <span>
                {t(locale, "museum.network.insideSystem.oculiControl")}
              </span>
            </label>
            <label className="tw-text-sm tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.initialOrderControl")}
              <select
                value={initialOrder}
                onChange={(event) => setInitialOrder(event.target.value)}
                className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
              >
                <option value={CHAOS_ORDER}>
                  {t(locale, "museum.network.insideSystem.chaosOrder")}
                </option>
                <option value={COSMOS_ORDER}>
                  {t(locale, "museum.network.insideSystem.cosmosOrder")}
                </option>
              </select>
            </label>
          </div>
          <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2">
            <button
              type="button"
              onClick={randomize}
              className={`${smallControlClass} tw-border-primary-400 tw-bg-primary-500 tw-text-white`}
            >
              {t(locale, "museum.network.insideSystem.randomize")}
            </button>
            <button
              type="button"
              onClick={reset}
              className={`${smallControlClass} tw-border-iron-600 tw-bg-black tw-text-iron-200`}
            >
              {t(locale, "museum.network.insideSystem.matchMuseumWork")}
            </button>
          </div>
        </>
      ) : null}
      <figcaption className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "museum.network.insideSystem.counterfactualNote")}
      </figcaption>
    </figure>
  );
}
