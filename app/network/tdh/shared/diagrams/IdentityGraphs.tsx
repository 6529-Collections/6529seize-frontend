import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

/*
 * Step 10's link patterns and the identities P26 §6.3 forms from them, with
 * the four-wallet rule of D136: How it works draws all of them, and the
 * consolidation design page the two four-wallet patterns.
 */

/**
 * A link pattern of step 10: wallets at their positions, the confirmed
 * links oldest first, the identities P26 §6.3 forms from them, and which
 * links were registered both ways from the four-wallet start (D136).
 */
interface LinkGraph {
  readonly key: "row1" | "row2" | "row3" | "row4" | "row5";
  readonly wallets: Readonly<Record<string, readonly [number, number]>>;
  readonly links: readonly string[];
  readonly identities: readonly (readonly string[])[];
  /** Links registered in both directions from 2026-10-15 00:00 UTC. */
  readonly fresh?: readonly string[];
  /** Where a link's order badge sits along it, when not at its middle. */
  readonly badgeAt?: Readonly<Record<string, number>>;
  /** A note after the link order. */
  readonly note?: MessageKey;
}

const GRAPHS: readonly LinkGraph[] = [
  {
    key: "row1",
    wallets: { A: [40, 30], B: [130, 30], C: [85, 100] },
    links: ["AB", "BC", "AC"],
    identities: [["A", "B", "C"]],
  },
  {
    key: "row2",
    wallets: { A: [26, 30], B: [134, 30], C: [108, 100] },
    links: ["AB", "BC"],
    identities: [["B", "C"], ["A"]],
    note: "network.tdh.how.s10.row2.note",
  },
  {
    key: "row3",
    wallets: { A: [30, 30], B: [110, 30], C: [70, 100], D: [150, 100] },
    links: ["AB", "BC", "AC", "CD"],
    identities: [
      ["C", "D"],
      ["A", "B"],
    ],
  },
];

/**
 * The four-wallet rule (P26 §6.3, D136): four wallets with all six links,
 * the same in both patterns but for when they were registered. A, B and C
 * linked before October 15, 2026; D's three links are the newest. A sits
 * apart from B, C and D so that each identity's outline holds only its own
 * wallets.
 */
const FOUR_WALLETS: LinkGraph["wallets"] = {
  A: [18, 60],
  B: [88, 14],
  C: [152, 60],
  D: [88, 106],
};
/**
 * A-C runs across D-B: their badges sit off the crossing, A-C's near A and
 * D-B's near D, so no line runs through another link's number.
 */
const FOUR_BADGES = { AC: 0.25, DB: 0.3 } as const;
const FOUR_LINKS = ["AB", "BC", "AC", "DA", "DB", "DC"] as const;

const FOUR_WALLET_GRAPHS: readonly LinkGraph[] = [
  {
    // D's links registered both ways from the start: D is the gate's
    // member, so A joins as the fourth (vector 89's pattern).
    key: "row4",
    wallets: FOUR_WALLETS,
    links: FOUR_LINKS,
    identities: [["A", "B", "C", "D"]],
    fresh: ["DA", "DB", "DC"],
    badgeAt: FOUR_BADGES,
    note: "network.tdh.how.s10.row4.note",
  },
  {
    // Every link registered before the start: the newest, D-C, seeds the
    // group, B joins, and A fails the gate, as no wallet has fresh links
    // with all three others (vector 90's pattern).
    key: "row5",
    wallets: FOUR_WALLETS,
    links: FOUR_LINKS,
    identities: [["B", "C", "D"], ["A"]],
    badgeAt: FOUR_BADGES,
    note: "network.tdh.how.s10.row5.note",
  },
];

