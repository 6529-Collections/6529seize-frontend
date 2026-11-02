import type { ReactNode } from "react";
import { getNodeEnv } from "@/config/env";
import { EX_FILL, EX_HEX, EX_MOTION } from "../tokens";
import { stripeColor, stripeHues } from "../marks/HashStripes";

/**
 * The figure primitives (EXPLAINED.md §7): a frame drawn at the pixel width
 * it gets, direct labels never under 12 px, a 45° hatch for the boost, the
 * tile (a copy's TDH), the identity hull, hash stripes and a quiet axis.
 * Colour only for meaning: blue for the reader's copy, green and rose only
 * for verdicts.
 */

const MIN_FIGURE_TEXT = 12;

/**
 * Coordinates to the hundredth of a pixel. Trigonometry can differ in its
 * last digits between the server and the browser, which would break
 * hydration; a hundredth is far below what a screen can show.
 */
export function px(value: number): number {
  return Math.round(value * 100) / 100;
}

export type LabelTone = "ink1" | "ink2" | "ink3" | "you" | "holds" | "fails";

const TONE: Record<LabelTone, string> = {
  ink1: EX_HEX.ink1,
  ink2: EX_HEX.ink2,
  ink3: EX_HEX.ink3,
  you: EX_HEX.youInk,
  holds: EX_HEX.holds,
  fails: EX_HEX.fails,
};

export function SvgFrame({
  width,
  height,
  label,
  children,
  className = "tw-block tw-h-auto tw-max-w-full",
}: {
  readonly width: number;
  readonly height: number;
  /** What the figure shows, as a sentence: its claim (§7.7). */
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={className}
      fontFamily="Montserrat, system-ui, sans-serif"
    >
      {children}
    </svg>
  );
}

/** A direct label (§7.2, §7.3): 12 px or more, ink-2 or ink-3, blue for the reader's value. */
export function Label({
  x,
  y,
  children,
  anchor = "start",
  tone = "ink3",
  size = 12,
  weight = 400,
}: {
  readonly x: number;
  readonly y: number;
  readonly children: ReactNode;
  readonly anchor?: "start" | "middle" | "end";
  readonly tone?: LabelTone;
  readonly size?: number;
  readonly weight?: 400 | 500 | 600 | 700;
}) {
  if (size < MIN_FIGURE_TEXT && getNodeEnv() !== "production") {
    throw new Error(
      `Figure text must be ${MIN_FIGURE_TEXT} px or more; got ${size}.`
    );
  }
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={Math.max(MIN_FIGURE_TEXT, size)}
      fontWeight={weight}
      fill={TONE[tone]}
    >
      {children}
    </text>
  );
}

/** The boost's 45° hatch (§4.2), defined once per figure. */
export function Hatch({
  id,
  color = EX_HEX.youInk,
}: {
  readonly id: string;
  readonly color?: string;
}) {
  return (
    <defs>
      <pattern
        id={id}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="7" height="7" fill="rgba(82,139,255,0.10)" />
        <line x1="0" y1="0" x2="0" y2="7" stroke={color} strokeWidth="2.2" />
      </pattern>
    </defs>
  );
}

/** One copy's TDH (§4.2): width days, height rate; blue only for the reader's own. */
export function Tile({
  x,
  y,
  width,
  height,
  you = false,
  band,
}: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly you?: boolean;
  /** The boost band laid over the top: its height and the hatch id. */
  readonly band?: { readonly height: number; readonly hatch: string };
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={Math.max(0, width)}
        height={Math.max(0, height)}
        fill={you ? EX_FILL.youArea : EX_FILL.neutralArea}
        stroke={you ? EX_HEX.you : EX_HEX.ink3}
        strokeWidth={1.5}
        className={EX_MOTION.model}
      />
      {band && (
        <rect
          x={x}
          y={y - band.height}
          width={Math.max(0, width)}
          height={band.height > 0.5 ? band.height : 0}
          fill={`url(#${band.hatch})`}
          className={EX_MOTION.model}
        />
      )}
    </g>
  );
}

/** An identity (§4.2): a rounded blue boundary around one to four wallets. */
export function IdentityHull({
  points,
  pad = 34,
}: {
  readonly points: readonly (readonly [number, number])[];
  readonly pad?: number;
}) {
  if (points.length === 0) {
    return null;
  }
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  return (
    <rect
      x={x0}
      y={y0}
      width={Math.max(...xs) + pad - x0}
      height={Math.max(...ys) + pad - y0}
      rx={pad - 4}
      fill={EX_FILL.youHull}
      stroke={EX_HEX.you}
      strokeWidth={1.5}
      data-hull=""
    />
  );
}

/** Hash stripes in SVG: sixteen bars at equal lightness. */
export function Stripes({
  hex,
  x,
  y,
}: {
  readonly hex: string;
  readonly x: number;
  readonly y: number;
}) {
  return (
    <g aria-hidden="true">
      {stripeHues(hex).map((hue, index) => (
        <rect
          key={`${index}-${hue}`}
          x={x + index * 5}
          y={y}
          width={4}
          height={14}
          rx={1}
          fill={stripeColor(hue)}
        />
      ))}
    </g>
  );
}

/** Where each item starts when items of these sizes are laid end to end. */
export function offsets(sizes: readonly number[], start = 0): number[] {
  const out: number[] = [];
  let at = start;
  for (const size of sizes) {
    out.push(at);
    at += size;
  }
  return out;
}

/** Three to five round ticks from 0 to at least `max`, the last carrying the unit (§7.5). */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0];
  }
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [0];
  while ((ticks.at(-1) ?? 0) < max - step * 0.001) {
    ticks.push(Math.round(((ticks.at(-1) ?? 0) + step) * 1e6) / 1e6);
  }
  return ticks;
}

/** A quiet axis (§7.5): an ink-4 baseline, short ticks, labels in ink-3. */
export function Axis({
  x0,
  x1,
  y,
  ticks,
  scale,
  format,
}: {
  readonly x0: number;
  readonly x1: number;
  readonly y: number;
  readonly ticks: readonly number[];
  readonly scale: (value: number) => number;
  readonly format: (value: number, last: boolean) => string;
}) {
  return (
    <g>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={EX_HEX.line2} />
      {ticks.map((value, index) => {
        const x = scale(value);
        const last = index === ticks.length - 1;
        let anchor: "start" | "middle" | "end" = "middle";
        if (index === 0) {
          anchor = "start";
        } else if (last) {
          anchor = "end";
        }
        return (
          <g key={value}>
            <line x1={x} y1={y} x2={x} y2={y + 4} stroke={EX_HEX.ink4} />
            <Label x={x} y={y + 18} anchor={anchor}>
              {format(value, last)}
            </Label>
          </g>
        );
      })}
    </g>
  );
}
