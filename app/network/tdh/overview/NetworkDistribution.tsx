import { EX_TEXT } from "@/components/explained/tokens";
import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import {
  formatCount,
  formatUtcClock,
  formatUtcDay,
} from "@/lib/explained/format";
import { ot } from "./copy";
import type {
  NetworkDistribution as Distribution,
  RankGroup,
} from "./networkDistribution.server";

/**
 * Everyone's TDH as one area (EXPLAINED.md §4.1, the network step of the
 * zoom): the top bar splits today's TDH by rank group, the bottom bar
 * splits the identities the same way, and a band joins each group's two
 * shares, so the concentration is drawn, not described. The bars are HTML
 * so their labels reflow; the bands are shapes only. The table under it is
 * the figure's text: every share in words.
 */
interface Tone {
  readonly fill: string;
  /** The band from its share of TDH to its share of identities. */
  readonly band: string;
  /** Text on the fill: dark on the light greys, light on the dark ones. */
  readonly ink: string;
}

const TONES: Record<RankGroup["key"], Tone> = {
  top: {
    fill: "rgba(206, 207, 212, 0.9)",
    band: "rgba(206, 207, 212, 0.42)",
    ink: "tw-text-[#0D0D0F]",
  },
  next: {
    fill: "rgba(206, 207, 212, 0.62)",
    band: "rgba(206, 207, 212, 0.28)",
    ink: "tw-text-[#0D0D0F]",
  },
  next2: {
    fill: "rgba(206, 207, 212, 0.36)",
    band: "rgba(206, 207, 212, 0.17)",
    ink: "tw-text-iron-50",
  },
  rest: {
    fill: "repeating-linear-gradient(45deg, rgba(206, 207, 212, 0.3) 0 3px, rgba(206, 207, 212, 0.1) 3px 8px)",
    band: "rgba(206, 207, 212, 0.09)",
    ink: "tw-text-iron-50",
  },
};

/**
 * A share below this is too narrow to carry its label inside the bar: on a
 * phone the bar is about 350 px wide, from a tablet up twice that.
 */
const LABEL_MIN_SHARE = 0.08;
const LABEL_MIN_SHARE_PHONE = 0.15;

function labelClass(share: number): string | null {
  if (share < LABEL_MIN_SHARE) return null;
  return share < LABEL_MIN_SHARE_PHONE ? "tw-hidden md:tw-inline" : "";
}
const BAND_HEIGHT = 80;

