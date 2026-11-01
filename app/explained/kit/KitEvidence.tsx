import type { SupportedLocale } from "@/i18n/locales";
import Link from "next/link";
import AgreementBars from "@/components/explained/evidence/AgreementBars";
import AssuranceLadder from "@/components/explained/evidence/AssuranceLadder";
import BrowserHash from "@/components/explained/evidence/BrowserHash";
import {
  AssumptionLedger,
  ClaimInParts,
  ClaimTable,
  Scoreboard,
} from "@/components/explained/evidence/claims";
import DayRibbon, {
  ribbonDays,
  type ResultDay,
} from "@/components/explained/evidence/DayRibbon";
import Equation from "@/components/explained/evidence/Equation";
import LiveStrip from "@/components/explained/evidence/LiveStrip";
import {
  DefinitionChip,
  FailureSentence,
  HonestyBox,
  IsIsNot,
  LimitNote,
} from "@/components/explained/evidence/notes";
import ProvenanceTrail from "@/components/explained/evidence/ProvenanceTrail";
import Receipt, { ReceiptNote } from "@/components/explained/evidence/Receipt";
import {
  SimulatedState,
  SimulationButton,
  SimulationSwitch,
  WhenReal,
  WhenSimulated,
} from "@/components/explained/evidence/Simulation";
import Verdict, {
  type VerdictState,
} from "@/components/explained/evidence/Verdict";
import DriftNote from "@/components/explained/marks/DriftNote";
import Hash from "@/components/explained/marks/Hash";
import Mark from "@/components/explained/marks/Mark";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_BUTTON } from "@/components/explained/tokens";
import { fmt, type FactBook } from "@/lib/explained/facts";
import { fixtureDayText } from "@/lib/explained/fixtureInputs";
import { exampleCopy } from "./kitExamples";
import { KitSection, Row, Specimen } from "./KitSection";

/** The constructed failing day (TDH-DESIGN.md §5.10): 6529.io short by this much on 2 identities. */
/** The fact ids the gallery's evidence reads most. */
const LATEST_DATE = "tdh.latest.date";
const LATEST_CYCLE = "tdh.latest.cycle";
const LATEST_TOTAL = "tdh.latest.total";
const IDENTITIES = "tdh.latest.identities";
const SIMULATED_SHORTFALL = 118;
const LIMIT_TITLE = "Not guaranteed: the history before the snapshot.";
const LIMIT_BODY =
  "All three read Ethereum's logs as public log servers report them; nothing checks those logs against Ethereum's block headers yet.";

