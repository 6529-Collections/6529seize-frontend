"use client";

import Link from "next/link";
import { REGISTRY_V14 } from "@/components/explained/engine/tdh";
import {
  useFact,
  useFactSnapshot,
} from "@/components/explained/facts/FactsProvider";
import RateFigure from "@/components/explained/figures/RateFigure";
import BreakIt, { breakItLabel } from "@/components/explained/lens/BreakIt";
import { Seg } from "@/components/explained/lens/controls";
import Lens, { Readout, RuleValue } from "@/components/explained/lens/Lens";
import { useBreakable } from "@/components/explained/lens/useBreakable";
import StampLine from "@/components/explained/marks/StampLine";
import { EX_LINK } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { ENGINE } from "@/lib/explained/engine";
import { factFromSnapshot, type FactId } from "@/lib/explained/facts";
import type { HalfCent } from "@/lib/explained/registry/referenceFacts";
import { formatCents, formatCount } from "@/lib/explained/format";
import { rich } from "@/components/explained/rich";
import { ht } from "./copy";
import { EXAMPLE_CARD, FIRST_GM } from "./models/rates";

type Pick = "cap" | "card" | "firstgm" | "newest" | "edge";

/** P26 §8.1's rate, in the specification's own notation. */
const RATE_RULE = "rate = HALFUP(B64(B64(H ÷ E) × 100))";

function useNumber(id: FactId): number | null {
  const fact = useFact<number>(id);
  return fact ? fact.value : null;
}

/**
 * Model B: the rate and the edition floor (TDH-DESIGN.md §5.5). Each card's
 * minted count is the facts layer's (6529.io's API); its effective edition
 * and its rate are the engine's (P26 §5.2, §8.1). The Break it picks the
 * newest card, still minting, below the threshold.
 */
