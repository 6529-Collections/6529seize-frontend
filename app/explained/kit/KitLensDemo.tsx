"use client";

import type { SupportedLocale } from "@/i18n/locales";
import AreaTile from "@/components/explained/figures/AreaTile";
import { useFact } from "@/components/explained/facts/FactsProvider";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import Clock, { dateOfCycle } from "@/components/explained/lens/Clock";
import { Seg, Slider, Stepper } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import Predict from "@/components/explained/lens/Predict";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import {
  World,
  useWorld,
  type WorldState,
} from "@/components/explained/lens/World";
import StampLine from "@/components/explained/marks/StampLine";
import ArtCard from "@/components/explained/things/ArtCard";
import CardPicker from "@/components/explained/things/CardPicker";
import { ENGINE } from "@/lib/explained/engine";
import type { FactId } from "@/lib/explained/facts";
import {
  formatCents,
  formatCount,
  formatUtcLongDay,
} from "@/lib/explained/format";
import { KIT_ART } from "./kitExamples";

/**
 * The lens framework in the gallery: a World with one clock and two linked
 * views, and a full model (the overview's machine) with its controls, the
 * exact rule, the readout, Break it and the stamp line. Every number is the
 * engine's, on the fixture facts.
 */
type CardId = "2" | "4" | "3" | "562";

function useNumber(id: FactId): number {
  const fact = useFact<number>(id);
  if (!fact) throw new Error(`${id} is unavailable in the gallery`);
  return fact.value;
}

function MachineLens({ locale }: { readonly locale: SupportedLocale }) {
  const h = useNumber("engine.H");
  const editions: Record<CardId, number> = {
    "2": useNumber("meme.2.edition"),
    "4": useNumber("meme.4.edition"),
    "3": useNumber("meme.3.edition"),
    "562": useNumber("meme.562.edition"),
  };
  const minted562 = useNumber("meme.562.minted");
  const oneGradient = Math.round(useNumber("engine.boost.oneGradient") * 100);
  const fullSet = Math.round(useNumber("engine.boost.fullSet") * 100);
  const rate310 = Math.round(useNumber("engine.rate.310") * 100);
  const model = useBreakable(
    { card: "2" as CardId, days: 100, beta: 100 },
    (state) => ({ ...state, days: 0 })
  );
  const { card, days, beta } = model.state;
  const edition = editions[card];
  const rate = ENGINE.rateCents(h, edition);
  const final = ENGINE.finalTdh(ENGINE.baseTdh(rate, days), beta);
  const tomorrow =
    ENGINE.finalTdh(ENGINE.baseTdh(rate, days + 1), beta) - final;
  const art = card === "562" ? null : KIT_ART[card];
  const artLine = art ? `${art.name} · ${art.title}` : "";
  const say = model.broken ? (
    <>
      <b className="tw-font-semibold tw-text-iron-50">Sold.</b> The days leave
      with the copy: the buyer starts at zero, and its first whole day counts a
      day after it arrives.
    </>
  ) : (
    <>
      Tomorrow&apos;s result adds{" "}
      <b className="tw-font-semibold tw-text-iron-50">
        {formatCount(locale, tomorrow)}
      </b>
      .
    </>
  );
  return (
    <Lens
      id="kit-area"
      label="One copy, as an area"
      question="What does one copy add, and why?"
      broken={model.broken}
      locale={locale}
      stage={
        <div className="tw-grid tw-grid-cols-[96px_minmax(0,1fr)] tw-gap-3.5 md:tw-grid-cols-[150px_minmax(0,1fr)] md:tw-gap-[22px]">
          <div>
            <ArtCard
              src={art?.src ?? null}
              alt={
                art ? `${art.name}, ${art.title}` : "Meme #562, still minting"
              }
              number={`#${card}`}
              priority
            />
            <CardPicker
              label="Pick a card"
              value={card}
              onChange={(id) => model.set({ card: id as CardId })}
              cards={[
                {
                  id: "2",
                  thumb: KIT_ART["2"].src,
                  name: KIT_ART["2"].name,
                  short: "2",
                },
                {
                  id: "4",
                  thumb: KIT_ART["4"].src,
                  name: KIT_ART["4"].name,
                  short: "4",
                },
                {
                  id: "3",
                  thumb: KIT_ART["3"].src,
                  name: KIT_ART["3"].name,
                  short: "3",
                },
                {
                  id: "562",
                  thumb: null,
                  name: "Meme #562, still minting",
                  short: "562",
                },
              ]}
            />
          </div>
          <div className="tw-min-w-0">
            <p className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400">
              <b className="tw-block tw-font-semibold tw-text-iron-50">
                {card === "562" ? "Meme #562 · still minting" : artLine}
              </b>
              {card === "562"
                ? `${formatCount(locale, minted562)} minted so far · counts as ${formatCount(locale, edition)} · CC0`
                : `${formatCount(locale, edition)} copies · CC0`}
            </p>
            <div className="tw-mt-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-pb-2">
              <span className="tw-text-[13px] tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400">
                Whole days held
              </span>
              <span className="tw-float-right tw-text-[26px] tw-font-semibold tw-leading-[30px] tw-text-iron-50 md:tw-text-[32px] md:tw-leading-9">
                {formatCount(locale, model.broken ? 0 : days)}
              </span>
              <Slider
                label="Whole days held"
                value={days}
                min={0}
                max={1600}
                attr="days"
                valueText={`${formatCount(locale, days)} whole days`}
                onChange={(value) => model.set({ days: value })}
              />
            </div>
            <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-5 tw-text-iron-400">
              × Rate{" "}
              <b className="tw-font-semibold tw-text-iron-50">
                {formatCents(locale, rate / 100)}
              </b>{" "}
              · {formatCount(locale, h)} ÷ {formatCount(locale, edition)} copies
            </p>
            <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400">
              × Boost{" "}
              <b className="tw-font-semibold tw-text-iron-50">
                {formatCents(locale, beta / 100)}
              </b>
            </p>
          </div>
          <div className="tw-col-span-2">
            <AreaTile
              days={model.broken ? 0 : days}
              rateCents={rate}
              betaCents={beta}
              tdh={final}
              locale={locale}
              reference={{ copies: 310, rateCents: rate310 }}
              hatchId="kit-machine-band"
            />
            <div className="tw-mt-3">
              <Seg
                label="Boost"
                attr="beta"
                value={String(beta)}
                onChange={(value) => model.set({ beta: Number(value) })}
                options={[
                  { value: "100", label: "No boost" },
                  { value: String(oneGradient), label: "+ a Gradient" },
                  { value: String(fullSet), label: "+ a full set" },
                ]}
              />
            </div>
          </div>
        </div>
      }
      rule={{
        lines: [
          {
            text: (
              <>
                days ={" "}
                <RuleValue>
                  {formatCount(locale, model.broken ? 0 : days)}
                </RuleValue>
              </>
            ),
          },
          {
            text: (
              <>
                rate = RATE(H, E) ={" "}
                <RuleValue>{formatCount(locale, rate)}</RuleValue> cents
              </>
            ),
            on: true,
          },
          { text: <>base = BASE(rate, days)</> },
          {
            text: (
              <>
                TDH = FINAL(base, β) ={" "}
                <RuleValue>{formatCount(locale, final)}</RuleValue>
              </>
            ),
            on: true,
          },
        ],
        source: "P26 §8.1, §8.2, §8.4",
      }}
      readout={
        <Readout big={formatCount(locale, final)} unit="TDH" say={say} />
      }
      breakIt={
        <BreakIt
          id="sell"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(locale, "sell it")}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            { maturity: "live", label: "Live rule", refText: "TDH v1.4" },
          ]}
          tag={{ kind: "example", text: "Example copy" }}
        />
      }
    />
  );
}

