import { EX_TEXT } from "@/components/explained/tokens";
import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount } from "@/lib/explained/format";
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
 * so their labels reflow; the bands are shapes only.
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
    fill: "rgba(206, 207, 212, 0.86)",
    band: "rgba(206, 207, 212, 0.4)",
    ink: "tw-text-[#0D0D0F]",
  },
  next: {
    fill: "rgba(206, 207, 212, 0.6)",
    band: "rgba(206, 207, 212, 0.26)",
    ink: "tw-text-[#0D0D0F]",
  },
  next2: {
    fill: "rgba(206, 207, 212, 0.34)",
    band: "rgba(206, 207, 212, 0.15)",
    ink: "tw-text-iron-50",
  },
  rest: {
    fill: "repeating-linear-gradient(45deg, rgba(206, 207, 212, 0.26) 0 3px, rgba(206, 207, 212, 0.08) 3px 8px)",
    band: "rgba(206, 207, 212, 0.05)",
    ink: "tw-text-iron-50",
  },
};

/** A share below this is too narrow to carry its label inside the bar. */
const LABEL_MIN_SHARE = 0.08;
const BAND_HEIGHT = 56;

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
      className="tw-flex tw-h-8 tw-w-full tw-overflow-hidden tw-rounded-md"
      aria-hidden="true"
    >
      {items.map((share) => {
        const value = pick(share);
        const tone = TONES[share.group.key];
        return (
          <span
            key={share.group.key}
            className={`tw-grid tw-min-w-0 tw-place-items-center tw-border-0 tw-border-r-2 tw-border-solid tw-border-[#0D0D0F] tw-text-xs tw-font-semibold last:tw-border-r-0 ${tone.ink}`}
            style={{ width: `${value * 100}%`, background: tone.fill }}
          >
            {value >= LABEL_MIN_SHARE ? percent(locale, value) : ""}
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
      className="tw-block tw-h-14 tw-w-full"
      aria-hidden="true"
    >
      {bandShapes(items).map(({ key, top, bottom }) => (
        <polygon
          key={key}
          points={`${top[0]},0 ${top[1]},0 ${bottom[1]},${BAND_HEIGHT} ${bottom[0]},${BAND_HEIGHT}`}
          fill={TONES[key].band}
          stroke="rgba(206, 207, 212, 0.35)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
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
    <figure className="tw-m-0 tw-mt-16 md:tw-mt-24" data-fig="network">
      <span className={EX_TEXT.label}>{ot(locale, "network.label")}</span>
      <h3 className={`${EX_TEXT.h3} tw-mt-2`}>{ot(locale, "network.title")}</h3>
      <div
        className="tw-mt-6"
        role="img"
        aria-label={ot(locale, "network.aria")}
      >
        <span className={rowLabel}>{ot(locale, "network.tdhRow")}</span>
        <Bar items={items} pick={(share) => share.tdh} locale={locale} />
        <Bands items={items} />
        <Bar items={items} pick={(share) => share.people} locale={locale} />
        <span className={`${rowLabel} tw-mb-0 tw-mt-1.5`}>
          {ot(locale, "network.peopleRow")}
        </span>
      </div>
      <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-gap-y-2.5 tw-p-0 md:tw-grid-cols-2 lg:tw-grid-cols-4">
        {items.map((share) => (
          <li
            key={share.group.key}
            className="tw-grid tw-grid-cols-[14px_minmax(0,1fr)] tw-gap-x-2.5 tw-text-[15px] tw-leading-[23px] tw-text-iron-400"
          >
            <span
              className="tw-mt-[5px] tw-size-3 tw-rounded-sm"
              style={{ background: TONES[share.group.key].fill }}
              aria-hidden="true"
            />
            <span>
              <b className="tw-block tw-font-semibold tw-text-iron-50">
                {groupName(locale, share.group)}
              </b>
              {ot(locale, "network.legend", {
                tdh: percent(locale, share.tdh),
                people: percent(locale, share.people),
              })}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className={`${EX_TEXT.cap} tw-mt-5 tw-max-w-[760px]`}>
        {ot(locale, "network.caption", {
          count: formatCount(locale, top100.count),
          share: percent(locale, top100.tdh / data.total),
          sum: formatCount(locale, data.total),
        })}
      </figcaption>
    </figure>
  );
}
