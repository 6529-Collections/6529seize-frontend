"use client";

/* The visual branches expose the project's staged causal sequence. */
/* eslint-disable no-nested-ternary, sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */

import { useMemo } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumDynamicStateVisualization } from "@/lib/museum/generative-studies";
import {
  nextSeed,
  seedFromHash,
  seededUnit,
  smallControlClass,
  useModelNumberState,
  useUrlStringState,
  type ProjectComparisonProps,
} from "./shared";

interface PhototaxisLight {
  readonly x: number;
  readonly y: number;
}

interface PhototaxisTraceConfig {
  readonly seed: number;
  readonly lights: readonly PhototaxisLight[];
  readonly population: number;
  readonly speed: number;
  readonly sensors: string;
  readonly alignment: string;
}

function generatedPhototaxisLights(
  seed: number,
  count: number
): readonly PhototaxisLight[] {
  return Array.from({ length: count }, (_, index) => ({
    x: Math.round(-460 + seededUnit(seed, index * 2) * 920),
    y: Math.round(-460 + seededUnit(seed, index * 2 + 1) * 920),
  }));
}

function generatedTracePaths({
  seed,
  lights,
  population,
  speed,
  sensors,
  alignment,
}: PhototaxisTraceConfig): readonly string[] {
  const count = Math.min(90, Math.max(28, Math.round(population / 2.5)));
  return Array.from({ length: count }, (_, index) => {
    const light = lights[index % Math.max(1, lights.length)] ?? { x: 0, y: 0 };
    const startX = 24 + seededUnit(seed, index * 5) * 572;
    const startY = 24 + seededUnit(seed, index * 5 + 1) * 372;
    const targetX = 300 + light.x * 0.44;
    const targetY = 210 + light.y * 0.36;
    const sensorGain = sensors === "Nonlinear" ? 1.45 : 0.78;
    const alignmentBias =
      alignment === "Lawful" ? 0.45 : alignment === "Chaotic" ? 1.55 : 1;
    const bend =
      (seededUnit(seed, index * 5 + 2) - 0.5) *
      (110 + speed * 8) *
      sensorGain *
      alignmentBias;
    const escape = (seededUnit(seed, index * 5 + 3) - 0.5) * 210;
    const endX = targetX + escape;
    const endY = targetY + (seededUnit(seed, index * 5 + 4) - 0.5) * 150;
    return `M${startX.toFixed(1)} ${startY.toFixed(1)}C${(startX + bend).toFixed(1)} ${(startY - bend * 0.5).toFixed(1)} ${(targetX - bend).toFixed(1)} ${(targetY + bend * 0.35).toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  });
}

function phototaxisPalette(facade: string): readonly string[] {
  if (facade.startsWith("Toxic"))
    return ["#c8cf30", "#6ba13d", "#ada83d", "#5d7d3e"];
  if (facade.startsWith("Frontier"))
    return ["#a85e42", "#d2a45e", "#777a7c", "#575d69"];
  if (facade === "Silt") return ["#7b7165", "#a4937d", "#57514b", "#c0b6a7"];
  return ["#579ca7", "#6d86a6", "#83898e", "#a1adb2"];
}

function PhototaxisField({
  id,
  label,
  lights,
  population,
  speed,
  facade,
  size,
  sensors,
  alignment,
  magnification,
  selectedStep,
  seed,
}: {
  readonly id: string;
  readonly label: string;
  readonly lights: readonly PhototaxisLight[];
  readonly population: number;
  readonly speed: number;
  readonly facade: string;
  readonly size: string;
  readonly sensors: string;
  readonly alignment: string;
  readonly magnification: number;
  readonly selectedStep: number;
  readonly seed: number;
}) {
  const paths = useMemo(
    () =>
      generatedTracePaths({
        seed,
        lights,
        population,
        speed,
        sensors,
        alignment,
      }),
    [alignment, lights, population, seed, sensors, speed]
  );
  const colors = phototaxisPalette(facade);
  const lightPoint = (light: PhototaxisLight) => ({
    x: 300 + light.x * 0.44,
    y: 210 + light.y * 0.36,
  });
  const agent = { x: 310, y: 230 };
  const fieldScale =
    magnification === 2 ? 1.18 : magnification === 0.66 ? 0.84 : 1;
  const agentScale = size === "Small" ? 0.72 : 1;
  return (
    <svg
      viewBox="0 0 620 420"
      role="img"
      aria-label={label}
      className="tw-w-full"
    >
      <defs>
        <radialGradient id={`photo-halo-${id}`}>
          <stop offset="0" stopColor="#528bff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#528bff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="620" height="420" fill="#f1f2ef" />
      <g
        transform={`translate(${310 * (1 - fieldScale)} ${210 * (1 - fieldScale)}) scale(${fieldScale})`}
        opacity={selectedStep >= 6 ? 0.56 : selectedStep >= 4 ? 0.2 : 0.05}
        fill="none"
        strokeWidth="1"
        className="tw-transition-opacity motion-reduce:tw-transition-none"
      >
        {paths.map((path, index) => (
          <path
            key={path}
            d={path}
            stroke={colors[index % colors.length]}
            opacity={0.2 + (index % 8) * 0.075}
          />
        ))}
      </g>
      {lights.map((light, index) => {
        const point = lightPoint(light);
        return (
          <g
            key={`${light.x}-${light.y}`}
            opacity={selectedStep <= 1 || selectedStep === 6 ? 1 : 0.35}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r="52"
              fill={`url(#photo-halo-${id})`}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="7"
              fill="none"
              stroke="#406afe"
              strokeWidth="1.4"
            />
            <path
              d={`M${point.x - 12} ${point.y}H${point.x + 12}M${point.x} ${point.y - 12}V${point.y + 12}`}
              stroke="#1c1c21"
              strokeWidth="0.9"
            />
            {selectedStep <= 1 ? (
              <text
                x={point.x + 10}
                y={point.y - 10}
                fill="#4c4c55"
                fontSize="9"
              >
                L{index + 1}
              </text>
            ) : null}
            {selectedStep >= 1 && selectedStep < 6 ? (
              <path
                d={`M${agent.x - 10 + index * 8} ${agent.y - 7}L${point.x} ${point.y}`}
                fill="none"
                stroke="#406afe"
                strokeWidth="0.7"
                strokeDasharray="3 5"
                opacity="0.6"
              />
            ) : null}
          </g>
        );
      })}
      {selectedStep < 6 ? (
        <g transform={`translate(${agent.x} ${agent.y}) scale(${agentScale})`}>
          <circle r="16" fill="#f1f2ef" stroke="#1c1c21" strokeWidth="1.4" />
          {selectedStep >= 1 ? (
            <>
              <circle cx="-9" cy="-14" r="3" fill="#406afe" />
              <circle cx="9" cy="-14" r="3" fill="#406afe" />
            </>
          ) : null}
          {selectedStep >= 2 ? (
            <path
              d="M-9 -11L-5 2L0 8L5 2L9 -11"
              fill="none"
              stroke="#406afe"
              strokeWidth="1.5"
            />
          ) : null}
          {selectedStep >= 3 ? (
            <path
              d="M0 0L45 -25M45 -25L34 -26M45 -25L40 -15"
              fill="none"
              stroke="#1c1c21"
              strokeWidth="2"
            />
          ) : null}
        </g>
      ) : null}
      {selectedStep >= 4 && selectedStep < 6 ? (
        <path
          d="M310 230C352 207 385 215 418 188"
          fill="none"
          stroke={selectedStep >= 5 ? "#1c1c21" : "#848490"}
          strokeWidth={selectedStep >= 5 ? 3 : 1.5}
        />
      ) : null}
      <text x="18" y="402" fill="#60606c" fontSize="10">
        {facade} · {population} machines · {lights.length} lights · {size} ·{" "}
        {sensors} sensors · {alignment} · {magnification.toFixed(2)}×
      </text>
    </svg>
  );
}

