"use client";

import type React from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { EX_HEX, EX_MOTION } from "../tokens";
import { Label, SvgFrame, px as round2 } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * The Loop (EXPLAINED.md §4.4): where am I in 6529? Six stations around
 * Verify, Ethereum below, CC0 leaving Art, the network as a dashed ring.
 * Each station carries a live number. A chapter's own stations are marked
 * with its number; the selected one is blue. On a phone the loop becomes a
 * list, Verify last.
 */
export interface LoopStation {
  readonly key: string;
  readonly name: string;
  readonly sub: string;
  /** The station's live number, printed from its fact, or its words. */
  readonly num: string;
  /** The fact the number came from, for the gates. */
  readonly fact?: string;
  /** The chapter that explains it: "01" when shipped. */
  readonly chapter?: string;
}

const ANGLES = [90, 150, 210, 270, 330, 30];
/** The width of a 13 px semibold character, generously: keeps a label inside the figure. */
const CHAR_13PX = 7.6;

interface LoopProps {
  /** Six, in loop order from Art. */
  readonly stations: readonly LoopStation[];
  /** The selected station's key. */
  readonly focus: string;
  /** The centre's live line: equal on all of today's identities. */
  readonly verify: { readonly identities: string; readonly fact?: string };
  readonly locale: SupportedLocale;
}

/**
 * On a phone, the loop's picture in small: the six stations round Verify,
 * each with its pictogram, the selected one blue. The list under it says
 * the rest.
 */
function MiniRing({ stations, focus }: Pick<LoopProps, "stations" | "focus">) {
  const size = 216;
  const c = size / 2;
  const r = 78;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="tw-mx-auto tw-mb-4 tw-block tw-h-[216px] tw-w-[216px]"
      aria-hidden="true"
      data-loop-mini=""
    >
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={EX_HEX.line}
        strokeWidth={1.5}
      />
      <circle
        cx={c}
        cy={c}
        r={r + 24}
        fill="none"
        stroke={EX_HEX.line}
        strokeDasharray="3 6"
      />
      <circle
        cx={c}
        cy={c}
        r={30}
        fill={EX_HEX.panel}
        stroke={EX_HEX.holds}
        strokeWidth={1.5}
      />
      <path
        d={`M${c - 9} ${c}l6 6l12 -12`}
        fill="none"
        stroke={EX_HEX.holds}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {stations.map((station, index) => {
        const angle = ((ANGLES[index] ?? 0) * Math.PI) / 180;
        const x = round2(c + r * Math.cos(angle));
        const y = round2(c + r * Math.sin(angle));
        const on = station.key === focus;
        return (
          <g key={station.key}>
            <circle
              cx={x}
              cy={y}
              r={20}
              fill={on ? "rgba(82,139,255,0.16)" : EX_HEX.panel}
              stroke={
                on ? EX_HEX.you : station.chapter ? EX_HEX.ink2 : EX_HEX.line2
              }
              strokeWidth={on ? 2.2 : 1.4}
            />
            <StationGlyph
              kind={station.key}
              x={x}
              y={y}
              tone={
                on ? EX_HEX.youInk : station.chapter ? EX_HEX.ink1 : EX_HEX.ink3
              }
            />
          </g>
        );
      })}
    </svg>
  );
}