function LinkedViews({ locale }: { readonly locale: SupportedLocale }) {
  const { state } = useWorld();
  const h = useNumber("engine.H");
  const arrived = 20_740;
  const days = Math.max(0, state.cycle - arrived);
  const cards = [
    { name: "Meme #4", edition: useNumber("meme.4.edition") },
    { name: "Meme #2", edition: useNumber("meme.2.edition") },
  ];
  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
      {cards.map((card) => {
        const rate = ENGINE.rateCents(h, card.edition);
        const tdh = ENGINE.finalTdh(ENGINE.baseTdh(rate, days), 100);
        return (
          <div
            key={card.name}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
            data-linked-view={card.name}
          >
            <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              <b className="tw-font-semibold tw-text-iron-50">{card.name}</b>,
              bought the day before{" "}
              {formatUtcLongDay(locale, dateOfCycle(arrived))}:{" "}
              {formatCount(locale, days)} whole days, {formatCount(locale, tdh)}{" "}
              TDH
            </p>
            <AreaTile
              days={days}
              rateCents={rate}
              betaCents={100}
              tdh={tdh}
              locale={locale}
              hatchId={`kit-linked-${card.name.slice(-1)}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function KitLensDemo({
  locale,
  openCycle,
  firstCycle,
}: {
  readonly locale: SupportedLocale;
  readonly openCycle: number;
  readonly firstCycle: number;
}) {
  const initial: WorldState = { cycle: openCycle - 1 };
  return (
    <div className="tw-grid tw-gap-10">
      <World initial={initial}>
        <Clock id="kit" min={firstCycle} max={openCycle - 1} locale={locale} />
        <LinkedViews locale={locale} />
      </World>
      <MachineLens locale={locale} />
      <Predict
        id="kit"
        locale={locale}
        question="a copy arrives at 23:59 UTC on Oct 17. Which result counts its first whole day?"
        options={[
          { label: "Oct 18", right: false },
          { label: "Oct 19", right: true },
          { label: "Oct 20", right: false },
        ]}
        answer="The snapshot of Oct 18 finds one minute; the snapshot of Oct 19 finds 24 hours and one minute."
      />
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-6">
        <KitStepper locale={locale} />
      </div>
    </div>
  );
}

function KitStepper({ locale }: { readonly locale: SupportedLocale }) {
  const { state, set, broken, toggleBreak } = useBreakable(
    { grads: 1 },
    () => ({ grads: 6 })
  );
  return (
    <>
      <Stepper
        label="Gradients"
        value={state.grads}
        min={0}
        max={6}
        onChange={(grads) => set({ grads })}
        locale={locale}
        attr="grads"
      />
      <BreakIt
        id="grad6"
        pressed={broken}
        onToggle={toggleBreak}
        label={breakItLabel(locale, "add a sixth Gradient")}
      />
    </>
  );
}
