"use client";

/* The nested visual branches mirror the exact Surface × Origin × Growth lattice. */
/* eslint-disable no-nested-ternary, sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/no-nested-template-literals */

import { useMemo, useRef, type KeyboardEvent } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { MuseumExhaustiveLatticeVisualization } from "@/lib/museum/generative-studies";
import {
  ComparisonMarker,
  MuseumDiamond,
  focusClass,
  nextSeed,
  smallControlClass,
  useModelNumberState,
  type ProjectComparisonProps,
} from "./shared";

interface LatticeCell {
  readonly row: string;
  readonly rowIndex: number;
  readonly columnGroupIndex: number;
  readonly group: string;
  readonly value: string;
  readonly valueIndex: number;
}

function GrowthGlyph({
  origin,
  growth,
  selected,
}: {
  readonly origin: number;
  readonly growth: number;
  readonly selected: boolean;
}) {
  const points = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className="tw-h-6 tw-w-9">
      {origin === 1
        ? points.map((point) => {
            const radius =
              growth === 4 ? 3.4 : 1.5 + ((point + growth) % 4) * 0.55;
            return (
              <circle
                key={`cluster-${point}`}
                cx={15 + (point % 2) * 6}
                cy={9 + Math.floor(point / 2) * 6}
                r={radius}
                fill={selected ? "#f5f5f5" : "#848490"}
                opacity={0.85}
              />
            );
          })
        : origin === 2
          ? points.map((point) => (
              <circle
                key={`line-${point}`}
                cx={7 + point * 7}
                cy="12"
                r={growth === 4 ? 3 : 1.4 + point * 0.35}
                fill={selected ? "#f5f5f5" : "#848490"}
              />
            ))
          : [
              { id: "7-6", x: 7, y: 6 },
              { id: "27-7", x: 27, y: 7 },
              { id: "12-18", x: 12, y: 18 },
              { id: "25-17", x: 25, y: 17 },
            ].map(({ id, x, y }, index) => (
              <circle
                key={id}
                cx={x}
                cy={y}
                r={growth === 4 ? 2.8 : 1.4 + ((index + growth) % 3) * 0.5}
                fill={selected ? "#f5f5f5" : "#848490"}
              />
            ))}
    </svg>
  );
}