function IdentityGraph({ graph }: { readonly graph: LinkGraph }) {
  const position = (name: string): readonly [number, number] => {
    const point = graph.wallets[name] ?? [0, 0];
    return [point[0] + 10, point[1] + 10];
  };
  const fresh = new Set(graph.fresh ?? []);
  return (
    <svg
      viewBox="0 0 190 140"
      aria-hidden="true"
      className="tw-mx-auto tw-block tw-h-auto tw-w-full tw-max-w-[13.625rem]"
    >
      {graph.identities.map((members, index) => {
        const points = members.map(position);
        const xs = points.map((point) => point[0]);
        const ys = points.map((point) => point[1]);
        const minX = Math.min(...xs) - 26;
        const minY = Math.min(...ys) - 22;
        // The first identity in the identity blue, a second one in a second
        // tint, as the legend shows: a wallet alone is an identity too.
        const tone =
          index === 0
            ? "tw-fill-primary-500/10 tw-stroke-primary-400/70"
            : "tw-fill-teal-400/10 tw-stroke-teal-300/70";
        const [single] = points;
        if (points.length === 1 && single) {
          return (
            <circle
              key={members.join("")}
              cx={single[0]}
              cy={single[1]}
              r="21"
              className={tone}
              strokeWidth="1.5"
            />
          );
        }
        return (
          <rect
            key={members.join("")}
            x={minX}
            y={minY}
            width={Math.max(...xs) - minX + 26}
            height={Math.max(...ys) - minY + 22}
            rx="22"
            className={tone}
            strokeWidth="1.5"
          />
        );
      })}
      {graph.links.map((link) => {
        const [from, to] = [position(link[0] ?? ""), position(link[1] ?? "")];
        const inside = graph.identities.some(
          (members) =>
            members.includes(link[0] ?? "") && members.includes(link[1] ?? "")
        );
        let stroke = "tw-stroke-iron-400";
        if (fresh.has(link)) {
          stroke = "tw-stroke-success";
        } else if (inside) {
          stroke = "tw-stroke-iron-200";
        }
        return (
          <line
            key={link}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
            strokeWidth={inside ? 3 : 1.5}
            strokeDasharray={inside ? undefined : "4 3"}
            className={stroke}
          />
        );
      })}
      {graph.links.map((link, index) => {
        const [from, to] = [position(link[0] ?? ""), position(link[1] ?? "")];
        const at = graph.badgeAt?.[link] ?? 0.5;
        const mx = from[0] + (to[0] - from[0]) * at;
        const my = from[1] + (to[1] - from[1]) * at;
        return (
          <g key={`order-${link}`}>
            <circle
              cx={mx}
              cy={my}
              r="10"
              strokeWidth="1"
              className="tw-fill-iron-950 tw-stroke-primary-400/70"
            />
            <text
              x={mx}
              y={my + 4.5}
              textAnchor="middle"
              fontSize="12"
              className="tw-fill-primary-300 tw-font-semibold tw-tabular-nums"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
      {Object.keys(graph.wallets).map((name) => {
        const [cx, cy] = position(name);
        return (
          <g key={name}>
            <circle
              cx={cx}
              cy={cy}
              r="14"
              className="tw-fill-iron-900 tw-stroke-iron-300"
              strokeWidth="1.5"
            />
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              className="tw-fill-iron-50 tw-font-semibold"
              fontSize="14"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * A pattern's links in their order on chain, each with the same numbered
 * badge the drawing uses, so the caption and the figure read alike.
 */
function LinkOrder({
  locale,
  graph,
  justify,
}: {
  readonly locale: SupportedLocale;
  readonly graph: LinkGraph;
  /** Where the line sits: centred when stacked, left beside the drawing. */
  readonly justify: string;
}) {
  return (
    <p
      className={`tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-1 tw-text-[13px] tw-leading-5 tw-text-iron-300 ${justify}`}
    >
      <span className="tw-sr-only">
        {t(locale, "network.tdh.how.s10.links")}:
      </span>
      {graph.links.map((link, index) => (
        <span
          key={link}
          className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className="tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-primary-300"
          >
            {formatInteger(locale, index + 1)}
          </span>
          <span className="tw-sr-only">
            {t(locale, "network.tdh.how.s10.linkOrder", {
              n: formatInteger(locale, index + 1),
            })}
          </span>
          <span className="tw-font-medium">{`${link.slice(0, 1)}–${link.slice(1)}`}</span>
        </span>
      ))}
      {graph.note !== undefined && (
        <span className="tw-text-iron-400">{t(locale, graph.note)}</span>
      )}
    </p>
  );
}

/**
 * A card's layout: the drawing above its caption on phones, beside it from
 * `sm`, and above it again from the width where the cards stand side by
 * side (`xl` for three cards, `lg` for two). Whole class names, so Tailwind
 * finds them.
 */
const CARD_LAYOUT = {
  xl: {
    card: "sm:tw-grid-cols-[15rem_minmax(0,1fr)] xl:tw-grid-cols-1",
    text: "tw-mt-2 tw-text-center sm:tw-mt-0 sm:tw-text-left xl:tw-mt-2 xl:tw-text-center",
    justify: "tw-justify-center sm:tw-justify-start xl:tw-justify-center",
  },
  lg: {
    card: "sm:tw-grid-cols-[15rem_minmax(0,1fr)] lg:tw-grid-cols-1",
    text: "tw-mt-2 tw-text-center sm:tw-mt-0 sm:tw-text-left lg:tw-mt-2 lg:tw-text-center",
    justify: "tw-justify-center sm:tw-justify-start lg:tw-justify-center",
  },
} as const;

/** One pattern: its drawing, its links in order and the identities. */
function GraphCard({
  locale,
  graph,
  stackFrom,
}: {
  readonly locale: SupportedLocale;
  readonly graph: LinkGraph;
  /** The width from which the cards stand side by side, each stacked. */
  readonly stackFrom: keyof typeof CARD_LAYOUT;
}) {
  const layout = CARD_LAYOUT[stackFrom];
  return (
    <li
      className={`tw-grid tw-items-center tw-gap-x-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3 ${layout.card}`}
    >
      <IdentityGraph graph={graph} />
      <div className={layout.text}>
        <LinkOrder locale={locale} graph={graph} justify={layout.justify} />
        <p className="tw-m-0 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-100">
          {t(locale, `network.tdh.how.s10.${graph.key}.result` as MessageKey)}
        </p>
      </div>
    </li>
  );
}

/** The legend's swatch for a confirmed link inside an identity. */
function LinkLegend({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <>
      <span className="tw-inline-flex tw-items-center tw-gap-2">
        <span
          aria-hidden="true"
          className="tw-w-5 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-iron-200"
        />
        {t(locale, "network.tdh.how.s10.legendLink")}
      </span>
      <span className="tw-inline-flex tw-items-center tw-gap-2">
        <span
          aria-hidden="true"
          className="tw-w-5 tw-border-0 tw-border-t-2 tw-border-dashed tw-border-iron-400"
        />
        {t(locale, "network.tdh.how.s10.legendLinkBetween")}
      </span>
      <span className="tw-inline-flex tw-items-center tw-gap-2">
        <span
          aria-hidden="true"
          className="tw-h-3 tw-w-5 tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-bg-primary-500/10"
        />
        {t(locale, "network.tdh.how.s10.legendIdentity")}
      </span>
      <span className="tw-inline-flex tw-items-center tw-gap-2">
        <span
          aria-hidden="true"
          className="tw-h-3 tw-w-5 tw-rounded-full tw-border tw-border-solid tw-border-teal-300/70 tw-bg-teal-400/10"
        />
        {t(locale, "network.tdh.how.s10.legendIdentity2")}
      </span>
    </>
  );
}

/**
 * Diagram 6: three link patterns and the identities they form (step 10).
 * Each pattern is its own small figure with an HTML caption, so it stays
 * legible on a phone.
 */
export function IdentityGraphDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure className="tw-m-0 tw-mt-4">
      <p className="tw-sr-only">{t(locale, "network.tdh.how.s10.graphDesc")}</p>
      <ol className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 xl:tw-grid-cols-3">
        {GRAPHS.map((graph) => (
          <GraphCard
            key={graph.key}
            locale={locale}
            graph={graph}
            stackFrom="xl"
          />
        ))}
      </ol>
      <figcaption className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-text-sm tw-text-iron-300">
        <LinkLegend locale={locale} />
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-primary-400/70 tw-text-xs tw-font-semibold tw-text-primary-300"
          >
            1
          </span>
          {t(locale, "network.tdh.how.s10.linksNote")}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Diagram 6b: the fourth wallet (P26 §6.3, D136). The same four wallets and
 * six links twice: once with D's three links registered both ways from
 * October 15, 2026, which forms a group of four, and once with every link
 * registered before it, which fails the gate and stops at three.
 */
export function FourWalletDiagram({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <figure className="tw-m-0 tw-mt-4">
      <p className="tw-sr-only">{t(locale, "network.tdh.how.s10.fourDesc")}</p>
      <p
        aria-hidden="true"
        className="tw-m-0 tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-200"
      >
        {t(locale, "network.tdh.how.s10.fourTitle")}
      </p>
      <ol className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 lg:tw-grid-cols-2">
        {FOUR_WALLET_GRAPHS.map((graph) => (
          <GraphCard
            key={graph.key}
            locale={locale}
            graph={graph}
            stackFrom="lg"
          />
        ))}
      </ol>
      <figcaption className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-x-5 tw-gap-y-1 tw-text-sm tw-text-iron-300">
        <span className="tw-inline-flex tw-items-center tw-gap-2">
          <span
            aria-hidden="true"
            className="tw-w-5 tw-border-0 tw-border-t-[3px] tw-border-solid tw-border-success"
          />
          {t(locale, "network.tdh.how.s10.legendFresh")}
        </span>
        <LinkLegend locale={locale} />
      </figcaption>
    </figure>
  );
}
