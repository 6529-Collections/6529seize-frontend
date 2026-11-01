"use client";

import type { ReactNode } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import AreaTile from "@/components/explained/figures/AreaTile";
import { kt } from "@/components/explained/i18n";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg, Slider } from "@/components/explained/lens/controls";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import Tag from "@/components/explained/marks/Tag";
import ArtCard from "@/components/explained/things/ArtCard";
import CardPicker from "@/components/explained/things/CardPicker";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import {
  factFromSnapshot,
  type FactId,
  type FactSnapshot,
} from "@/lib/explained/facts";
import { formatCents, formatCount } from "@/lib/explained/format";
import { orich, ot } from "./copy";

/**
 * The machine (TDH-DESIGN.md §5.1): one copy of a real card, as an area.
 * Whole days held, times the card's rate, times one boost, is the copy's
 * TDH, computed by the TDH v1.4 engine on the real editions; the area
 * draws it. Break it: sell it, and the days leave with the copy. A compact
 * lens: the hero has no room for a lens head, so the page's lede is its
 * question.
 */
export interface MachineCard {
  readonly id: number;
  /** The card's name on 6529.io; null for the newest card, still minting. */
  readonly title: string | null;
  /** The scaled art; null draws the card's frame with its number. */
  readonly art: string | null;
  /** The original image, tried when the scaled one does not load. */
  readonly original?: string;
}

const DEFAULT_DAYS = 100;
const MAX_DAYS = 1600;
const BOLD = "tw-font-semibold tw-text-iron-50";

interface MachineFacts {
  readonly h: number;
  /** No boost, one Gradient, one full set: the boost in cents. */
  readonly betas: readonly [number, number, number];
  readonly reference: { readonly copies: number; readonly rateCents: number };
  readonly threshold: number;
  readonly editions: ReadonlyMap<number, { edition: number; minted: number }>;
}

/** The facts the machine computes with, or null when a source is down. */
function machineFacts(
  snapshot: FactSnapshot,
  cards: readonly MachineCard[]
): MachineFacts | null {
  const num = (id: FactId) => factFromSnapshot<number>(snapshot, id)?.value;
  const h = num("engine.H");
  const gradient = num("engine.boost.oneGradient");
  const fullSet = num("engine.boost.fullSet");
  const rate310 = num("engine.rate.310");
  const floorCap = num("rules.editionFloorCap");
  const threshold = num("rules.editionThreshold");
  const editions = new Map<number, { edition: number; minted: number }>();
  for (const card of cards) {
    const edition = num(`meme.${card.id}.edition` as FactId);
    const minted = num(`meme.${card.id}.minted` as FactId);
    if (edition === undefined || minted === undefined) return null;
    editions.set(card.id, { edition, minted });
  }
  if (
    h === undefined ||
    gradient === undefined ||
    fullSet === undefined ||
    rate310 === undefined ||
    floorCap === undefined ||
    threshold === undefined
  ) {
    return null;
  }
  return {
    h,
    betas: [100, Math.round(gradient * 100), Math.round(fullSet * 100)],
    reference: { copies: floorCap, rateCents: Math.round(rate310 * 100) },
    threshold,
    editions,
  };
}

function Factor({
  label,
  why,
  value,
  result = false,
  children,
}: {
  readonly label: string;
  readonly why?: ReactNode;
  readonly value: ReactNode;
  readonly result?: boolean;
  readonly children?: ReactNode;
}) {
  const frame = result
    ? "tw-pt-3.5"
    : "tw-border-0 tw-border-b tw-border-solid tw-border-iron-900";
  const size = result
    ? "tw-text-[34px] tw-leading-[38px] tw-text-primary-300 md:tw-text-[44px] md:tw-leading-[48px]"
    : "tw-text-[26px] tw-leading-[30px] tw-text-iron-50 md:tw-text-[32px] md:tw-leading-9";
  return (
    <div
      className={`tw-grid tw-grid-cols-[minmax(0,1fr)_auto] tw-items-end tw-gap-x-3 tw-gap-y-1 tw-py-2 ${frame}`}
    >
      <span className="tw-text-[13px] tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400">
        {label}
      </span>
      <span
        className={`tw-col-start-2 tw-row-span-2 tw-row-start-1 tw-text-right tw-font-semibold tw-tabular-nums tw-tracking-[-0.02em] ${size}`}
        {...(result ? { "aria-live": "polite" as const } : {})}
      >
        {value}
      </span>
      {why !== undefined && (
        <span className="tw-col-start-1 tw-text-[13px] tw-leading-[18px] tw-text-iron-400 md:tw-text-sm md:tw-leading-5">
          {why}
        </span>
      )}
      {children !== undefined && (
        <div className="tw-col-span-2">{children}</div>
      )}
    </div>
  );
}