export function KitEvidence({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const copy = exampleCopy(book, locale);
  const { f, v } = copy;
  const days = book.get<ResultDay[]>("tdh.days").value;
  const date = book.get(LATEST_DATE);
  const cycle = book.get(LATEST_CYCLE);
  const equationRows = [
    {
      who: "Rust core",
      sub: "read Ethereum, computed",
      value: book.get(LATEST_TOTAL),
    },
    {
      who: "Python reference",
      sub: "same input, computed again",
      value: book.get("tdh.latest.total.python"),
    },
    {
      who: "6529.io",
      sub: "its own signed upload",
      value: book.get("tdh.latest.total.live"),
    },
  ];
  const fileLine = (
    <p className="tw-m-0 tw-mt-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-3.5 tw-gap-y-1 tw-text-[13px] tw-leading-5 tw-text-iron-400">
      <span>{`days/${f(LATEST_CYCLE).replace(/\D/g, "")}.json`}</span>
      <span>SHA-256</span>
      <Hash
        value={book.text("tdh.latest.file.sha256")}
        locale={locale}
        stripes
      />
      <span className="tw-text-green">equals the index</span>
    </p>
  );
  const verdict = (state: VerdictState) => (
    <Verdict
      state={state}
      date={date}
      cycle={cycle}
      locale={locale}
      headline={
        <>
          6529.io&apos;s TDH matches two separately written recomputations, for
          all {v(IDENTITIES)} identities.
        </>
      }
      aside={
        <>
          <Equation
            label={<>Total TDH, cycle {v(LATEST_CYCLE)}</>}
            rows={equationRows}
            locale={locale}
          />
          {fileLine}
        </>
      }
    >
      <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        Every identity&apos;s TDH equals what the Rust core and the Python
        reference computed, to the unit, and so do all {v("tdh.latest.wallets")}{" "}
        wallets.
      </p>
      <div className="tw-mt-4">
        <LimitNote title={LIMIT_TITLE}>{LIMIT_BODY}</LimitNote>
      </div>
    </Verdict>
  );
  const ribbon = ribbonDays({
    days,
    open: {
      date: book.text("tdh.open.date"),
      minutesLeft: book.num("tdh.open.minutesLeft"),
      progress: book.num("tdh.open.progress"),
    },
    cutover: book.text("tdh.cutover.about"),
  });
  const latestCycle = book.num(LATEST_CYCLE);
  const dayText = fixtureDayText(latestCycle);

  return (
    <KitSection
      id="evidence"
      title="Evidence"
      lede="The verdict with its limit inside, the failing day marked Simulated, the receipt with its hash computed in your browser, who can repeat each step, the agreement, the ladder, and claims told with their proofs."
    >
      <Specimen
        name="Verdict + Equation"
        state="equal, with the limit inside"
        wide
      >
        {verdict("equal")}
      </Specimen>
      <Specimen
        name="Show a day that fails"
        state="SimulationSwitch: the verdict and the ribbon turn together"
        wide
      >
        <SimulationSwitch id="kit-failday">
          <WhenReal>{verdict("equal")}</WhenReal>
          <WhenSimulated>
            <Verdict
              state="simulated"
              date={date}
              cycle={cycle}
              locale={locale}
              headline={
                <>
                  6529.io differs from both recomputations on 2 of{" "}
                  {v(IDENTITIES)} identities.
                </>
              }
              incident={{
                steps: [
                  "Detected 00:52",
                  "Classed D",
                  "Investigating",
                  "Fixed",
                  "Closed",
                ],
                done: 3,
              }}
              aside={
                <Equation
                  label={<>Total TDH, cycle {v(LATEST_CYCLE)}</>}
                  rows={equationRows.map((row, i) =>
                    i === 2
                      ? {
                          ...row,
                          simulated: fmt(
                            {
                              ...book.get(LATEST_TOTAL),
                              value:
                                book.num(LATEST_TOTAL) - SIMULATED_SHORTFALL,
                            },
                            locale
                          ),
                        }
                      : row
                  )}
                  forceDiffers={[2]}
                  locale={locale}
                />
              }
            >
              <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                The Rust core and the Python reference agree with each other.
                6529.io&apos;s records for 2 identities are 118 TDH lower: class
                D, no known cause, so an alarm is raised.
              </p>
            </Verdict>
          </WhenSimulated>
          <div className="tw-mt-4">
            <SimulationButton
              id="fail"
              edge="Show a day that fails"
              back="Back to today"
            />
          </div>
          <div className="tw-mt-6">
            <WhenReal>
              <DayRibbon days={ribbon} locale={locale} />
            </WhenReal>
            <WhenSimulated>
              <DayRibbon
                days={ribbon.map((day) =>
                  day.date === book.text(LATEST_DATE)
                    ? { ...day, kind: "simulated" as const, count: 2 }
                    : day
                )}
                locale={locale}
              />
            </WhenSimulated>
          </div>
        </SimulationSwitch>
      </Specimen>
      {(["knownCause", "missing", "late", "differs"] as const).map((state) => (
        <Specimen key={state} name="Verdict" state={state} wide>
          <Verdict
            state={state}
            date={date}
            cycle={cycle}
            locale={locale}
            headline={
              state === "missing" ? (
                "No file was published for this day."
              ) : (
                <>The day&apos;s records, {v(IDENTITIES)} identities.</>
              )
            }
          >
            {state === "missing" ? (
              <LimitNote title="Not guaranteed: a day without its file.">
                The index lists no file for this cycle yet; the next run writes
                it.
              </LimitNote>
            ) : null}
          </Verdict>
        </Specimen>
      ))}
      <Specimen
        name="DayRibbon, DayTile"
        state="every tile: equal (↻ rewritten), open, future, cutover; differs, known cause, missing"
        wide
      >
        <div className="tw-grid tw-gap-4">
          <DayRibbon days={ribbon} locale={locale} />
          <DayRibbon
            columns={4}
            locale={locale}
            days={[
              { kind: "differs", date: "2026-10-12", cycle: 20738, count: 2 },
              {
                kind: "knownCause",
                date: "2026-10-13",
                cycle: 20739,
                count: 10282,
              },
              { kind: "missing", date: "2026-10-11", cycle: 20737 },
              { kind: "simulated", date: "2026-10-18", cycle: 20744, count: 2 },
            ]}
          />
        </div>
      </Specimen>
      <Specimen
        name="LiveStrip"
        state="today on the network, five results and the open day"
      >
        <LiveStrip
          headline={<>{v(LATEST_TOTAL)} TDH</>}
          days={days}
          openDate={book.text("tdh.open.date")}
          locale={locale}
        >
          {v(IDENTITIES)} identities.{" "}
          <b className="tw-font-semibold tw-text-iron-50">
            Rust core = Python reference = 6529.io
          </b>{" "}
          on every one.
        </LiveStrip>
      </Specimen>
      <Specimen
        name="Receipt, ReceiptRow, BrowserHash"
        state="the fixed order; the drift note on the rule version; the hash computed in the browser"
        wide
      >
        <Receipt
          cycle={f(LATEST_CYCLE)}
          locale={locale}
          rows={[
            {
              id: "result",
              value: (
                <>
                  {v(LATEST_DATE, "long")} · cycle {v(LATEST_CYCLE)}
                </>
              ),
            },
            {
              id: "snapshot",
              value: (
                <>
                  {v("tdh.latest.cutoff")}
                  <span className="tw-text-[15px] tw-font-normal tw-text-iron-400">
                    the last before 00:00 UTC
                  </span>
                </>
              ),
            },
            {
              id: "verdict",
              value: (
                <Mark
                  kind="tested"
                  label="Equal"
                  locale={locale}
                  refText={`${f("tdh.latest.agree.live.identities.equal")} of ${f("tdh.latest.agree.live.identities.total")} identities`}
                />
              ),
            },
            { id: "total", value: v(LATEST_TOTAL) },
            { id: "differences", value: "None, of any class" },
            {
              id: "history",
              value: (
                <Mark
                  kind="notYet"
                  label="Not yet checked"
                  locale={locale}
                  refText={f("tdh.latest.mode")}
                />
              ),
            },
            {
              id: "ruleVersion",
              value: (
                <>
                  <span className="tw-font-mono tw-text-sm">
                    {f("tdh.latest.ruleVersion")}
                  </span>
                  <span className="tw-text-[15px] tw-font-normal tw-text-iron-400">
                    as this file reports it
                  </span>
                </>
              ),
              note: (
                <DriftNote by={["D136", "D137"]} locale={locale} inline>
                  Since Oct 18 the rules are named TDH v1.4, and P26&apos;s rule
                  version is {f("rules.version")}, with four-wallet
                  consolidation. Files written under the new name carry a new
                  rule ID, {f("rules.ruleId")}.
                </DriftNote>
              ),
            },
            {
              id: "ruleId",
              value: (
                <Hash
                  value={book.text("tdh.latest.ruleId")}
                  locale={locale}
                  copy
                  name="the rule ID"
                />
              ),
            },
            {
              id: "registry",
              value: (
                <Hash
                  value={book.text("tdh.latest.registry")}
                  locale={locale}
                  copy
                  name="the registry hash"
                />
              ),
            },
            {
              id: "cycleRoot",
              value: (
                <Hash
                  value={book.text("tdh.latest.roots.cycle")}
                  locale={locale}
                  copy
                  stripes
                  name="the cycle root"
                />
              ),
              note: (
                <ReceiptNote>
                  The 32 bytes a validator signs for this day. No validator
                  certificate is shown for this day.
                </ReceiptNote>
              ),
            },
            {
              id: "walletRoot",
              value: (
                <Hash
                  value={book.text("tdh.latest.roots.wallet")}
                  locale={locale}
                  copy
                  name="the wallet root"
                />
              ),
            },
            {
              id: "historyRoot",
              value: (
                <Hash
                  value={book.text("tdh.latest.roots.history")}
                  locale={locale}
                  copy
                  name="the history root"
                />
              ),
            },
            {
              id: "input",
              value: (
                <Hash
                  value={book.text("tdh.latest.inputSha")}
                  locale={locale}
                />
              ),
            },
            {
              id: "records",
              value: (
                <Hash
                  value={book.text("tdh.latest.recordsSha")}
                  locale={locale}
                  stripes
                />
              ),
            },
            {
              id: "file",
              value: (
                <BrowserHash
                  {...(dayText === undefined ? {} : { text: dayText })}
                  expected={book.text("tdh.latest.file.sha256")}
                  locale={locale}
                />
              ),
            },
          ]}
        />
      </Specimen>
      <Specimen name="ProvenanceTrail" state="who can repeat each step" wide>
        <ProvenanceTrail steps={copy.trail} locale={locale} />
      </Specimen>
      <Specimen
        name="Lanes + AgreementBars"
        state="all equal; a comparison short of the whole"
        wide
      >
        <AgreementBars
          locale={locale}
          pairs={[
            {
              who: "Rust core and Python reference",
              sub: "identities",
              equal: book.get("tdh.latest.agree.python.identities.equal"),
              total: book.get("tdh.latest.agree.python.identities.total"),
              unit: "identities equal",
            },
            {
              who: "Rust core and 6529.io",
              sub: "wallets",
              equal: book.get("tdh.latest.agree.live.wallets.equal"),
              total: book.get("tdh.latest.agree.live.wallets.total"),
              unit: "wallets equal",
            },
            {
              who: "A comparison short of the whole",
              sub: "example: two identities differ",
              equal: {
                ...book.get("tdh.latest.agree.live.identities.equal"),
                value: book.num("tdh.latest.agree.live.identities.equal") - 2,
              },
              total: book.get("tdh.latest.agree.live.identities.total"),
              unit: "example, not a real run",
            },
          ]}
        />
      </Specimen>
      <Specimen
        name="AssuranceLadder"
        state="one track, today after rung 3"
        wide
      >
        <AssuranceLadder
          locale={locale}
          tracks={[{ rungs: copy.overviewLadder, todayAfter: 3 }]}
        />
      </Specimen>
      <Specimen name="AssuranceLadder" state="two tracks: the rule; a day" wide>
        <AssuranceLadder
          locale={locale}
          tracks={[
            { title: "The rule", rungs: copy.ruleLadder, todayAfter: 3 },
            { title: "A day", rungs: copy.dayLadder, todayAfter: 1 },
          ]}
        />
      </Specimen>
      <Specimen name="HonestyBox" wide>
        <HonestyBox
          locale={locale}
          shows={[
            {
              text: "6529.io's TDH for every identity equals two separately written computations, to the unit.",
            },
            {
              text: "The files compared are the ones the index lists: you can recompute each file's hash.",
            },
          ]}
          doesNot={[
            {
              text: (
                <>
                  <b className="tw-font-semibold tw-text-iron-50">
                    That Ethereum&apos;s history was read correctly.
                  </b>{" "}
                  All three take the logs as public log servers report them.
                </>
              ),
            },
            {
              text: (
                <>
                  <b className="tw-font-semibold tw-text-iron-50">
                    Who wrote this comparison.
                  </b>{" "}
                  Its files are hashed, not signed.
                </>
              ),
            },
          ]}
        />
      </Specimen>
      <Specimen name="IsIsNot" wide>
        <IsIsNot
          locale={locale}
          is={[
            {
              text: (
                <>
                  Software at {f("site.validator.version")} that computes the
                  same day the daily check publishes.
                </>
              ),
            },
            { text: "Program A's proof of one mainnet day.", mark: "proved" },
          ]}
          isNot={[
            { text: "Nothing signs. No outside operator runs one." },
            { text: "The code is not public (D116)." },
          ]}
        />
      </Specimen>
      <Specimen name="LimitNote" state="a limit · a record included">
        <div className="tw-grid tw-gap-3">
          <LimitNote title={LIMIT_TITLE}>{LIMIT_BODY}</LimitNote>
          <LimitNote tone="holds" title="This record was included.">
            The Rust core, the Python reference and 6529.io gave it the same TDH
            in the result dated {v(LATEST_DATE)}.
          </LimitNote>
        </div>
      </Specimen>
      <Specimen name="FailureSentence">
        <FailureSentence
          locale={locale}
          ifs={[
            "Ethereum's logs were reported wrongly by the public log servers all three programs read.",
            "Both programs and 6529.io shared the same mistake in the rule.",
          ]}
          closedBy="checked reads against block headers (D118), and validators run by others."
        />
      </Specimen>
      <Specimen name="DefinitionChip" state="two right totals">
        <DefinitionChip title="Two right totals">
          This total counts the two burn addresses, as 6529.io does. Validators
          will sign the total without them. For the day of Oct 11 the two were{" "}
          {v("site.proofA.totalWithBurn")} and{" "}
          {v("site.proofA.totalWithoutBurn")}.
        </DefinitionChip>
      </Specimen>
      <Specimen
        name="ClaimInParts"
        state="as written, refuted, narrowed, proved; the timeline"
        wide
      >
        <ClaimInParts
          parts={copy.claimParts}
          spans={copy.claimSpans}
          locale={locale}
        />
      </Specimen>
      <Specimen
        name="ClaimTable"
        state="limits beside each claim; counts from the manifest"
        wide
      >
        <ClaimTable rows={copy.claimRows} locale={locale} />
      </Specimen>
      <Specimen name="Scoreboard" wide>
        <Scoreboard
          label="The scoreboard"
          locale={locale}
          cells={[
            {
              value: book.get("manifest.proved"),
              caption: (
                <>Lean theorems: {v("manifest.distinct")} distinct statements</>
              ),
            },
            {
              value: book.get("manifest.shownFalse"),
              caption: (
                <>
                  statements shown false: {v("manifest.shownFalse.kernel")} in
                  Lean&apos;s kernel, {v("manifest.shownFalse.evaluation")} by
                  evaluation
                </>
              ),
            },
            {
              value: book.get("manifest.limits"),
              caption: "limits named, none hidden",
            },
            {
              value: book.get("manifest.vectors.passed"),
              caption: <>vectors passed, of {v("manifest.vectors.total")}</>,
            },
          ]}
        />
      </Specimen>
      <Specimen name="AssumptionLedger" wide>
        <AssumptionLedger rows={copy.ledger} locale={locale} />
      </Specimen>
      <Specimen name="SimulatedState" state="a component in its failing state">
        <SimulatedState locale={locale}>
          <Row>
            <Mark
              kind="shownFalse"
              label="Differs"
              locale={locale}
              refText="2 identities"
            />
            <span className="tw-text-[15px] tw-text-iron-300">
              6529.io&apos;s total {fmt(book.get(LATEST_TOTAL), locale)} would
              read lower by 118.
            </span>
          </Row>
        </SimulatedState>
      </Specimen>
      <Specimen name="Actions" state="one main action per screen">
        <div className="tw-flex tw-flex-wrap tw-gap-2.5">
          <Link
            className={EX_BUTTON.cta}
            href={`/network/tdh/verification/${latestCycle}`}
          >
            Today&apos;s receipt
          </Link>
          <Link className={EX_BUTTON.secondary} href="/network/tdh#explain">
            Check your own record
          </Link>
        </div>
      </Specimen>
      <HowWeKnow
        locale={locale}
        title="The 6529 Explained kit"
        slug="explained-kit"
        rows={[
          {
            title: "The daily comparison",
            body: (
              <>
                index.json and the five day files, written{" "}
                {v("feed.writtenAt", "long")}; read {v("page.readAt")}. Every
                file&apos;s SHA-256 equals the index.
              </>
            ),
          },
          {
            title: "The Lean manifest",
            body: (
              <>
                formal/manifest.json, written {v("manifest.writtenAt")}, built
                from 6529chain {v("manifest.commit")}.
              </>
            ),
          },
          {
            title: "The rules",
            body: (
              <>
                P26 at 6529chain {v("rules.p26Commit")}: {v("rules.version")},{" "}
                {v("rules.vectors")} vectors; the record through{" "}
                {v("rules.newestDecision")}.
              </>
            ),
          },
        ]}
      />
    </KitSection>
  );
}