function percent(locale: SupportedLocale, share: number): string {
  return formatNumber(locale, share, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function groupName(locale: SupportedLocale, group: RankGroup): string {
  const count = formatCount(locale, group.count);
  if (group.key === "top") return ot(locale, "network.top", { count });
  if (group.key === "rest") return ot(locale, "network.rest", { count });
  return ot(locale, "network.next", { count });
}

interface Share {
  readonly group: RankGroup;
  readonly tdh: number;
  readonly people: number;
}

function shares(data: Distribution): Share[] {
  return data.groups.map((group) => ({
    group,
    tdh: group.tdh / data.total,
    people: group.count / data.identities,
  }));
}

function Bar({
  items,
  pick,
  locale,
}: {
  readonly items: readonly Share[];
  readonly pick: (share: Share) => number;
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      className="tw-flex tw-h-9 tw-w-full tw-overflow-hidden tw-rounded-md"
      aria-hidden="true"
    >
      {items.map((share) => {
        const value = pick(share);
        const tone = TONES[share.group.key];
        return (
          <span
            key={share.group.key}
            className={`tw-grid tw-min-w-0 tw-place-items-center tw-border-0 tw-border-r-2 tw-border-solid tw-border-[#0D0D0F] tw-text-[13px] tw-font-semibold last:tw-border-r-0 ${tone.ink}`}
            style={{ width: `${value * 100}%`, background: tone.fill }}
          >
            {labelClass(value) === null ? null : (
              <span className={labelClass(value) ?? ""}>
                {percent(locale, value)}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

interface BandShape {
  readonly key: RankGroup["key"];
  /** Left and right, on the TDH bar and the identities bar, in thousandths. */
  readonly top: readonly [number, number];
  readonly bottom: readonly [number, number];
}

/** Where each group's band starts and ends on the two bars. */
function bandShapes(items: readonly Share[]): BandShape[] {
  return items.reduce<BandShape[]>((shapes, share) => {
    const last = shapes.at(-1);
    const tdhFrom = last ? last.top[1] : 0;
    const peopleFrom = last ? last.bottom[1] : 0;
    return [
      ...shapes,
      {
        key: share.group.key,
        top: [tdhFrom, tdhFrom + share.tdh * 1000],
        bottom: [peopleFrom, peopleFrom + share.people * 1000],
      },
    ];
  }, []);
}

/** The bands joining each group's share of TDH to its share of identities. */
function Bands({ items }: { readonly items: readonly Share[] }) {
  return (
    <svg
      viewBox={`0 0 1000 ${BAND_HEIGHT}`}
      preserveAspectRatio="none"
      className="tw-block tw-h-20 tw-w-full"
      aria-hidden="true"
    >
      {bandShapes(items).map(({ key, top, bottom }) => {
        // Each group flows as a ribbon from its share of TDH (above) to
        // its share of identities (below): curved sides, a filled body.
        const mid = BAND_HEIGHT / 2;
        const h = BAND_HEIGHT;
        const d = [
          `M${top[0]},0`,
          `L${top[1]},0`,
          `C${top[1]},${mid} ${bottom[1]},${mid} ${bottom[1]},${h}`,
          `L${bottom[0]},${h}`,
          `C${bottom[0]},${mid} ${top[0]},${mid} ${top[0]},0`,
          "Z",
        ].join(" ");
        return (
          <path
            key={key}
            d={d}
            fill={TONES[key].band}
            stroke="rgba(13, 13, 15, 0.9)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/**
 * Every share in words: a table from 640 px up; below that each group is a
 * row of its own, its two shares on one line with their labels, as the
 * design stacks numeric tables on a phone (TDH-DESIGN.md §6). The column
 * headers stay for screen readers at every width.
 */
function ShareTable({
  items,
  locale,
}: {
  readonly items: readonly Share[];
  readonly locale: SupportedLocale;
}) {
  const head = "tw-pb-2 tw-text-right tw-font-semibold";
  const cell =
    "tw-tabular-nums max-sm:tw-inline sm:tw-border-0 sm:tw-border-t sm:tw-border-solid sm:tw-border-iron-900 sm:tw-py-1.5 sm:tw-text-right";
  const inlineLabel =
    "tw-mr-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400 sm:tw-hidden";
  const shareCell = (label: string, value: number) => (
    <td className={cell}>
      <span className={inlineLabel} aria-hidden="true">
        {label}
      </span>
      {percent(locale, value)}
    </td>
  );
  return (
    <table className="tw-w-full tw-max-w-[560px] tw-border-collapse tw-text-[15px] tw-leading-[23px] tw-text-iron-300 max-sm:tw-block">
      <thead className="max-sm:tw-sr-only">
        <tr className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
          <th scope="col" className="tw-pb-2 tw-text-left tw-font-semibold">
            <span className="tw-sr-only">{ot(locale, "network.colGroup")}</span>
          </th>
          <th scope="col" className={head}>
            {ot(locale, "network.colTdh")}
          </th>
          <th scope="col" className={head}>
            {ot(locale, "network.colPeople")}
          </th>
        </tr>
      </thead>
      <tbody className="max-sm:tw-block">
        {items.map((share) => (
          <tr
            key={share.group.key}
            className="max-sm:tw-flex max-sm:tw-flex-wrap max-sm:tw-gap-x-4 max-sm:tw-border-0 max-sm:tw-border-t max-sm:tw-border-solid max-sm:tw-border-iron-900 max-sm:tw-py-2"
          >
            <th
              scope="row"
              className="tw-text-left tw-font-semibold tw-text-iron-50 max-sm:tw-block max-sm:tw-w-full sm:tw-whitespace-nowrap sm:tw-border-0 sm:tw-border-t sm:tw-border-solid sm:tw-border-iron-900 sm:tw-py-1.5 sm:tw-pr-3"
            >
              <span
                className="tw-mr-2.5 tw-inline-block tw-size-3 tw-rounded-sm tw-align-[-1px]"
                style={{ background: TONES[share.group.key].fill }}
                aria-hidden="true"
              />
              {groupName(locale, share.group)}
            </th>
            {shareCell(ot(locale, "network.colTdh"), share.tdh)}
            {shareCell(ot(locale, "network.colPeople"), share.people)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** When 6529.io answered, as "Oct 31, 09:12 UTC". */
function readTime(locale: SupportedLocale, readAt: string | null): string {
  if (readAt === null) {
    return ot(locale, "network.readUnknown");
  }
  return `${formatUtcDay(locale, readAt)}, ${formatUtcClock(locale, readAt)}`;
}

export default function NetworkDistribution({
  data,
  locale,
}: {
  readonly data: Distribution;
  readonly locale: SupportedLocale;
}) {
  const items = shares(data);
  const top100 = data.groups
    .filter((group) => group.key === "top" || group.key === "next")
    .reduce(
      (sum, group) => ({
        count: sum.count + group.count,
        tdh: sum.tdh + group.tdh,
      }),
      { count: 0, tdh: 0 }
    );
  const rowLabel =
    "tw-mb-1.5 tw-block tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-300";
  return (
    <figure className="tw-m-0 tw-mt-14 md:tw-mt-16" data-fig="network">
      <span className={EX_TEXT.label}>{ot(locale, "network.label")}</span>
      <h3 className={`${EX_TEXT.h3} tw-mt-2`}>{ot(locale, "network.title")}</h3>
      <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-items-center tw-gap-x-12 tw-gap-y-6 lg:tw-grid-cols-[minmax(0,1fr)_340px]">
        <div role="img" aria-label={ot(locale, "network.aria")}>
          {/* The role="img" names the figure; its labels are drawing, as an SVG's would be. */}
          <span className={rowLabel} aria-hidden="true">
            {ot(locale, "network.tdhRow")}
          </span>
          <Bar items={items} pick={(share) => share.tdh} locale={locale} />
          <Bands items={items} />
          <Bar items={items} pick={(share) => share.people} locale={locale} />
          <span className={`${rowLabel} tw-mb-0 tw-mt-1.5`} aria-hidden="true">
            {ot(locale, "network.peopleRow")}
          </span>
        </div>
        <ShareTable items={items} locale={locale} />
      </div>
      <figcaption className={`${EX_TEXT.cap} tw-mt-5 tw-max-w-[760px]`}>
        {ot(locale, "network.caption", {
          count: formatCount(locale, top100.count),
          share: percent(locale, top100.tdh / data.total),
          ranked: formatCount(locale, data.identities),
          read: readTime(locale, data.readAt),
        })}
      </figcaption>
    </figure>
  );
}