function boostWhy(
  locale: SupportedLocale,
  beta: number,
  betas: MachineFacts["betas"]
): string {
  if (beta === betas[1]) return ot(locale, "machine.boostGradient");
  if (beta === betas[2]) return ot(locale, "machine.boostSet");
  return ot(locale, "machine.boostNone");
}

/** The card's name, alt text and copies line, as the page prints them. */
function cardWords(
  locale: SupportedLocale,
  card: MachineCard,
  counts: { readonly edition: number; readonly minted: number },
  minting: boolean
) {
  const still = card.title === null;
  const name = still
    ? ot(locale, "machine.cardMinting", { id: card.id })
    : ot(locale, "machine.cardName", { id: card.id, title: card.title });
  const alt = still
    ? ot(locale, "machine.altMinting", { id: card.id })
    : ot(locale, "machine.alt", { id: card.id, title: card.title });
  const copies = minting
    ? ot(locale, "machine.copiesMinting", {
        minted: formatCount(locale, counts.minted),
        edition: formatCount(locale, counts.edition),
      })
    : ot(locale, "machine.copies", {
        copies: formatCount(locale, counts.edition),
      });
  return { name, alt, copies };
}

function MachineArt({
  card,
  cards,
  alt,
  value,
  onPick,
  locale,
}: {
  readonly card: MachineCard;
  readonly cards: readonly MachineCard[];
  readonly alt: string;
  readonly value: string;
  readonly onPick: (id: string) => void;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="max-[359px]:tw-w-24 md:tw-row-span-2">
      <ArtCard
        key={card.id}
        src={card.art}
        fallbackSrc={card.original ?? null}
        alt={alt}
        number={`#${card.id}`}
        sizes="(max-width: 768px) 96px, 150px"
        priority
      />
      <CardPicker
        label={ot(locale, "machine.pick")}
        value={value}
        onChange={onPick}
        cards={cards.map((entry) => ({
          id: String(entry.id),
          thumb: entry.art,
          name:
            entry.title === null
              ? ot(locale, "machine.pickMinting", { id: entry.id })
              : ot(locale, "machine.pickName", { id: entry.id }),
          short: String(entry.id),
        }))}
      />
    </div>
  );
}

