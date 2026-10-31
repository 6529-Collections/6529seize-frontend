import {
  IdentityHull,
  Label,
  SvgFrame,
} from "@/components/explained/figures/svg";
import { EX_HEX } from "@/components/explained/tokens";
import { formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "@/components/explained/i18n";
import { wt } from "./copy";
import { walletCase } from "./walletPresets";

/**
 * The usual cause of a move that restarted at zero: A–B and B–C linked, A–C
 * not. Grouped by the TDH v1.4 engine ("one pair missing"), drawn small,
 * three wallets in a row, the identity's boundary around the ones that
 * count together and a dashed wallet that counts alone.
 */
const WIDTH = 236;
const HEIGHT = 112;
const Y = 56;
const X: Record<string, number> = { A: 38, B: 118, C: 196 };

export default function PairPicture({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const found = walletCase("missing");
  const parts = found.groups.map((group) => group.join(" + "));
  if (found.alone.length > 0) {
    parts.push(
      kt(locale, "explained.kit.wallets.alone", {
        wallets: formatList(locale, [...found.alone]),
      })
    );
  }
  return (
    <SvgFrame
      width={WIDTH}
      height={HEIGHT}
      label={wt(locale, "explained.tdh.wallets.why.movedAria", {
        groups: parts.join("; "),
      })}
    >
      {found.groups.map((group) => (
        <IdentityHull
          key={group.join("")}
          pad={30}
          points={group.map((letter) => [X[letter] ?? 0, Y] as const)}
        />
      ))}
      {found.links.map((link) => (
        <line
          key={`${link.a}${link.b}`}
          x1={X[link.a] ?? 0}
          y1={Y}
          x2={X[link.b] ?? 0}
          y2={Y}
          stroke={EX_HEX.ink3}
          strokeWidth={2}
        />
      ))}
      {found.wallets.map((letter) => {
        const alone = found.alone.includes(letter);
        return (
          <g key={letter}>
            <circle
              cx={X[letter] ?? 0}
              cy={Y}
              r={18}
              fill={EX_HEX.panel}
              stroke={alone ? EX_HEX.ink2 : EX_HEX.ink1}
              strokeWidth={2}
              strokeDasharray={alone ? "4 3" : undefined}
            />
            <Label
              x={X[letter] ?? 0}
              y={Y + 5}
              anchor="middle"
              size={15}
              weight={700}
              tone="ink1"
            >
              {letter}
            </Label>
          </g>
        );
      })}
    </SvgFrame>
  );
}