function CollisionChamber({
  cell,
  locale,
  museumHeld = false,
}: {
  readonly cell: LatticeCell;
  readonly locale: SupportedLocale;
  readonly museumHeld?: boolean | undefined;
}) {
  const growth = cell.valueIndex + 1;
  const origin = cell.columnGroupIndex + 1;
  const surface = cell.rowIndex + 1;
  const surfaceId = `${surface}-${origin}-${growth}`;
  const lightSurface = surface === 3 || surface === 7;
  const background = lightSurface ? "#e7e5df" : "#09090b";
  const bodyStroke = lightSurface ? "#242329" : "#ceced4";
  const accent =
    surface === 5 ? "#f2b84b" : surface === 6 ? "#f97066" : "#528bff";
  const bodies = Array.from({ length: 28 }, (_, index) => {
    const angle = index * 2.399963;
    const spread =
      origin === 1
        ? 4 + index * 2.4
        : origin === 2
          ? 76
          : 28 + ((index * 29) % 56);
    const x = origin === 2 ? 48 + index * 7.1 : 140 + Math.cos(angle) * spread;
    const y =
      origin === 2
        ? 140 + Math.sin(index * 1.7) * 4
        : 140 + Math.sin(angle) * spread;
    const progress = index / 27;
    const radius =
      growth === 1
        ? 2 + progress * 8
        : growth === 2
          ? 10 - progress * 7
          : growth === 3
            ? 3.5
            : growth === 4
              ? 8
              : 2 + progress * progress * 9;
    return { x, y, radius };
  });

  return (
    <svg
      viewBox="0 0 280 300"
      aria-label={t(
        locale,
        "museum.network.insideSystem.collisionChamberLabel",
        {
          row: cell.row,
          group: cell.group,
          value: cell.value,
        }
      )}
      className="tw-w-full"
    >
      <defs>
        <radialGradient id={`collision-chamber-glow-${surfaceId}`}>
          <stop
            offset="0"
            stopColor={accent}
            stopOpacity={surface === 8 ? "0.3" : "0.14"}
          />
          <stop offset="0.72" stopColor={background} stopOpacity="0.1" />
          <stop offset="1" stopColor={background} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="280" height="300" fill={background} />
      <circle
        cx="140"
        cy="140"
        r="132"
        fill={`url(#collision-chamber-glow-${surfaceId})`}
        stroke={lightSurface ? "#8e8b85" : "#37373e"}
      />
      {surface === 2 || surface === 5 || surface === 8 ? (
        <g
          stroke={accent}
          strokeWidth={surface === 8 ? "1.4" : "0.75"}
          opacity={surface === 8 ? "0.48" : "0.3"}
        >
          {bodies.slice(1).map((body, index) => {
            const previous = bodies[index];
            return previous ? (
              <path
                key={`${previous.x}-${previous.y}-${body.x}-${body.y}`}
                d={`M${previous.x} ${previous.y}Q140 140 ${body.x} ${body.y}`}
                fill="none"
              />
            ) : null;
          })}
        </g>
      ) : null}
      {surface === 4 || surface === 6 ? (
        <g fill="none" stroke={accent} opacity="0.24">
          {bodies.slice(0, 12).map((body, index) => (
            <circle
              key={`${body.x}-${body.y}-${body.radius}`}
              cx={body.x}
              cy={body.y}
              r={body.radius + 4 + (index % 4) * 3}
              strokeWidth="1"
            />
          ))}
        </g>
      ) : null}
      {surface === 5 || surface === 7 ? (
        <g
          fill="none"
          stroke={surface === 7 ? "#56535e" : accent}
          strokeWidth="1"
          opacity="0.4"
        >
          {bodies.slice(0, 18).map((body, index) => (
            <path
              key={`${body.x}-${body.y}-${body.radius}`}
              d={`M${body.x - 18 - (index % 3) * 6} ${body.y + 10}Q${body.x - 7} ${body.y - 8} ${body.x} ${body.y}`}
            />
          ))}
        </g>
      ) : null}
      {bodies.map((body, index) => (
        <circle
          key={`${body.x}-${body.y}-${body.radius}`}
          cx={body.x}
          cy={body.y}
          r={body.radius}
          fill={
            surface === 1
              ? index % 4 === 0
                ? accent
                : bodyStroke
              : surface === 3
                ? background
                : "none"
          }
          stroke={index % 4 === 0 ? accent : bodyStroke}
          strokeWidth={surface === 3 ? "1.8" : "1"}
          opacity={0.28 + (index / bodies.length) * 0.65}
        />
      ))}
      {museumHeld ? (
        <MuseumDiamond x={140} y={140} />
      ) : (
        <ComparisonMarker x={140} y={140} />
      )}
      <text x="140" y="286" textAnchor="middle" fill="#93939f" fontSize="11">
        {cell.group} · {cell.value}
      </text>
    </svg>
  );
}