export default function Machine({
  cards,
  locale,
}: {
  readonly cards: readonly MachineCard[];
  readonly locale: SupportedLocale;
}) {
  const facts = machineFacts(useFactSnapshot(), cards);
  const model = useBreakable(
    { card: String(cards[0]?.id ?? ""), days: DEFAULT_DAYS, beta: 100 },
    (state) => ({ ...state, days: 0 })
  );
  const card = cards.find((entry) => String(entry.id) === model.state.card);
  if (facts === null || card === undefined) {
    return (
      <div
        className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-[22px] tw-text-iron-400"
        data-lens="machine"
      >
        {kt(locale, "explained.kit.facts.unavailable")}
      </div>
    );
  }
  const { days, beta } = model.state;
  const counts = facts.editions.get(card.id) ?? { edition: 0, minted: 0 };
  const words = cardWords(
    locale,
    card,
    counts,
    counts.minted < facts.threshold
  );
  const rate = ENGINE.rateCents(facts.h, counts.edition);
  const tdhAt = (held: number) =>
    ENGINE.finalTdh(ENGINE.baseTdh(rate, held), beta);
  const final = tdhAt(days);
  const say = model.broken
    ? orich(locale, "machine.sold", {
        sold: <b className={BOLD}>{ot(locale, "machine.soldWord")}</b>,
      })
    : orich(locale, "machine.tomorrow", {
        n: (
          <b className={BOLD}>{formatCount(locale, tdhAt(days + 1) - final)}</b>
        ),
      });

  return (
    <section
      className={`tw-min-w-0 tw-rounded-2xl tw-border tw-border-solid tw-bg-iron-950 tw-p-4 md:tw-p-[22px] ${model.broken ? "tw-border-error/45" : "tw-border-iron-900"}`}
      data-lens="machine"
      data-broken={model.broken ? "1" : "0"}
      aria-label={ot(locale, "machine.label")}
    >
      <div className="tw-grid tw-grid-cols-[96px_minmax(0,1fr)] tw-gap-x-3.5 tw-gap-y-1 max-[359px]:tw-grid-cols-1 md:tw-grid-cols-[150px_minmax(0,1fr)] md:tw-gap-x-[22px]">
        <MachineArt
          card={card}
          cards={cards}
          alt={words.alt}
          value={model.state.card}
          onPick={(id) => model.set({ card: id })}
          locale={locale}
        />
        <p className="tw-m-0 tw-self-start tw-text-sm tw-leading-5 tw-text-iron-400">
          <b className={`tw-block ${BOLD}`}>{words.name}</b>
          {words.copies}
        </p>
        <div className="tw-col-span-2 tw-mt-2 max-[359px]:tw-col-span-1 md:tw-col-span-1 md:tw-col-start-2 md:tw-mt-0">
          <Factor
            label={ot(locale, "machine.days")}
            value={formatCount(locale, days)}
          >
            <Slider
              label={ot(locale, "machine.days")}
              value={days}
              min={0}
              max={MAX_DAYS}
              attr="days"
              valueText={ot(locale, "machine.daysValue", {
                days: formatCount(locale, days),
              })}
              onChange={(value) => model.set({ days: value })}
            />
          </Factor>
          <Factor
            label={ot(locale, "machine.rate")}
            why={ot(locale, "machine.rateWhy", {
              h: formatCount(locale, facts.h),
              edition: formatCount(locale, counts.edition),
            })}
            value={formatCents(locale, rate / 100)}
          />
          <Factor
            label={ot(locale, "machine.boost")}
            why={boostWhy(locale, beta, facts.betas)}
            value={formatCents(locale, beta / 100)}
          />
          <Factor
            label={ot(locale, "machine.tdh")}
            value={formatCount(locale, final)}
            result
          />
        </div>
      </div>
      <div className="tw-mt-[18px]">
        <AreaTile
          days={days}
          rateCents={rate}
          betaCents={beta}
          tdh={final}
          locale={locale}
          reference={facts.reference}
          hatchId="ex-machine-band"
          {...(model.broken && model.saved
            ? { lostDays: model.saved.days }
            : {})}
        />
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-4 tw-gap-y-1">
        <p
          className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300"
          aria-live="polite"
        >
          {say}
        </p>
        <Tag kind="example" locale={locale}>
          {ot(locale, "machine.exampleTag")}
        </Tag>
      </div>
      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3.5 tw-gap-y-2.5">
        <Seg
          label={ot(locale, "machine.boostGroup")}
          attr="beta"
          phone="wrap"
          value={String(beta)}
          onChange={(value) => model.set({ beta: Number(value) })}
          options={[
            {
              value: String(facts.betas[0]),
              label: ot(locale, "machine.noBoost"),
            },
            {
              value: String(facts.betas[1]),
              label: ot(locale, "machine.plusGradient"),
            },
            {
              value: String(facts.betas[2]),
              label: ot(locale, "machine.plusSet"),
            },
          ]}
        />
        <BreakIt
          id="sell"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(locale, ot(locale, "machine.breakEdge"))}
        />
      </div>
    </section>
  );
}
