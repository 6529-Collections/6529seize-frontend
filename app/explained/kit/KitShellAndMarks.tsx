import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import AsOf from "@/components/explained/marks/AsOf";
import { Icon } from "@/components/explained/marks/glyphs";
import DriftNote from "@/components/explained/marks/DriftNote";
import Hash from "@/components/explained/marks/Hash";
import HashStripes from "@/components/explained/marks/HashStripes";
import Mark, { type MarkKind } from "@/components/explained/marks/Mark";
import Pulse from "@/components/explained/marks/Pulse";
import StampLine from "@/components/explained/marks/StampLine";
import Tag from "@/components/explained/marks/Tag";
import Track from "@/components/explained/marks/Track";
import { HalfPair } from "@/components/explained/evidence/AssuranceLadder";
import Breadcrumb from "@/components/explained/shell/Breadcrumb";
import ChapterBar from "@/components/explained/shell/ChapterBar";
import ChapterIndex from "@/components/explained/shell/ChapterIndex";
import ChapterSwitcher from "@/components/explained/shell/ChapterSwitcher";
import { chapterById } from "@/components/explained/shell/chapters";
import LivePill from "@/components/explained/shell/LivePill";
import LoopAtlas from "@/components/explained/shell/LoopAtlas";
import PageIndex from "@/components/explained/shell/PageIndex";
import PrevNext from "@/components/explained/shell/PrevNext";
import ReaderPaths from "@/components/explained/shell/ReaderPaths";
import { LoopLocator } from "@/components/explained/figures/LoopFigure";
import { EX_BUTTON } from "@/components/explained/tokens";
import type { FactBook } from "@/lib/explained/facts";
import { exampleCopy } from "./kitExamples";
import { KitSection, Row, Specimen } from "./KitSection";

const MARKS: readonly MarkKind[] = [
  "decided",
  "absolute",
  "proposed",
  "open",
  "proved",
  "tested",
  "shownFalse",
  "notGuaranteed",
  "notYet",
  "drift",
  "assumed",
  "notProved",
];