export function PreProcessCollisionLattice({
  visualization,
  locale,
  candidateMode,
  candidateToken,
}: {
  readonly visualization: MuseumExhaustiveLatticeVisualization;
  readonly locale: SupportedLocale;
} & ProjectComparisonProps) {
  const columnCount = visualization.columns.reduce(
    (total, column) => total + column.values.length,
    0
  );
  const initialColumn =
    visualization.columns
      .slice(0, visualization.selected.columnGroupIndex)
      .reduce((total, column) => total + column.values.length, 0) +
    visualization.selected.valueIndex;
  const initialIndex =
    visualization.selected.rowIndex * columnCount + initialColumn;
  const [selectedIndex, setSelectedIndex] = useModelNumberState(
    "mPosition",
    initialIndex,
    0,
    119
  );
  const [randomState, setRandomState] = useModelNumberState(
    "mSeed",
    1_200_063,
    0,
    4_294_967_295
  );
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const cells = useMemo(
    () =>
      visualization.rows.flatMap((row, rowIndex) =>
        visualization.columns.flatMap((column, columnGroupIndex) =>
          column.values.map((value, valueIndex) => ({
            row,
            rowIndex,
            columnGroupIndex,
            group: column.group,
            value,
            valueIndex,
          }))
        )
      ),
    [visualization]
  );
  const selected = cells[selectedIndex] ?? cells[initialIndex];
  if (selected === undefined) return null;
  const candidateSurface = Math.max(
    1,
    Number.parseInt(candidateToken.traits["Surface"] ?? "1", 10)
  );
  const candidateOrigin = Math.max(
    1,
    Number.parseInt(candidateToken.traits["Origin"] ?? "1", 10)
  );
  const candidateGrowth = Math.max(
    1,
    Number.parseInt(candidateToken.traits["Growth"] ?? "1", 10)
  );
  const candidateIndex = Math.min(
    cells.length - 1,
    (candidateSurface - 1) * columnCount +
      (candidateOrigin - 1) * 5 +
      candidateGrowth -
      1
  );
  const comparisonCell =
    candidateMode === "minted" ? (cells[candidateIndex] ?? selected) : selected;
  const randomize = () => {
    const next = nextSeed(randomState);
    setRandomState(next);
    setSelectedIndex(next % cells.length);
  };

  const moveSelection = (index: number) => {
    const bounded = Math.max(0, Math.min(cells.length - 1, index));
    setSelectedIndex(bounded);
    buttonRefs.current[bounded]?.focus();
  };

  const onGridKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const rowStart = Math.floor(index / columnCount) * columnCount;
    const rowEnd = rowStart + columnCount - 1;
    let destination: number | null = null;
    if (event.key === "ArrowRight") destination = Math.min(rowEnd, index + 1);
    if (event.key === "ArrowLeft") destination = Math.max(rowStart, index - 1);
    if (event.key === "ArrowDown") destination = index + columnCount;
    if (event.key === "ArrowUp") destination = index - columnCount;
    if (event.key === "Home") destination = event.ctrlKey ? 0 : rowStart;
    if (event.key === "End")
      destination = event.ctrlKey ? cells.length - 1 : rowEnd;
    if (destination === null) return;
    event.preventDefault();
    moveSelection(destination);
  };

  return (
    <div className="tw-grid tw-gap-8 xl:tw-grid-cols-[minmax(0,1fr)_24rem]">
      <div className="tw-min-w-0 tw-overflow-x-auto tw-pb-2">
        <div className="tw-min-w-[48rem]">
          <div className="tw-ml-[5.5rem] tw-grid tw-grid-cols-3 tw-gap-3 tw-pb-3">
            {visualization.columns.map((column) => (
              <div
                key={column.group}
                className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700 tw-pb-2 tw-text-center tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400"
              >
                {column.group}
              </div>
            ))}
          </div>
          <div
            role="grid"
            aria-label={t(locale, "museum.network.insideSystem.latticeLabel")}
            aria-describedby="possibility-space-coverage"
            aria-rowcount={visualization.rows.length}
            aria-colcount={columnCount}
            className="tw-grid tw-gap-y-2"
          >
            {visualization.rows.map((row, rowIndex) => (
              <div
                key={row}
                role="row"
                className="tw-grid tw-grid-cols-[5.5rem_repeat(15,minmax(2.45rem,1fr))] tw-gap-x-1"
              >
                <span
                  role="rowheader"
                  className="tw-flex tw-items-center tw-text-xs tw-font-semibold tw-text-iron-400"
                >
                  {row}
                </span>
                {cells
                  .filter((cell) => cell.rowIndex === rowIndex)
                  .map((cell) => {
                    const index =
                      cell.rowIndex * columnCount +
                      visualization.columns
                        .slice(0, cell.columnGroupIndex)
                        .reduce(
                          (total, column) => total + column.values.length,
                          0
                        ) +
                      cell.valueIndex;
                    const held = index === initialIndex;
                    const active =
                      candidateMode === "counterfactual" &&
                      index === selectedIndex;
                    const comparison =
                      candidateMode === "minted" && index === candidateIndex;
                    return (
                      <button
                        key={`${cell.row}-${cell.group}-${cell.value}`}
                        ref={(node) => {
                          buttonRefs.current[index] = node;
                        }}
                        type="button"
                        role="gridcell"
                        aria-rowindex={cell.rowIndex + 1}
                        aria-colindex={(index % columnCount) + 1}
                        aria-selected={active}
                        aria-label={`${cell.row}, ${cell.group}, ${cell.value}${held ? `, ${t(locale, "museum.network.insideSystem.museumWork")}` : ""}${comparison ? `, ${t(locale, "museum.network.insideSystem.comparisonWork")}` : ""}`}
                        tabIndex={active ? 0 : -1}
                        disabled={candidateMode === "minted"}
                        onClick={() => setSelectedIndex(index)}
                        onKeyDown={(event) => onGridKeyDown(event, index)}
                        className={`tw-relative tw-flex tw-min-h-10 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-bg-transparent tw-p-0 ${focusClass} ${active ? "tw-border-primary-300 tw-bg-primary-500/20" : held ? "tw-border-white tw-bg-white/5" : comparison ? "tw-border-primary-400 tw-bg-primary-500/10" : "tw-border-white/5 hover:tw-border-white/20"} ${cell.columnGroupIndex > 0 && cell.valueIndex === 0 ? "tw-ml-2" : ""}`}
                      >
                        <GrowthGlyph
                          origin={cell.columnGroupIndex + 1}
                          growth={cell.valueIndex + 1}
                          selected={active}
                        />
                        {held ? (
                          <span
                            aria-hidden="true"
                            className="tw-absolute tw-right-0.5 tw-top-0 tw-text-[0.55rem] tw-text-white"
                          >
                            ◆
                          </span>
                        ) : null}
                        {comparison ? (
                          <span
                            aria-hidden="true"
                            className="tw-absolute tw-bottom-1 tw-left-1 tw-size-1.5 tw-rounded-full tw-bg-primary-300"
                          />
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="tw-self-start">
        <div
          className={`tw-grid tw-gap-3 ${candidateMode === "minted" ? "tw-grid-cols-2" : "tw-grid-cols-1"}`}
        >
          {candidateMode === "minted" ? (
            <figure className="tw-m-0 tw-min-w-0">
              <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
                {t(locale, "museum.network.insideSystem.museumModelHeld")}
              </p>
              <CollisionChamber
                cell={cells[initialIndex] ?? selected}
                locale={locale}
                museumHeld
              />
            </figure>
          ) : null}
          <figure className="tw-m-0 tw-min-w-0">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
              {candidateMode === "minted"
                ? t(locale, "museum.network.insideSystem.museumModelMinted", {
                    invocation: `${candidateToken.invocation}`,
                  })
                : t(locale, "museum.network.insideSystem.sessionComparison")}
            </p>
            <CollisionChamber cell={comparisonCell} locale={locale} />
          </figure>
        </div>
        {candidateMode === "counterfactual" ? (
          <div className="tw-mt-3 tw-flex tw-flex-wrap tw-gap-2">
            <button
              type="button"
              onClick={randomize}
              className={`${smallControlClass} tw-border-primary-400 tw-bg-primary-500 tw-text-white`}
            >
              {t(locale, "museum.network.insideSystem.randomizePosition")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIndex(initialIndex)}
              className={`${smallControlClass} tw-border-iron-600 tw-bg-black tw-text-iron-200`}
            >
              {t(locale, "museum.network.insideSystem.matchMuseumWork")}
            </button>
          </div>
        ) : null}
        <p
          className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400"
          aria-live="polite"
        >
          {comparisonCell.row} · {comparisonCell.group} · {comparisonCell.value}
        </p>
        <p className="tw-m-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500">
          {t(locale, "museum.network.insideSystem.exhaustiveStartingSpaceNote")}
        </p>
      </div>
    </div>
  );
}
