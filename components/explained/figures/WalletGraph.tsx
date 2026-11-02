"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatList } from "@/i18n/format";
import { kt } from "../i18n";
import { EX_HEX } from "../tokens";
import { IdentityHull, Label, SvgFrame } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * Wallets and the identities they form (EXPLAINED.md §4.2): lettered
 * circles, never real addresses; grey links made before Oct 15, 2026 and
 * blue links made from then; a rounded blue boundary around each identity;
 * a wallet that counts alone is dashed, rose when a rule pushed it out.
 * The groups are the engine's (pairState, then clusters); the figure draws
 * them.
 */
export interface GraphWallet {
  /** A letter, A to E. */
  readonly id: string;
  /** Position as a share of the width and height. */
  readonly x: number;
  readonly y: number;
}

export interface GraphLink {
  readonly a: string;
  readonly b: string;
  /** "old": both ways before the gate; "fresh": both ways from it. */
  readonly kind: "old" | "fresh";
}

const NONE_EXCLUDED: readonly string[] = [];

/** The least height of the drawing, in px. */
const MIN_HEIGHT = 180;

export default function WalletGraph({
  wallets,
  links,
  groups,
  excluded = NONE_EXCLUDED,
  locale,
}: {
  readonly wallets: readonly GraphWallet[];
  readonly links: readonly GraphLink[];
  /** Each identity of two or more wallets, by letter. */
  readonly groups: readonly (readonly string[])[];
  /** Wallets a rule pushed out of a group: drawn rose. */
  readonly excluded?: readonly string[];
  readonly locale: SupportedLocale;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(420);
  const base = width < 400 ? 250 : 270;
  // The drawing fits the wallets drawn: no empty half when three sit in a
  // row, and no identity's outline past the frame's edge on a phone. A
  // wallet's circle and its group's outline need this much room around it.
  const pad = 46;
  const raw = wallets.map((wallet) => ({
    id: wallet.id,
    x: wallet.x * width,
    y: wallet.y * base,
  }));
  const xs = raw.map((point) => point.x);
  const ys = raw.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const scale = spanX > width - 2 * pad ? (width - 2 * pad) / spanX : 1;
  const centreX = (minX + maxX) / 2;
  // At least this tall, the wallets centred in it, so a model does not
  // jump in height as a wallet joins a row.
  const height =
    raw.length === 0 ? base : Math.max(maxY - minY + 2 * pad, MIN_HEIGHT);
  const top = (height - (maxY - minY)) / 2;
  const at = new Map(
    raw.map((point) => [
      point.id,
      [width / 2 + (point.x - centreX) * scale, point.y - minY + top] as const,
    ])
  );
  const grouped = new Set(groups.flat());
  const alone = wallets
    .filter((wallet) => !grouped.has(wallet.id))
    .map((wallet) => wallet.id);
  const parts = groups.map((group) => group.join(" + "));
  if (alone.length > 0) {
    parts.push(
      kt(locale, "explained.kit.wallets.alone", {
        wallets: formatList(locale, alone),
      })
    );
  }
  return (
    <div
      ref={ref}
      className="tw-w-full tw-min-w-0"
      data-fig="wallets"
      data-groups={parts.join("; ")}
    >
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.wallets.aria", {
          groups: parts.join("; "),
        })}
      >
        {groups.map((group) => (
          <IdentityHull
            key={group.join("")}
            points={group
              .map((id) => at.get(id))
              .filter(
                (point): point is readonly [number, number] =>
                  point !== undefined
              )}
          />
        ))}
        {links.map((link) => {
          const a = at.get(link.a);
          const b = at.get(link.b);
          if (!a || !b) return null;
          return (
            <line
              key={`${link.a}-${link.b}`}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
              stroke={link.kind === "old" ? EX_HEX.ink3 : EX_HEX.youInk}
              strokeWidth={2}
              data-link={link.kind}
            />
          );
        })}
        {wallets.map((wallet) => {
          const point = at.get(wallet.id);
          if (!point) return null;
          const isAlone = !grouped.has(wallet.id);
          const out = excluded.includes(wallet.id);
          let stroke: string = EX_HEX.ink1;
          if (out) stroke = EX_HEX.fails;
          else if (isAlone) stroke = EX_HEX.ink2;
          return (
            <g
              key={wallet.id}
              data-wallet={wallet.id}
              data-alone={isAlone ? "1" : "0"}
            >
              <circle
                cx={point[0]}
                cy={point[1]}
                r={19}
                fill={EX_HEX.panel}
                stroke={stroke}
                strokeWidth={2}
                strokeDasharray={isAlone ? "4 3" : undefined}
              />
              <Label
                x={point[0]}
                y={point[1] + 5}
                anchor="middle"
                size={15}
                weight={700}
                tone="ink1"
              >
                {wallet.id}
              </Label>
            </g>
          );
        })}
      </SvgFrame>
    </div>
  );
}