export default function RatesLens({
  locale,
  floorCard,
}: {
  readonly locale: SupportedLocale;
  /**
   * The newest card still below the threshold, still minting: the Break
   * it's card. Null when every card is at or above it; the Break it is then
   * a what-if one copy below the threshold, counted with the floor's cap.
   */
  readonly floorCard: number | null;
}) {
  const h = useNumber("engine.H");
  const cap = useNumber("rules.editionFloorCap");
  const threshold = useNumber("rules.editionThreshold");
  const mintedCard = useNumber(`meme.${EXAMPLE_CARD}.minted`);
  const mintedFirstGM = useNumber(`meme.${FIRST_GM}.minted`);
  const snapshot = useFactSnapshot();
  const real =
    floorCard === null
      ? null
      : {
          minted: factFromSnapshot<number>(
            snapshot,
            `meme.${floorCard}.minted`
          ),
          edition: factFromSnapshot<number>(
            snapshot,
            `meme.${floorCard}.edition`
          ),
        };
  const whatIf = real === null && threshold !== null && cap !== null;
  const mintedNewest = whatIf ? threshold - 1 : (real?.minted?.value ?? null);
  const editionNewest = whatIf
    ? ENGINE.effectiveEdition(threshold - 1, cap).edition
    : (real?.edition?.value ?? null);
  const editions = useFact<number[][]>("memes.editions");
  const halfCentFact = useFact<HalfCent>("engine.halfCent");
  const halfCent = halfCentFact?.value ?? null;
  // Break it: the copy that ends the floor. One copy below the threshold a
  // card counts at its claim limit; at the threshold the floor falls away,
  // the edition drops to the minted count and every copy's rate rises.
  const model = useBreakable<{ pick: Pick }>({ pick: "cap" }, (state) => ({
    ...state,
    pick: "edge",
  }));
  if (
    h === null ||
    cap === null ||
    threshold === null ||
    mintedCard === null ||
    mintedFirstGM === null ||
    mintedNewest === null ||
    editionNewest === null ||
    !editions
  ) {
    return (
      <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
        {ht(locale, "explained.tdh.how.model.unavailable")}
      </p>
    );
  }
  const n = (value: number) => formatCount(locale, value);
  const burned = REGISTRY_V14.firstgm_edition_adjustment;
  // FirstGM's minted count as P26 §5.2 writes it: its edition before the
  // adjustment (6529.io's API gives the edition after it).
  const minted: Record<Pick, number> = {
    cap,
    card: mintedCard,
    firstgm: mintedFirstGM - burned,
    newest: mintedNewest,
    edge: threshold,
  };
  const pick = model.state.pick;
  const floorApplied = pick === "newest" && mintedNewest < threshold;
  let E = editionNewest;
  if (pick === "firstgm") E = mintedFirstGM;
  else if (pick === "edge") E = ENGINE.effectiveEdition(threshold, cap).edition;
  else if (pick !== "newest")
    E = ENGINE.effectiveEdition(minted[pick], minted[pick]).edition;
  // The edge's "before": one copy short of the threshold, at the floor.
  const belowEdge = ENGINE.effectiveEdition(threshold - 1, cap).edition;
  const belowRate = formatCents(locale, ENGINE.rateCents(h, belowEdge) / 100);
  const cents = ENGINE.rateCents(h, E);
  const rate = formatCents(locale, cents / 100);
  const area = n(Math.round((E * cents) / 100));
  const names: Record<Pick, string> = {
    cap: ht(locale, "explained.tdh.how.rates.nameCap", { cap: n(cap) }),
    card: ht(locale, "explained.tdh.how.rates.nameCard", {
      card: EXAMPLE_CARD,
    }),
    firstgm: ht(locale, "explained.tdh.how.rates.nameFirstGM"),
    newest:
      floorCard === null
        ? ht(locale, "explained.tdh.how.rates.nameWhatIf", {
            minted: n(mintedNewest),
          })
        : ht(locale, "explained.tdh.how.rates.nameNewest", {
            card: floorCard,
          }),
    edge: ht(locale, "explained.tdh.how.rates.nameWhatIf", {
      minted: n(threshold),
    }),
  };
  const B = "tw-font-semibold tw-text-iron-50";
  const say =
    pick === "edge" ? (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.rates.sayEdgeLead", {
            threshold: n(threshold),
          })}
        </b>{" "}
        {ht(locale, "explained.tdh.how.rates.sayEdge", {
          below: n(threshold - 1),
          cap: n(belowEdge),
          threshold: n(threshold),
          E: n(E),
          before: belowRate,
          rate,
        })}
      </>
    ) : floorApplied ? (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.rates.sayFloorLead", {
            minted: n(mintedNewest),
            E: n(E),
          })}
        </b>{" "}
        {ht(locale, "explained.tdh.how.rates.sayFloor", {
          threshold: n(threshold),
          cap: n(cap),
          rate,
          E: n(E),
          area,
        })}
      </>
    ) : (
      <>
        <b className={B}>
          {ht(locale, "explained.tdh.how.rates.sayLead", { name: names[pick] })}
        </b>{" "}
        {ht(locale, "explained.tdh.how.rates.say", { rate, E: n(E), area })}
      </>
    );
  const firstGMCents = ENGINE.rateCents(h, h);
  const cardCents = ENGINE.rateCents(
    h,
    ENGINE.effectiveEdition(mintedCard, mintedCard).edition
  );

  return (
    <Lens
      id="rates"
      label={ht(locale, "explained.tdh.how.rates.label")}
      question={ht(locale, "explained.tdh.how.rates.question")}
      broken={model.broken}
      locale={locale}
      stage={
        <>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2">
            <span className="tw-text-sm tw-font-semibold tw-text-iron-400">
              {ht(locale, "explained.tdh.how.rates.with")}
            </span>
            <Seg
              label={ht(locale, "explained.tdh.how.rates.group")}
              attr="ed"
              value={pick === "edge" ? null : pick}
              onChange={(value) => model.set({ pick: value })}
              options={[
                {
                  value: "cap",
                  label: ht(locale, "explained.tdh.how.rates.optionCap", {
                    copies: n(cap),
                  }),
                },
                {
                  value: "card",
                  label: ht(locale, "explained.tdh.how.rates.optionCard", {
                    copies: n(mintedCard),
                    card: EXAMPLE_CARD,
                  }),
                },
                {
                  value: "firstgm",
                  label: ht(locale, "explained.tdh.how.rates.optionFirstGM", {
                    copies: n(mintedFirstGM),
                  }),
                },
                {
                  value: "newest",
                  label:
                    floorCard === null
                      ? ht(locale, "explained.tdh.how.rates.optionWhatIf", {
                          minted: n(mintedNewest),
                        })
                      : ht(locale, "explained.tdh.how.rates.optionNewest", {
                          minted: n(mintedNewest),
                          card: floorCard,
                        }),
                },
              ]}
            />
          </div>
          <div className="tw-mt-4">
            <RateFigure
              h={h}
              threshold={threshold}
              lockedRef="D89"
              references={[
                {
                  copies: h,
                  rateCents: firstGMCents,
                  label: ht(locale, "explained.tdh.how.rates.refFirstGM"),
                },
                {
                  copies: ENGINE.effectiveEdition(mintedCard, mintedCard)
                    .edition,
                  rateCents: cardCents,
                  label: ht(locale, "explained.tdh.how.rates.refCard", {
                    card: EXAMPLE_CARD,
                  }),
                },
              ]}
              selected={{ copies: E, rateCents: cents }}
              rug={editions.value.map((row) => row[3] ?? 0)}
              locale={locale}
            />
          </div>
        </>
      }
      rule={{
        lines: [
          {
            text: rich(locale, "explained.tdh.how.rates.ruleMinted", {
              minted: <RuleValue>{n(minted[pick])}</RuleValue>,
            }),
          },
          {
            on: floorApplied,
            text: rich(locale, "explained.tdh.how.rates.ruleFloor", {
              floor: (
                <RuleValue>
                  {floorApplied
                    ? ht(locale, "explained.tdh.how.rates.ruleFloorApplied", {
                        cap: n(cap),
                        E: n(E),
                      })
                    : ht(locale, "explained.tdh.how.rates.ruleFloorNone", {
                        zero: n(0),
                        threshold: n(threshold),
                      })}
                </RuleValue>
              ),
            }),
          },
          {
            text: rich(locale, "explained.tdh.how.rates.ruleE", {
              E: <RuleValue>{n(E)}</RuleValue>,
            }),
            on: true,
          },
          {
            text: ht(locale, "explained.tdh.how.rates.ruleAdj", {
              adj: n(pick === "firstgm" ? burned : 0),
              burned: n(-burned),
            }),
            on: pick === "firstgm",
          },
          {
            text: ht(locale, "explained.tdh.how.rates.ruleH", {
              H: n(h),
              gross: n(h - burned),
              burned: n(-burned),
            }),
          },
          {
            // P26 §8.1's notation, as the specification writes it.
            text: RATE_RULE,
            on: true,
          },
          {
            text: rich(locale, "explained.tdh.how.rates.ruleCents", {
              cents: <RuleValue>{n(cents)}</RuleValue>,
            }),
          },
          ...(halfCent === null
            ? []
            : [
                {
                  // P26 §8.1's half-cent trap, on today's H: where H ÷ E is
                  // an exact half cent, the two roundings can round down.
                  text: ht(locale, "explained.tdh.how.rates.ruleHalfCent", {
                    E: n(halfCent.example),
                    rate: n(halfCent.rate),
                    halfUp: n(halfCent.halfUp),
                  }),
                },
              ]),
        ],
        source: rich(locale, "explained.tdh.how.rates.ruleSource", {
          threshold: n(threshold),
          link: (
            <Link className={EX_LINK} href="/network/tdh/specification#s8">
              {ht(locale, "explained.tdh.how.rates.ruleLink")}
            </Link>
          ),
        }),
      }}
      readout={
        <Readout
          big={<span data-o="rate">{rate}</span>}
          unit={ht(locale, "explained.tdh.how.rates.unit")}
          say={say}
        />
      }
      breakIt={
        <BreakIt
          id="floor"
          pressed={model.broken}
          onToggle={model.toggleBreak}
          label={breakItLabel(
            locale,
            ht(locale, "explained.tdh.how.rates.break", {
              threshold: n(threshold),
            })
          )}
        />
      }
      stamp={
        <StampLine
          locale={locale}
          marks={[
            {
              kind: "absolute",
              refText: `${n(threshold)}, D89`,
            },
          ]}
          tag={
            model.broken || (pick === "newest" && whatIf)
              ? {
                  kind: "whatIf",
                  text: ht(locale, "explained.tdh.how.rates.tagWhatIf"),
                }
              : {
                  kind: "real",
                  text: ht(locale, "explained.tdh.how.rates.tag"),
                }
          }
        />
      }
    />
  );
}
