import type { SupportedLocale } from "@/i18n/locales";
import AreaTile from "@/components/explained/figures/AreaTile";
import BoostFigure from "@/components/explained/figures/BoostFigure";
import Convergence from "@/components/explained/figures/Convergence";
import EqualAreaFigure from "@/components/explained/figures/EqualAreaFigure";
import IdentityBlock from "@/components/explained/figures/IdentityBlock";
import Lanes from "@/components/explained/figures/Lanes";
import RateFigure from "@/components/explained/figures/RateFigure";
import WalletGraph, {
  type GraphLink,
  type GraphWallet,
} from "@/components/explained/figures/WalletGraph";
import ArtCard from "@/components/explained/things/ArtCard";
import LiveNumber from "@/components/explained/things/LiveNumber";
import { ENGINE } from "@/lib/explained/engine";
import type { FactBook } from "@/lib/explained/facts";
import { exampleCopy, KIT_ART } from "./kitExamples";
import { KitSection, Row, Specimen } from "./KitSection";

/**
 * The figure primitives in their states: the area (normal, with a boost,
 * sold), every edition's equal area, an identity linked and apart, wallets
 * and their identities, the rate and the floor, the boost, the lanes and
 * convergence. Numbers from the engine on the fixture facts; the wallet
 * groups are TDH-DESIGN.md §5.9's tested results, shown as examples.
 */
const FOUR: readonly GraphWallet[] = [
  { id: "A", x: 0.22, y: 0.24 },
  { id: "B", x: 0.78, y: 0.24 },
  { id: "C", x: 0.78, y: 0.74 },
  { id: "D", x: 0.22, y: 0.74 },
];
const FIVE: readonly GraphWallet[] = [
  { id: "A", x: 0.22, y: 0.25 },
  { id: "B", x: 0.78, y: 0.25 },
  { id: "C", x: 0.78, y: 0.72 },
  { id: "D", x: 0.22, y: 0.72 },
  { id: "E", x: 0.5, y: 0.5 },
];
const OLD_THREE: readonly GraphLink[] = [
  { a: "A", b: "B", kind: "old" },
  { a: "B", b: "C", kind: "old" },
  { a: "A", b: "C", kind: "old" },
];

