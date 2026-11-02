"use client";

import type { SupportedLocale } from "@/i18n/locales";
import { formatCents, formatCount } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_FILL, EX_HEX } from "../tokens";
import { Hatch, Label, offsets, SvgFrame } from "./svg";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * One identity (EXPLAINED.md §4.1): each wallet's copies as tiles side by
 * side; linked, one blue boundary and one hatched boost band across all of
 * them. The boost band is drawn taller than to scale so a few hundredths
 * show; the figure says by how much.
 */
export interface IdentityWallet {
  readonly name: string;
  readonly cards: number;
}

export default function IdentityBlock({
  wallets,
  linked,
  boostCents,
  tdh,
  locale,
  bandFactor = 4,
  hatchId = "ex-identity-band",
}: {
  readonly wallets: readonly IdentityWallet[];
  readonly linked: boolean;
  /** The one boost, when linked. */
  readonly boostCents: number;
  /** The identity's TDH (linked) or the wallets' together (apart), from the engine. */
  readonly tdh: number;
  readonly locale: SupportedLocale;
  readonly bandFactor?: number;
  readonly hatchId?: string;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(800);
  const narrow = width < 560;
  // At 400% zoom the short title does not fit one line: it takes two.
  const tiny = width < 300;
  let height = narrow ? 214 : 204;
  if (tiny) height = 232;
  const gap = narrow ? 18 : 40;
  const total = wallets.reduce((sum, wallet) => sum + wallet.cards, 0);
  const tile = (width - gap * (wallets.length - 1) - 24) / total;
  const tileH = narrow ? 64 : 76;
  const y0 = tiny ? 88 : 70;
  const bandH = linked ? ((tileH * (boostCents - 100)) / 100) * bandFactor : 0;
  const boost = formatCents(locale, boostCents / 100);
  const tdhText = formatCount(locale, tdh);
  let title: string;
  if (linked) {
    title = narrow
      ? kt(locale, "explained.kit.identity.linkedShort", {
          boost,
          tdh: tdhText,
        })
      : kt(locale, "explained.kit.identity.linked", { boost, tdh: tdhText });
  } else {
    title = narrow
      ? kt(locale, "explained.kit.identity.apartShort", { tdh: tdhText })
      : kt(locale, "explained.kit.identity.apart", { tdh: tdhText });
  }

  const lefts = offsets(
    wallets.map((wallet) => wallet.cards * tile + gap),
    12
  );
  const placed = wallets.map((wallet, index) => ({
    ...wallet,
    at: lefts[index] ?? 12,
  }));

  return (
    <div
      ref={ref}
      className="tw-w-full tw-min-w-0"
      data-fig="identity"
      data-linked={linked ? "1" : "0"}
    >
      <SvgFrame
        width={width}
        height={height}
        label={kt(locale, "explained.kit.identity.aria")}
      >
        <Hatch id={hatchId} />
        {linked && (
          <rect
            x={2}
            y={y0 - bandH - 18}
            width={width - 4}
            height={tileH + bandH + 66}
            rx={18}
            fill="rgba(82,139,255,0.05)"
            stroke={EX_HEX.you}
            strokeWidth={1.5}
          />
        )}
        {placed.map((wallet, index) => {
          const last = index === placed.length - 1;
          const endAligned = narrow && last && placed.length > 1;
          const labelX = endAligned
            ? wallet.at + wallet.cards * tile
            : wallet.at;
          const anchor = endAligned ? "end" : "start";
          return (
            <g key={wallet.name}>
              {Array.from({ length: wallet.cards }, (_, card) => (
                <rect
                  key={card}
                  x={wallet.at + card * tile + 1}
                  y={y0}
                  width={Math.max(1, tile - 2)}
                  height={tileH}
                  fill={EX_FILL.neutralTile}
                  stroke={EX_HEX.ink4}
                />
              ))}
              {linked && (
                <rect
                  x={wallet.at + 1}
                  y={y0 - bandH}
                  width={wallet.cards * tile - 2}
                  height={bandH}
                  fill={`url(#${hatchId})`}
                />
              )}
              <Label
                x={labelX}
                y={y0 + tileH + 20}
                anchor={anchor}
                size={13}
                weight={600}
                tone="ink1"
              >
                {wallet.name}
              </Label>
              <Label x={labelX} y={y0 + tileH + 36} anchor={anchor}>
                {kt(locale, "explained.kit.identity.cards", {
                  count: formatCount(locale, wallet.cards),
                })}
              </Label>
            </g>
          );
        })}
        {(tiny ? title.split(" · ") : [title]).map((line, index) => (
          <Label
            key={line}
            x={width - 12}
            y={22 + index * 18}
            anchor="end"
            size={14}
            weight={600}
            tone={linked ? "you" : "ink2"}
          >
            {line}
          </Label>
        ))}
        {linked && !narrow && (
          <Label x={14} y={22}>
            {kt(locale, "explained.kit.identity.band", {
              factor: formatCount(locale, bandFactor),
            })}
          </Label>
        )}
      </SvgFrame>
    </div>
  );
}
