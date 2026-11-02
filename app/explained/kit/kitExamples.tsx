import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import FactValue from "@/components/explained/facts/FactValue";
import type { ChapterIndexRow } from "@/components/explained/shell/ChapterIndex";
import type { PageIndexRow } from "@/components/explained/shell/PageIndex";
import type { ReaderPath } from "@/components/explained/shell/ReaderPaths";
import type {
  AtlasStation,
  AtlasStep,
} from "@/components/explained/shell/LoopAtlas";
import type { Rung } from "@/components/explained/evidence/AssuranceLadder";
import type {
  ClaimPart,
  ClaimRow,
  ClaimSpan,
  LedgerRow,
} from "@/components/explained/evidence/claims";
import type { TrailStep } from "@/components/explained/evidence/ProvenanceTrail";
import type { Lane } from "@/components/explained/figures/Lanes";
import { fmt, type FactBook, type FactId } from "@/lib/explained/facts";

/**
 * The gallery's example content: the final copy of the mockups, wired to
 * the fixture facts, so each component renders in a real context. A page
 * lane takes its copy from its own message keys; this file is for the kit
 * gallery only (a dev route).
 */
export function exampleCopy(book: FactBook, locale: SupportedLocale) {
  const f = (id: FactId, style: "short" | "long" = "short") =>
    fmt(book.get(id), locale, style);
  const v = (id: FactId, style: "short" | "long" = "short"): ReactNode => (
    <FactValue fact={book.get(id)} locale={locale} style={style} />
  );

  const stations: AtlasStation[] = [
    {
      key: "art",
      name: "Art",
      sub: "The Memes, CC0",
      num: `${f("memes.count")} cards`,
      fact: "memes.count",
      say: "Every Monday, Wednesday and Friday a new card is minted, CC0.",
    },
    {
      key: "hold",
      name: "Hold",
      sub: "wallets, identities",
      num: `${f("tdh.latest.wallets")} wallets`,
      fact: "tdh.latest.wallets",
      chapter: "01",
      say: "Copies sit in wallets. Up to four wallets count as one identity.",
    },
    {
      key: "time",
      name: "Time",
      sub: "TDH, every day",
      num: `${f("tdh.latest.total")} TDH`,
      fact: "tdh.latest.total",
      chapter: "01",
      say: "Each whole day a copy is held adds its card's rate to TDH, recomputed daily.",
    },
    {
      key: "standing",
      name: "Standing",
      sub: "Rep, NIC, Level",
      num: "from TDH",
      say: "TDH funds the ratings collectors give each other, and sets Level.",
    },
    {
      key: "decide",
      name: "Decide",
      sub: "waves, Main Stage",
      num: `${f("site.mainStage.decisions")} decisions`,
      fact: "site.mainStage.decisions",
      say: "Main Stage weighs votes by TDH and picks a card three times a week.",
    },
    {
      key: "execute",
      name: "Execute",
      sub: "the winner is minted",
      num: "admin keys today",
      say: "Today 6529's admin keys mint the winner. Network execution is decided, not built.",
    },
  ];
  const steps: AtlasStep[] = [
    { label: "Minted", station: "art" },
    { label: "Collected", station: "hold" },
    { label: "Held", station: "time" },
    { label: "Standing", station: "standing" },
    { label: "Votes", station: "decide" },
    { label: "Mints", station: "execute" },
  ];

  const pageIndex: PageIndexRow[] = [
    {
      no: "1",
      title: "How it works",
      desc: "Four ideas, each with a model you can move.",
      href: "/network/tdh/how-it-works",
    },
    {
      no: "2",
      title: "Your wallets",
      desc: "Why your number changed; up to four wallets.",
      href: "/network/tdh/consolidation",
    },
    {
      no: "3",
      title: "The daily check",
      desc: "Two programs, one comparison, every day.",
      href: "/network/tdh/verification",
    },
    {
      no: "4",
      title: "How sure",
      desc: "What is proved, what is tested, and what is not.",
      href: "/network/tdh/formal",
    },
    {
      no: "S1",
      title: "Specification",
      href: "/network/tdh/specification",
      shelf: true,
    },
    {
      no: "S2",
      title: "Implementations and vectors",
      href: "/network/tdh/implementations",
      shelf: true,
    },
  ];

  const chapters: ChapterIndexRow[] = [
    {
      id: "tdh",
      order: "01",
      title: "TDH",
      question: "What does holding time earn, and who checks it?",
      maturity: "live",
      note: <>checked every day since {v("tdh.days.first")}</>,
      href: "/network/tdh",
    },
    {
      id: "memes",
      order: "Next",
      title: "The Memes and CC0",
      question:
        "How does a meme become a card thousands hold, and why is it free to copy?",
      maturity: "live",
      maturityLabel: "Live subject",
      note: "waits on: how cards were chosen before Main Stage",
    },
    {
      id: "validators",
      order: "Then",
      title: "Validators",
      question: "Who checks the day, and what would it take to fool them?",
      maturity: "built",
      maturityLabel: `Built, ${f("site.validator.version")}`,
      note: "“run one” waits on its release",
    },
    {
      id: "network",
      order: "Last",
      title: "Why 6529, and the network",
      question: "How would this loop run with no operator?",
      maturity: "design",
      maturityLabel: "Mostly design",
      note: "waits on: the owner's decisions and counsel",
    },
  ];

  const paths: ReaderPath[] = [
    {
      who: "I just bought my first card",
      route:
        "What TDH is · when your card starts to count · what CC0 means for it",
      minutes: 6,
      href: "/network/tdh",
    },
    {
      who: "I collect",
      route: "Why your number changed · four wallets · today's check",
      minutes: 9,
      href: "/network/tdh/consolidation",
    },
    {
      who: "I make art",
      route:
        "What CC0 gives and keeps · how a card is chosen · where its copies go",
      minutes: 7,
      more: "more with chapter 02",
      href: "/explained#cc0",
    },
  ];

  const overviewLadder: Rung[] = [
    {
      what: "Written down",
      detail: "P26, the TDH v1.4 specification.",
      marks: [
        { kind: "proposed", refText: "P26" },
        { kind: "tested", label: `${f("rules.vectors")} vectors` },
      ],
    },
    {
      what: "Proved about",
      detail: "The rules' properties, in Lean.",
      marks: [
        { kind: "proved", label: `${f("manifest.proved")} theorems` },
        {
          kind: "shownFalse",
          label: `${f("manifest.shownFalse")} shown false`,
        },
      ],
    },
    {
      what: "Recomputed daily",
      detail: "Two separately written programs, equal to 6529.io.",
      marks: [
        {
          kind: "tested",
          label: `${f("tdh.days.equal")} of ${f("tdh.days.compared")} days`,
        },
      ],
    },
    {
      what: "Inputs checked against Ethereum",
      detail: "Logs against block headers.",
      marks: [{ kind: "notYet" }],
    },
    {
      what: "Proved in zero knowledge",
      detail: "Proof A for one mainnet day; proof B not yet.",
      marks: [{ halfPair: { a: true, b: false } }],
    },
    {
      what: "Recorded on Ethereum",
      detail: "Accepts a day only with both proofs.",
      marks: [{ kind: "decided", refText: "D128" }, { maturity: "built" }],
    },
    {
      what: "Signed by validators",
      detail: `The validator software is at ${f("site.validator.version")}, built and being tested.`,
      marks: [
        { kind: "decided", refText: "D112" },
        { maturity: "built", refText: f("site.validator.version") },
      ],
    },
  ];

  const ruleLadder: Rung[] = [
    {
      what: "Written down",
      detail: "P26, the TDH v1.4 specification.",
      marks: [
        { kind: "proposed", refText: "as the consensus rule" },
        { maturity: "live", refText: "as 6529.io's rules" },
      ],
    },
    {
      what: "Pinned by vectors",
      detail: "Inputs with their exact expected outputs.",
      marks: [
        {
          kind: "tested",
          label: `${f("manifest.vectors.passed")} of ${f("manifest.vectors.total")}`,
          refText: `here; P26 now has ${f("rules.vectors")}`,
        },
      ],
    },
    {
      what: "Proved about",
      detail: "Eight claims, each with what it does not cover.",
      marks: [{ kind: "proved", refText: "with limits" }],
    },
    {
      what: "Programs follow the model",
      detail: "No proof links any program's code to the model.",
      marks: [{ kind: "notProved", refText: "tested by vectors" }],
    },
  ];
  const dayLadder: Rung[] = [
    {
      what: "Recomputed daily",
      detail: "Two separately written programs, equal to 6529.io.",
      marks: [
        {
          kind: "tested",
          refText: `${f("tdh.days.equal")} of ${f("tdh.days.compared")} days`,
        },
      ],
    },
    {
      what: "Inputs checked against Ethereum",
      detail: "Logs against block headers.",
      marks: [{ kind: "notYet" }],
    },
    {
      what: "Proved in zero knowledge",
      detail: `Proof A states cycle ${f("site.proofA.cycle")}'s roots; mainnet's SP1 verifier accepts it in a read-only call.`,
      marks: [{ halfPair: { a: true, b: false } }],
    },
  ];

  const trail: TrailStep[] = [
    {
      title: "Ethereum's logs",
      sub: `to block ${f("tdh.latest.cutoff")}`,
      who: "node",
    },
    { title: "The input file", sub: "published as a hash only", who: "source" },
    { title: "Rust core", sub: "computes every record", who: "source" },
    { title: "Python reference", sub: "same input, again", who: "record" },
    {
      title: "6529.io's upload",
      sub: "signed on Arweave; sum its rows",
      who: "anyone",
    },
    {
      title: "This day's file",
      sub: "its SHA-256 against the index",
      who: "anyone",
    },
    { title: "Your own TDH", sub: "aim for the cycle root", who: "spec" },
  ];

  const lanes: Lane[] = [
    {
      kicker: "Ethereum",
      title: "Every log of four contracts",
      cap: <>to block {v("tdh.latest.cutoff")}, the last before 00:00 UTC</>,
    },
    {
      kicker: "One input file",
      title: "The canonical input",
      cap: <>written by the Rust core · {v("tdh.latest.inputSha")}</>,
    },
    {
      pair: [
        {
          kicker: "Program 1",
          title: "Rust core",
          cap: (
            <>
              {v("tdh.latest.builds.rust.commit")} ·{" "}
              {v("tdh.latest.builds.rust.runtime")}
            </>
          ),
        },
        {
          kicker: "Program 2",
          title: "Python reference",
          cap: (
            <>
              {v("tdh.latest.builds.python.commit")} ·{" "}
              {v("tdh.latest.builds.python.runtime")}
            </>
          ),
        },
      ],
    },
    {
      kicker: "Two record files",
      title: "Byte for byte identical",
      cap: v("tdh.latest.recordsSha"),
    },
    {
      kicker: "Compared with 6529.io",
      title: "Record by record: equal",
      cap: <>its signed upload · {v("tdh.latest.liveSha")}</>,
      ok: true,
    },
  ];

  const claimParts: ClaimPart[] = [
    {
      when: "11:32 UTC · as first written",
      where: "P26 §7.1, commit 0621ed4",
      quote:
        "“inserting, removing or reordering steps that leave every net(w) unchanged changes no value”",
      mark: { kind: "shownFalse", refText: "case H" },
      body: "Insert a mint and a burn into a transaction. Every net movement is unchanged, but the card's minted count doubles, and so does another holder's TDH.",
      cap: "Checked by evaluation, which trusts Lean's compiler. An example registry.",
    },
    {
      when: "15:35 UTC · narrowed",
      where: "P26 §7.1, commit 16d70d0",
      quote: "“…changes no stack, balance or raw”",
      mark: { kind: "shownFalse", refText: "case I" },
      body: "The proof covered the stacks only. A mint and its burn can move a card's first mint earlier and give a wallet a balance it did not have.",
      cap: "The one time the prose cited the proof for more than it proved.",
    },
    {
      when: "18:18 UTC · what is proved now",
      where: "P26 §7.1, commit 1c69528",
      quote: "“…changes no stack”",
      mark: { kind: "proved", refText: "in Lean's kernel" },
      lean: {
        name: book.get("manifest.headline.name"),
        file: book.get("manifest.headline.file"),
        line: book.get("manifest.headline.line"),
        axioms: book.get("manifest.headline.axioms"),
      },
      body: "It holds for two canonical sequences whose transactions correspond one to one and in order.",
      doesNotCover: "two cycle inputs.",
    },
  ];
  const claimSpans: ClaimSpan[] = [
    {
      duration: "4 hours",
      what: "the first sentence stood",
      outcome: "refuted",
    },
    {
      duration: "2 h 43 min",
      what: "the second sentence stood",
      outcome: "refuted",
    },
    {
      duration: "Since 18:18 UTC",
      what: "the sentence matches the proof",
      outcome: "holds",
    },
  ];

  const claimRows: ClaimRow[] = [
    {
      what: "Netting",
      detail:
        "Steps inside one transaction change no holding stack, when only net movements are equal.",
      limit:
        "Not for two cycle inputs; not for values beyond the stacks (cases H and I).",
      counts: {
        proved: book.get("manifest.proved"),
        shownFalse: book.get("manifest.shownFalse.kernel"),
        limits: book.get("manifest.limits"),
      },
    },
    {
      what: "The acquisition stack",
      detail: "Adding and taking copies does exactly what P26 §7.1 says.",
      limit: "None named.",
      counts: { proved: book.get("manifest.noAxioms") },
    },
  ];

  const ledger: LedgerRow[] = [
    {
      assumption: "Lean's kernel and its three standard axioms are sound",
      mark: "assumed",
      covers: "The base every proof rests on. It cannot be proved in Lean.",
    },
    {
      assumption: "The model says what P26 says",
      mark: "tested",
      covers: "The vectors, one day replayed record by record, and review.",
    },
    {
      assumption: "The programs compute what the model computes",
      mark: "notProved",
      covers: "The vectors and the daily check.",
    },
    {
      assumption: "Anyone can rerun these proofs",
      mark: "notYet",
      covers: (
        <>
          The model&apos;s source is private. The manifest names its exact
          commit, {v("manifest.commit")}.
        </>
      ),
    },
  ];

  return {
    stations,
    steps,
    pageIndex,
    chapters,
    paths,
    overviewLadder,
    ruleLadder,
    dayLadder,
    trail,
    lanes,
    claimParts,
    claimSpans,
    claimRows,
    ledger,
    f,
    v,
  };
}

/** The art the gallery shows: 6529.io's scaled images (its /api/nfts `thumbnail`). */
const MEMES_CDN =
  "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
export const KIT_ART = {
  "2": { src: `${MEMES_CDN}/2.WEBP`, name: "Meme #2", title: "SeizeJPGs" },
  "3": { src: `${MEMES_CDN}/3.WEBP`, name: "Meme #3", title: "UncleSeize" },
  "4": {
    src: `${MEMES_CDN}/4.WEBP`,
    name: "Meme #4",
    title: "NakamotoFreedom",
  },
} as const;