export function KitFigures({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const copy = exampleCopy(book, locale);
  const n = (id: Parameters<FactBook["get"]>[0]) => book.num(id);
  const h = n("engine.H");
  const rate = (edition: number) => ENGINE.rateCents(h, edition);
  const e2 = n("meme.2.edition");
  const e4 = n("meme.4.edition");
  const firstGm = n("meme.8.edition");
  const floor = n("rules.editionFloorCap");
  const rate2 = rate(e2);
  const machine = (days: number, beta: number) =>
    ENGINE.finalTdh(ENGINE.baseTdh(rate2, days), beta);
  const oneGradient = Math.round(n("engine.boost.oneGradient") * 100);
  const todayMax = n("engine.boost.todayMax");
  const ceilingCents = Math.round(n("engine.boost.ceiling") * 100);
  const seasonRate = rate(floor);
  const tile = ENGINE.baseTdh(seasonRate, 100);
  const linkedBoost = 105;
  const editions = book
    .get<number[][]>("memes.editions")
    .value.map((row) => Number(row[3]));
  const gradientBonus = n("rules.gradientBonus");
  const gradientMax = n("rules.gradientMax");
  return (
    <KitSection
      id="figures"
      title="Figure primitives"
      lede="Drawn at the width they get, labelled directly, never under 12 px. A copy's TDH is an area; one edition, one identity and the network are the same picture at other scales."
    >
      <Specimen
        name="AreaTile"
        state="#2, 100 days, no boost · with a Gradient · sold: no area"
        wide
      >
        <div className="tw-grid tw-gap-6 md:tw-grid-cols-3">
          <AreaTile
            days={100}
            rateCents={rate2}
            betaCents={100}
            tdh={machine(100, 100)}
            locale={locale}
            reference={{ copies: floor, rateCents: seasonRate }}
            hatchId="kit-area-1"
          />
          <AreaTile
            days={420}
            rateCents={rate(e4)}
            betaCents={oneGradient}
            tdh={ENGINE.finalTdh(ENGINE.baseTdh(rate(e4), 420), oneGradient)}
            locale={locale}
            hatchId="kit-area-2"
          />
          <AreaTile
            days={0}
            rateCents={rate2}
            betaCents={100}
            tdh={0}
            locale={locale}
            hatchId="kit-area-3"
          />
        </div>
      </Specimen>
      <Specimen
        name="EqualAreaFigure"
        state="four editions to scale; a row each on a phone"
        wide
      >
        <EqualAreaFigure
          locale={locale}
          items={[
            { name: "Meme #4", copies: e4, rateCents: rate(e4) },
            {
              name: "A 310-copy card",
              copies: floor,
              rateCents: seasonRate,
              you: true,
            },
            { name: "Meme #2", copies: e2, rateCents: rate2 },
            {
              name: "FirstGM, the unit",
              copies: firstGm,
              rateCents: rate(firstGm),
            },
          ]}
        />
      </Specimen>
      <Specimen name="IdentityBlock" state="linked · apart" wide>
        <div className="tw-grid tw-gap-6">
          <IdentityBlock
            wallets={[
              { name: "Wallet A", cards: 28 },
              { name: "Wallet B", cards: 4 },
            ]}
            linked
            boostCents={linkedBoost}
            tdh={32 * ENGINE.finalTdh(tile, linkedBoost)}
            locale={locale}
            hatchId="kit-id-1"
          />
          <IdentityBlock
            wallets={[
              { name: "Wallet A", cards: 28 },
              { name: "Wallet B", cards: 4 },
            ]}
            linked={false}
            boostCents={100}
            tdh={32 * tile}
            locale={locale}
            hatchId="kit-id-2"
          />
        </div>
      </Specimen>
      <Specimen
        name="WalletGraph"
        state="one pair missing · step 1, split · a fifth wallet pushes one out"
        wide
      >
        <div className="tw-grid tw-gap-6 md:tw-grid-cols-3">
          <WalletGraph
            wallets={FOUR.slice(0, 3)}
            links={OLD_THREE.slice(0, 2)}
            groups={[["B", "C"]]}
            locale={locale}
          />
          <WalletGraph
            wallets={FOUR}
            links={[...OLD_THREE, { a: "D", b: "A", kind: "fresh" }]}
            groups={[
              ["A", "D"],
              ["B", "C"],
            ]}
            locale={locale}
          />
          <WalletGraph
            wallets={FIVE}
            links={[
              { a: "A", b: "B", kind: "fresh" },
              { a: "A", b: "C", kind: "fresh" },
              { a: "A", b: "D", kind: "fresh" },
              { a: "B", b: "C", kind: "fresh" },
              { a: "B", b: "D", kind: "fresh" },
              { a: "C", b: "D", kind: "fresh" },
              { a: "E", b: "A", kind: "fresh" },
              { a: "E", b: "B", kind: "fresh" },
              { a: "E", b: "C", kind: "fresh" },
              { a: "E", b: "D", kind: "fresh" },
            ]}
            groups={[["B", "C", "D", "E"]]}
            excluded={["A"]}
            locale={locale}
          />
        </div>
      </Specimen>
      <Specimen
        name="RateFigure"
        state="a 310-copy card, or #562 at 152 minted, counted as 310 · a 1,000-copy card"
        wide
      >
        <div className="tw-grid tw-gap-6 md:tw-grid-cols-2">
          <RateFigure
            h={h}
            threshold={n("rules.editionThreshold")}
            lockedRef="D89"
            references={[
              { copies: firstGm, rateCents: rate(firstGm), label: "FirstGM" },
              { copies: e2, rateCents: rate2, label: "#2:" },
            ]}
            selected={{ copies: floor, rateCents: seasonRate }}
            rug={editions}
            locale={locale}
          />
          <RateFigure
            h={h}
            threshold={n("rules.editionThreshold")}
            lockedRef="D89"
            references={[
              { copies: firstGm, rateCents: rate(firstGm), label: "FirstGM" },
              { copies: e2, rateCents: rate2, label: "#2:" },
            ]}
            selected={{ copies: e2, rateCents: rate2 }}
            rug={editions}
            locale={locale}
          />
        </div>
      </Specimen>
      <Specimen
        name="BoostFigure"
        state="one Gradient · a sixth adds nothing · full sets and five Gradients"
        wide
      >
        <div className="tw-grid tw-gap-6">
          <BoostFigure
            parts={[{ label: "Gradients", value: gradientBonus }]}
            betaCents={oneGradient}
            todayMaxCents={Math.round(todayMax * 100)}
            ceilingCents={ceilingCents}
            locale={locale}
            hatchId="kit-boost-1"
          />
          <BoostFigure
            parts={[
              {
                label: "seasons",
                value: Number((n("engine.boost.fullSet") - 1).toFixed(2)),
              },
              {
                label: "extra sets",
                value: Number(
                  (
                    todayMax -
                    n("engine.boost.fullSet") -
                    gradientBonus * gradientMax
                  ).toFixed(3)
                ),
              },
              {
                label: "Gradients",
                value: Number((gradientBonus * gradientMax).toFixed(2)),
              },
            ]}
            betaCents={Math.round(todayMax * 100)}
            todayMaxCents={Math.round(todayMax * 100)}
            ceilingCents={ceilingCents}
            locale={locale}
            hatchId="kit-boost-2"
          />
        </div>
      </Specimen>
      <Specimen
        name="Lanes"
        state="left to right; top to bottom on a phone"
        wide
      >
        <Lanes lanes={copy.lanes} label="The day's pipeline" locale={locale} />
      </Specimen>
      <Specimen
        name="Convergence"
        state="four programs, five rounds: one leaves, then all agree"
        wide
      >
        <Convergence
          locale={locale}
          programs={[
            { id: "py", label: "Python reference" },
            { id: "rs", label: "Rust reference" },
            { id: "core", label: "Rust core" },
            { id: "b", label: "Program B" },
          ]}
          rounds={[
            { label: "Round 1", differs: ["b"] },
            { label: "Round 2", differs: ["rs"] },
            { label: "Round 3" },
            { label: "Round 4" },
            { label: "Round 5" },
          ]}
        />
      </Specimen>
      <Specimen
        name="ArtCard, LiveNumber"
        state="art · the frame when there is no art · a live number with its time"
      >
        <Row>
          <div className="tw-w-[120px]">
            <ArtCard
              src={KIT_ART["2"].src}
              alt={`${KIT_ART["2"].name}, ${KIT_ART["2"].title}`}
              number="#2"
              caption={
                <>
                  <b className="tw-block tw-font-semibold tw-text-iron-50">
                    {KIT_ART["2"].name} · {KIT_ART["2"].title}
                  </b>
                  CC0
                </>
              }
            />
          </div>
          <div className="tw-w-[120px]">
            <ArtCard
              src={null}
              alt="Meme #562, still minting"
              number="#562"
              caption="still minting"
            />
          </div>
          <LiveNumber
            fact={book.get("tdh.latest.total")}
            unit="TDH"
            locale={locale}
          />
          <LiveNumber
            fact={book.maybe("manifest.sha256")}
            locale={locale}
            size="m"
          />
        </Row>
      </Specimen>
    </KitSection>
  );
}