export function PhototaxisCausalTrace({
  visualization,
  locale,
  candidateMode,
  candidateToken,
}: {
  readonly visualization: MuseumDynamicStateVisualization;
  readonly locale: SupportedLocale;
} & ProjectComparisonProps) {
  const [selectedStep, setSelectedStep] = useModelNumberState(
    "mStep",
    6,
    0,
    visualization.stateLabels.length - 1
  );
  const [seed, setSeed] = useModelNumberState(
    "mSeed",
    30_800,
    0,
    4_294_967_295
  );
  const [lightCount, setLightCount] = useModelNumberState("mLights", 5, 2, 7);
  const [population, setPopulation] = useModelNumberState(
    "mPopulation",
    320,
    50,
    500
  );
  const [speed, setSpeed] = useModelNumberState("mSpeed", 8, 4, 12);
  const [facade, setFacade] = useUrlStringState(
    "mFacade",
    "Frontier",
    [
      "Toxic A",
      "Toxic B",
      "Atomic A",
      "Atomic B",
      "Atomic C",
      "Frontier",
      "Silt",
    ],
    true
  );
  const [size, setSize] = useUrlStringState(
    "mSize",
    "Base",
    ["Small", "Base"],
    true
  );
  const [sensors, setSensors] = useUrlStringState(
    "mSensors",
    "Nonlinear",
    ["Linear", "Nonlinear"],
    true
  );
  const [alignment, setAlignment] = useUrlStringState(
    "mAlignment",
    "Neutral",
    ["Lawful", "Neutral", "Chaotic"],
    true
  );
  const [magnification, setMagnification] = useUrlStringState(
    "mMagnification",
    "0.66",
    ["0.66", "1.0", "2.0"],
    true
  );
  const referenceLights = visualization.lights ?? [];
  const candidateSeed =
    candidateMode === "minted" ? seedFromHash(candidateToken.tokenHash) : seed;
  const candidateLightCount =
    candidateMode === "minted"
      ? Number.parseInt(candidateToken.traits["Lights"] ?? "3", 10)
      : lightCount;
  const candidatePopulation =
    candidateMode === "minted"
      ? ({
          Cluster: 100,
          Assemblage: 200,
          "Small is beautiful": 50,
          Swarm: 500,
        }[candidateToken.traits["Population"] ?? "Assemblage"] ?? 200)
      : population;
  const candidateSpeed =
    candidateMode === "minted"
      ? ({ Lively: 12, Steady: 8, Slow: 4 }[
          candidateToken.traits["Speed"] ?? "Steady"
        ] ?? 8)
      : speed;
  const candidateFacade =
    candidateMode === "minted"
      ? (candidateToken.traits["Façade"] ?? "Atomic A")
      : facade;
  const candidateSize =
    candidateMode === "minted"
      ? (candidateToken.traits["Size"] ?? "Base")
      : size;
  const candidateSensors =
    candidateMode === "minted"
      ? (candidateToken.traits["Sensors"] ?? "Nonlinear")
      : sensors;
  const candidateAlignment =
    candidateMode === "minted"
      ? (candidateToken.traits["Alignment"] ?? "Neutral")
      : alignment;
  const candidateMagnification = Number.parseFloat(
    candidateMode === "minted"
      ? (candidateToken.traits["Magnification"] ?? "1.0")
      : magnification
  );
  const candidateLights = useMemo(
    () => generatedPhototaxisLights(candidateSeed, candidateLightCount),
    [candidateLightCount, candidateSeed]
  );
  const randomize = () => {
    const next = nextSeed(seed);
    setSeed(next);
    setLightCount(2 + Math.floor(seededUnit(next, 0) * 6));
    setPopulation(50 + Math.floor(seededUnit(next, 1) * 10) * 50);
    setSpeed([4, 8, 12][Math.floor(seededUnit(next, 2) * 3)] ?? 8);
    setFacade(
      [
        "Toxic A",
        "Toxic B",
        "Atomic A",
        "Atomic B",
        "Atomic C",
        "Frontier",
        "Silt",
      ][Math.floor(seededUnit(next, 3) * 7)] ?? "Atomic A"
    );
    setSize(seededUnit(next, 4) > 0.5 ? "Base" : "Small");
    setSensors(seededUnit(next, 5) > 0.5 ? "Nonlinear" : "Linear");
    setAlignment(
      ["Lawful", "Neutral", "Chaotic"][Math.floor(seededUnit(next, 6) * 3)] ??
        "Neutral"
    );
    setMagnification(
      ["0.66", "1.0", "2.0"][Math.floor(seededUnit(next, 7) * 3)] ?? "1.0"
    );
  };

  return (
    <figure className="tw-m-0">
      <div
        className={`tw-grid tw-gap-5 ${candidateMode === "minted" ? "lg:tw-grid-cols-2" : ""}`}
      >
        {candidateMode === "minted" ? (
          <div className="tw-overflow-hidden tw-bg-white">
            <p className="tw-m-0 tw-bg-black tw-p-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-300">
              {t(locale, "museum.network.insideSystem.museumModelHeld")}
            </p>
            <PhototaxisField
              id="museum"
              label="Museum model of Phototaxis #308 conditions"
              lights={referenceLights}
              population={200}
              speed={12}
              facade="Atomic A"
              size="Base"
              sensors="Nonlinear"
              alignment="Neutral"
              magnification={0.66}
              selectedStep={selectedStep}
              seed={308}
            />
          </div>
        ) : null}
        <div className="tw-overflow-hidden tw-bg-white">
          <p className="tw-m-0 tw-bg-black tw-p-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
            {candidateMode === "minted"
              ? t(locale, "museum.network.insideSystem.museumModelMinted", {
                  invocation: `${candidateToken.invocation}`,
                })
              : t(locale, "museum.network.insideSystem.unmintedCounterfactual")}
          </p>
          <PhototaxisField
            id="candidate"
            label="Museum model of Phototaxis comparison conditions"
            lights={candidateLights}
            population={candidatePopulation}
            speed={candidateSpeed}
            facade={candidateFacade}
            size={candidateSize}
            sensors={candidateSensors}
            alignment={candidateAlignment}
            magnification={candidateMagnification}
            selectedStep={selectedStep}
            seed={candidateSeed}
          />
        </div>
      </div>
      <div
        className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2"
        aria-label={t(
          locale,
          "museum.network.insideSystem.causalLayerSelector"
        )}
      >
        {visualization.stateLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={selectedStep === index}
            onClick={() => setSelectedStep(index)}
            className={`${smallControlClass} ${selectedStep === index ? "tw-border-primary-300 tw-bg-primary-500 tw-text-white" : "tw-border-iron-700 tw-bg-black tw-text-iron-300"}`}
          >
            <span className="tw-mr-2 tw-font-mono tw-text-xs">{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      {candidateMode === "counterfactual" ? (
        <div className="tw-mt-5 tw-grid tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.lightsControl", {
              value: `${lightCount}`,
            })}
            <input
              type="range"
              min="2"
              max="7"
              value={lightCount}
              onChange={(event) => setLightCount(Number(event.target.value))}
              className="tw-mt-3 tw-w-full"
            />
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.populationControl", {
              value: `${population}`,
            })}
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={population}
              onChange={(event) => setPopulation(Number(event.target.value))}
              className="tw-mt-3 tw-w-full"
            />
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.speedControl")}
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option value="4">Slow</option>
              <option value="8">Steady</option>
              <option value="12">Lively</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.facadeControl")}
            <select
              value={facade}
              onChange={(event) => setFacade(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option>Toxic A</option>
              <option>Toxic B</option>
              <option>Atomic A</option>
              <option>Atomic B</option>
              <option>Atomic C</option>
              <option>Frontier</option>
              <option>Silt</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.sizeControl")}
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option>Small</option>
              <option>Base</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.sensorsControl")}
            <select
              value={sensors}
              onChange={(event) => setSensors(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option>Linear</option>
              <option>Nonlinear</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.alignmentControl")}
            <select
              value={alignment}
              onChange={(event) => setAlignment(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option>Lawful</option>
              <option>Neutral</option>
              <option>Chaotic</option>
            </select>
          </label>
          <label className="tw-text-sm tw-text-iron-300">
            {t(locale, "museum.network.insideSystem.magnificationControl")}
            <select
              value={magnification}
              onChange={(event) => setMagnification(event.target.value)}
              className="tw-mt-2 tw-min-h-11 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-text-iron-100"
            >
              <option value="0.66">0.66×</option>
              <option value="1.0">1.0×</option>
              <option value="2.0">2.0×</option>
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
      <figcaption
        className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400"
        aria-live="polite"
      >
        {t(locale, "museum.network.insideSystem.dynamicSelection", {
          step: `${selectedStep + 1}`,
          label: visualization.stateLabels[selectedStep] ?? "",
        })}{" "}
        {t(locale, "museum.network.insideSystem.phototaxisDiagramNote")}
      </figcaption>
    </figure>
  );
}