export function KitShell({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const copy = exampleCopy(book, locale);
  const tdh = chapterById("tdh");
  const writtenAt = book.get("feed.writtenAt");
  const asOf = book.snapshot().asOf;
  return (
    <KitSection
      id="shell"
      title="The chapter shell"
      lede="The breadcrumb, the chapter bar with its Read and Check groups and the shelf, the feed-time pill, the chapter switcher, and the indexes a chapter and the hub are read through."
    >
      <Specimen name="Breadcrumb" state="hub, chapter, page">
        <div className="tw-grid tw-gap-3">
          <Breadcrumb
            crumbs={[
              { label: "About", href: "/about" },
              { label: "6529 Explained" },
            ]}
            locale={locale}
          />
          <Breadcrumb
            crumbs={[
              { label: "6529 Explained", href: "/explained" },
              { label: "01 TDH", href: "/network/tdh" },
              { label: "The daily check" },
            ]}
            locale={locale}
          />
        </div>
      </Specimen>
      <Specimen name="LivePill" state="live · late · read">
        <Row>
          <LivePill
            fact={writtenAt}
            kind="feed"
            locale={locale}
            asOf={asOf}
            clock="frozen"
          />
          <LivePill
            fact={writtenAt}
            kind="file"
            locale={locale}
            asOf="2026-10-20T03:00:00Z"
            clock="frozen"
          />
          <LivePill
            fact={book.get("page.readAt")}
            kind="read"
            locale={locale}
            asOf={asOf}
            clock="frozen"
          />
        </Row>
      </Specimen>
      <Specimen
        name="ChapterBar"
        state="a Check page active, a page coming, the shelf open"
        wide
      >
        <div className="tw-relative tw-min-h-[330px] tw-rounded-xl tw-border tw-border-solid tw-border-iron-800">
          <ChapterBar
            chapter={{
              ...tdh,
              check: [
                ...tdh.check,
                {
                  id: "soon",
                  title: "explained.kit.map.tdh.glossary",
                  href: "/network/tdh/glossary",
                  soon: true,
                },
              ],
            }}
            active="check"
            locale={locale}
            shelfOpen
          />
        </div>
      </Specimen>
      <Specimen
        name="ChapterSwitcher"
        state="open: the hub, TDH live, the rest coming"
      >
        <div className="tw-relative tw-flex tw-min-h-[460px] tw-justify-end tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-3">
          <ChapterSwitcher locale={locale} current="tdh" defaultOpen />
        </div>
      </Specimen>
      <Specimen
        name="LoopAtlas"
        state="Follow one copy at Held; circle on a desktop, list on a phone"
        wide
      >
        <LoopAtlas
          id="kit-loop"
          stations={copy.stations}
          steps={copy.steps}
          initialStep={2}
          verify={{
            identities: copy.f("tdh.latest.identities"),
            fact: "tdh.latest.identities",
          }}
          locale={locale}
          actions={{
            time: (
              <Link className={EX_BUTTON.cta} href="/network/tdh">
                Chapter 01: TDH
                <Icon kind="arrow" className="tw-size-[15px]" />
              </Link>
            ),
          }}
        />
      </Specimen>
      <Specimen
        name="LoopLocator"
        state="the chapter's arc in a page's eyebrow"
      >
        <span className="tw-inline-flex tw-items-center tw-gap-3">
          <LoopLocator label="TDH: Hold and Time on the loop" />
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
            6529 Explained · Chapter 01
          </span>
        </span>
      </Specimen>
      <Specimen name="PageIndex" state="the spine, then the shelf">
        <PageIndex rows={copy.pageIndex} locale={locale} />
      </Specimen>
      <Specimen name="ChapterIndex" state="live, coming" wide>
        <ChapterIndex rows={copy.chapters} locale={locale} />
      </Specimen>
      <Specimen name="ReaderPaths" wide>
        <ReaderPaths paths={copy.paths} locale={locale} />
      </Specimen>
      <Specimen name="PrevNext" wide>
        <PrevNext
          prev={{
            href: "/network/tdh/consolidation",
            title: "Your wallets",
            n: "2",
          }}
          next={{ href: "/network/tdh/formal", title: "How sure", n: "4" }}
          locale={locale}
        />
      </Specimen>
    </KitSection>
  );
}

export function KitMarks({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const root = book.text("tdh.latest.roots.cycle");
  return (
    <KitSection
      id="marks"
      title="The claim marks"
      lede="Four questions, each a glyph and a word set as text: no border, no pill, no amber. Squares are always white; green and rose only for evidence."
    >
      <Specimen name="Mark" state="every kind, md and sm">
        <div className="tw-grid tw-gap-3">
          <Row>
            {MARKS.map((kind) => (
              <Mark key={kind} kind={kind} locale={locale} />
            ))}
          </Row>
          <Row>
            {MARKS.map((kind) => (
              <Mark key={kind} kind={kind} locale={locale} size="sm" />
            ))}
          </Row>
          <Row>
            <Mark kind="decided" locale={locale} refText="D136" />
            <Mark kind="absolute" locale={locale} refText="300, D89" />
            <Mark
              kind="tested"
              locale={locale}
              label="Recomputed daily"
              refText={`equal on ${book.text("tdh.days.equal")} of ${book.text("tdh.days.compared")} days`}
            />
            <Mark
              kind="proved"
              locale={locale}
              refText="for the holding stacks only"
            />
          </Row>
        </div>
      </Specimen>
      <Specimen name="Track" state="design · built · live">
        <Row>
          <Track maturity="design" locale={locale} />
          <Track maturity="built" locale={locale} refText="software 0.1.0" />
          <Track
            maturity="live"
            locale={locale}
            label="Live on 6529.io"
            refText="TDH v1.4"
          />
        </Row>
      </Specimen>
      <Specimen name="Tag" state="real · example · what if · simulated">
        <Row>
          <Tag kind="real" locale={locale}>
            Real editions
          </Tag>
          <Tag kind="example" locale={locale}>
            Example copy
          </Tag>
          <Tag kind="whatIf" locale={locale} />
          <Tag kind="simulated" locale={locale} />
        </Row>
      </Specimen>
      <Specimen name="StampLine" state="two true marks and a tag">
        <StampLine
          locale={locale}
          marks={[
            { kind: "proposed", refText: "P26, as the consensus rule" },
            { maturity: "live", label: "Live", refText: "as 6529.io's rules" },
          ]}
          tag={{ kind: "real", text: "Real editions" }}
        />
      </Specimen>
      <Specimen name="HalfPair" state="none · A · B · both">
        <Row>
          <HalfPair a={false} b={false} locale={locale} />
          <HalfPair a b={false} locale={locale} />
          <HalfPair a={false} b locale={locale} />
          <HalfPair a b locale={locale} />
        </Row>
      </Specimen>
      <Specimen
        name="Hash, HashStripes"
        state="short with copy, whole, stripes"
      >
        <div className="tw-grid tw-gap-3">
          <Hash
            value={root}
            locale={locale}
            copy
            stripes
            name="the cycle root"
          />
          <Hash value={root} locale={locale} short={null} />
          <Row>
            <HashStripes hex={root} size="lg" />
            <HashStripes hex={book.text("tdh.latest.roots.wallet")} />
          </Row>
        </div>
      </Specimen>
      <Specimen name="AsOf, Pulse" state="written · read · live · late">
        <Row>
          <AsOf fact={book.get("feed.writtenAt")} locale={locale} />
          <AsOf fact={book.get("memes.count")} locale={locale} prefer="read" />
          <Pulse />
          <Pulse live={false} />
        </Row>
      </Specimen>
      <Specimen name="DriftNote" state="block · inline on a receipt row">
        <div className="tw-grid tw-gap-4">
          <DriftNote by={["D136", "D137"]} locale={locale}>
            These proofs are about the three-wallet rule under its old name, as
            the manifest written {book.text("manifest.writtenAt").slice(0, 10)}{" "}
            records.
          </DriftNote>
          <DriftNote by={["D137"]} locale={locale} inline>
            Since Oct 18 the rules are named TDH v1.4, and files written under
            the new name carry a new rule ID.
          </DriftNote>
        </div>
      </Specimen>
    </KitSection>
  );
}