/** On a phone: the loop's picture in small, then the stations as a list, Verify last. */
function LoopList({ stations, focus, verify, locale }: LoopProps) {
  return (
    <div
      className="tw-w-full tw-min-w-0"
      data-fig="loop"
      data-loop-layout="list"
    >
      <MiniRing stations={stations} focus={focus} />
      <ol
        className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0"
        aria-label={kt(locale, "explained.kit.loop.aria")}
      >
        {stations.map((station) => {
          const on = station.key === focus;
          return (
            <li
              key={station.key}
              className={`tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-gap-x-3 tw-gap-y-0.5 tw-rounded-[10px] tw-border tw-border-solid tw-px-3.5 tw-py-3 max-[359px]:tw-grid-cols-1 ${on ? "tw-border-primary-400 tw-bg-primary-400/10" : "tw-border-iron-800 tw-bg-iron-950"}`}
              data-station={station.key}
              {...(on ? { "aria-current": "step" as const } : {})}
            >
              <b className="tw-text-base tw-font-semibold tw-text-iron-50">
                {station.name}
              </b>
              <span
                className={`tw-text-sm tw-font-semibold ${on ? "tw-text-primary-300" : "tw-text-iron-300"}`}
                {...(station.fact ? { "data-fact": station.fact } : {})}
              >
                {station.num}
              </span>
              <span className="tw-col-span-2 tw-text-[15px] tw-leading-[23px] tw-text-iron-400 max-[359px]:tw-col-span-1">
                {station.sub}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="tw-m-0 tw-mt-2.5 tw-rounded-[10px] tw-border tw-border-dashed tw-border-iron-700 tw-px-3.5 tw-py-3 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
        {kt(locale, "explained.kit.loop.listVerify", {
          identities: verify.identities,
        })}
      </p>
    </div>
  );
}

/** The circle: its height is fixed, so the page does not move when it measures its width. */
const CIRCLE_HEIGHT = 520;

/**
 * Where a station's name sits: beside the station on the circle's sides,
 * under or over it at the bottom and the top.
 */
function namePlace(
  angle: number,
  x: number,
  y: number
): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  const radians = (angle * Math.PI) / 180;
  const cos = round2(Math.cos(radians));
  if (cos > 0.2) return { x: x + 42, y: y - 6, anchor: "start" };
  if (cos < -0.2) return { x: x - 42, y: y - 6, anchor: "end" };
  const below = round2(Math.sin(radians)) > 0;
  return { x, y: below ? y + 48 : y - 54, anchor: "middle" };
}

/**
 * A station's pictogram, drawn in its ring: a card, a wallet, a clock,
 * rising bars, a ballot and a mint press. Strokes only, in the station's
 * tone, so the ring reads as that station before its name does.
 */
function StationGlyph({
  kind,
  x,
  y,
  tone,
}: {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly tone: string;
}) {
  const stroke = {
    fill: "none",
    stroke: tone,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let body: React.ReactNode;
  switch (kind) {
    case "art":
      body = (
        <>
          <rect x={-6.5} y={-9} width={13} height={18} rx={2} {...stroke} />
          <path d="M-4 4.5L-1 0.5L1.5 3L3 1.5L4.5 4.5" {...stroke} />
          <circle cx={2} cy={-4} r={1.6} {...stroke} />
        </>
      );
      break;
    case "hold":
      body = (
        <>
          <rect x={-9} y={-6.5} width={18} height={13} rx={2.5} {...stroke} />
          <path d="M3 -1.5H9V2.5H3a2 2 0 0 1 0-4z" {...stroke} />
        </>
      );
      break;
    case "time":
      body = (
        <>
          <circle cx={0} cy={0} r={8.5} {...stroke} />
          <path d="M0 -5V0L3.5 2.5" {...stroke} />
        </>
      );
      break;
    case "standing":
      body = (
        <path
          d="M-7 7V2M-2.5 7V-1.5M2 7V-5M6.5 7V-8.5"
          {...stroke}
          strokeWidth={2.2}
        />
      );
      break;
    case "decide":
      body = (
        <>
          <rect x={-8} y={-8} width={16} height={16} rx={2.5} {...stroke} />
          <path d="M-4 0.5L-1 3.5L4.5 -3" {...stroke} />
        </>
      );
      break;
    default:
      body = (
        <>
          <path d="M0 -9V2M-4 -2L0 2L4 -2" {...stroke} />
          <path d="M-8 6H8" {...stroke} />
        </>
      );
  }
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {body}
    </g>
  );
}

function LoopCircle({ stations, focus, verify, locale }: LoopProps) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(600);
  const height = CIRCLE_HEIGHT;
  const cx = width / 2;
  // The ring sits a little above the middle, so Art's number keeps clear of
  // the Ethereum bar under it.
  const cy = height / 2 - 6;
  const radius = round2(Math.min(width * 0.3, height * 0.31));
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const at = (degrees: number, r = radius): [number, number] => [
    round2(cx + r * Math.cos(rad(degrees))),
    round2(cy + r * Math.sin(rad(degrees))),
  ];
  const artBottom = at(90);
  const cc0 = kt(locale, "explained.kit.loop.cc0");

  return (
    <div
      ref={ref}
      className="tw-w-full tw-min-w-0"
      data-fig="loop"
      data-loop-layout="circle"
    >
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.loop.aria")}
      >
        <defs>
          <marker
            id="ex-loop-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill={EX_HEX.ink4} />
          </marker>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={EX_HEX.line}
          strokeWidth={1.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius + 40}
          fill="none"
          stroke={EX_HEX.line}
          strokeDasharray="3 6"
        />
        <rect
          x={cx - radius - 20}
          y={height - 30}
          width={2 * radius + 40}
          height={26}
          rx={8}
          fill={EX_HEX.panel}
          stroke={EX_HEX.line}
        />
        <Label x={cx - radius - 6} y={height - 13} weight={600} tone="ink2">
          {kt(locale, "explained.kit.loop.ethereum")}
        </Label>
        <Label x={cx + radius + 6} y={height - 13} anchor="end">
          {kt(locale, "explained.kit.loop.ethereumSub")}
        </Label>
        <circle
          cx={cx}
          cy={cy}
          r={74}
          fill={EX_HEX.panel}
          stroke={EX_HEX.holds}
          strokeWidth={1.5}
        />
        <Label
          x={cx}
          y={cy - 16}
          anchor="middle"
          size={17}
          weight={700}
          tone="ink1"
        >
          {kt(locale, "explained.kit.loop.verify")}
        </Label>
        <Label x={cx} y={cy + 4} anchor="middle" tone="ink2">
          {kt(locale, "explained.kit.loop.verifySub")}
        </Label>
        <Label x={cx} y={cy + 22} anchor="middle" weight={600} tone="holds">
          {kt(locale, "explained.kit.loop.verifyEqual", {
            identities: verify.identities,
          })}
        </Label>
        <Label x={cx} y={cy + 38} anchor="middle">
          {kt(locale, "explained.kit.loop.verifyToday")}
        </Label>
        {stations.map((station, index) => {
          const angle = ANGLES[index] ?? 0;
          const next = ANGLES[(index + 1) % ANGLES.length] ?? 0;
          const [px, py] = at(angle);
          const start = at(angle + 13.75);
          const end = at(next - 13.75);
          const arc = `M${start[0]} ${start[1]} A${radius} ${radius} 0 0 1 ${end[0]} ${end[1]}`;
          const on = station.key === focus;
          const ours = station.chapter !== undefined;
          const { x: tx, y: ty, anchor } = namePlace(angle, px, py);
          let ring: string = EX_HEX.line2;
          if (on) ring = EX_HEX.you;
          else if (ours) ring = EX_HEX.ink2;
          return (
            <g
              key={station.key}
              data-station={station.key}
              {...(on ? { "data-focus": "1" } : {})}
            >
              <path
                d={arc}
                fill="none"
                stroke={EX_HEX.ink4}
                strokeWidth={1.5}
                markerEnd="url(#ex-loop-arrow)"
              />
              <circle cx={px} cy={py} r={30} fill={EX_HEX.panel} />
              <circle
                cx={px}
                cy={py}
                r={30}
                fill={on ? "rgba(82,139,255,0.16)" : "none"}
                stroke={ring}
                strokeWidth={on ? 2.5 : 1.5}
              />
              <StationGlyph
                kind={station.key}
                x={px}
                y={ours ? py - 6 : py}
                tone={on ? EX_HEX.youInk : ours ? EX_HEX.ink1 : EX_HEX.ink3}
              />
              {ours && (
                <Label
                  x={px}
                  y={py + 21}
                  anchor="middle"
                  size={12}
                  weight={700}
                  tone="ink1"
                >
                  {station.chapter}
                </Label>
              )}
              <Label
                x={tx}
                y={ty}
                anchor={anchor}
                size={16}
                weight={600}
                tone="ink1"
              >
                {station.name}
              </Label>
              <text
                x={tx}
                y={ty + 18}
                textAnchor={anchor}
                fontSize={13}
                fontWeight={600}
                fill={on ? EX_HEX.youInk : EX_HEX.ink2}
                {...(station.fact ? { "data-fact": station.fact } : {})}
              >
                {station.num}
              </text>
            </g>
          );
        })}
        {(() => {
          // "Follow one copy": the copy travels to the selected station.
          const index = Math.max(
            0,
            stations.findIndex((station) => station.key === focus)
          );
          const [tx, ty] = at(ANGLES[index] ?? 0, radius - 52);
          return (
            <g
              aria-hidden="true"
              data-copy-token=""
              style={{
                transform: `translate(${tx}px, ${ty}px)`,
                transition: `transform 450ms ${EX_MOTION.ease}`,
              }}
              className="motion-reduce:!tw-transition-none"
            >
              <rect
                x={-6}
                y={-8}
                width={12}
                height={16}
                rx={2}
                fill={EX_HEX.you}
                stroke={EX_HEX.youInk}
              />
            </g>
          );
        })()}
        <path
          d={`M${artBottom[0] - 32} ${artBottom[1] + 4} C${artBottom[0] - 90} ${artBottom[1] + 10} ${artBottom[0] - 150} ${artBottom[1] - 6} ${artBottom[0] - 200} ${artBottom[1] - 30}`}
          fill="none"
          stroke={EX_HEX.ink3}
          strokeWidth={1.3}
          strokeDasharray="4 4"
          markerEnd="url(#ex-loop-arrow)"
        />
        <Label
          x={Math.max(cc0.length * CHAR_13PX + 4, artBottom[0] - 206)}
          y={artBottom[1] - 38}
          anchor="end"
          size={13}
          weight={600}
          tone="ink2"
        >
          {cc0}
        </Label>
      </SvgFrame>
      <p className="tw-m-0 tw-mt-2 tw-max-w-[560px] tw-text-[13px] tw-leading-5 tw-text-iron-400">
        {kt(locale, "explained.kit.loop.network")}
      </p>
    </div>
  );
}

/**
 * The loop, drawn for the width it gets: a list until the circle has room
 * for its labels (about 560 px), the circle from `xl` up. Both are in the page and CSS shows one, so nothing moves when
 * the page hydrates.
 */
export default function LoopFigure(props: LoopProps) {
  return (
    <>
      <div className="xl:tw-hidden">
        <LoopList {...props} />
      </div>
      <div className="max-xl:tw-hidden">
        <LoopCircle {...props} />
      </div>
    </>
  );
}

/** The loop in a chapter's eyebrow: the ring, the chapter's arc in blue, Verify green. */
export function LoopLocator({
  from = 150,
  to = 250,
  label,
}: {
  /** The chapter's arc, in degrees on the loop. */
  readonly from?: number;
  readonly to?: number;
  readonly label: string;
}) {
  const r = 11;
  const point = (degrees: number) =>
    [
      round2(14 + r * Math.cos((degrees * Math.PI) / 180)),
      round2(14 + r * Math.sin((degrees * Math.PI) / 180)),
    ] as const;
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  const large = to - from > 180 ? 1 : 0;
  return (
    <svg
      viewBox="0 0 28 28"
      className="tw-size-7 tw-flex-none"
      role="img"
      aria-label={label}
    >
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke={EX_HEX.line2}
        strokeWidth="2.5"
      />
      <path
        d={`M${x0} ${y0}A${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        fill="none"
        stroke={EX_HEX.you}
        strokeWidth="2.5"
      />
      <circle cx="14" cy="14" r="3" fill={EX_HEX.holds} />
    </svg>
  );
}
