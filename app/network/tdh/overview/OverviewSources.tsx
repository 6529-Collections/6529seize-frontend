import HowWeKnow, {
  type HowWeKnowRow,
} from "@/components/explained/shell/HowWeKnow";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "@/app/explained/_lib/facts";
import { orich, ot } from "./copy";

/**
 * How we know, for the overview (TDH-DESIGN.md §4.1): the daily
 * comparison, the Lean manifest, 6529.io's API (the editions and, with the
 * network figure, everyone's TDH), the rules and decisions, the figures and
 * the proofs, each with its time.
 */
const RECORD_REPOSITORY = "6529chain";

export default function OverviewSources({
  book,
  locale,
  title,
  withNetwork,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly title: string;
  /** The network figure is on the page (the owner's flag). */
  readonly withNetwork: boolean;
}) {
  const fact = (id: Parameters<typeof Fact>[0]["id"], style?: "long") => (
    <Fact book={book} id={id} locale={locale} {...(style ? { style } : {})} />
  );
  const rows: HowWeKnowRow[] = [
    {
      title: ot(locale, "hwk.feed"),
      body: orich(locale, "hwk.feedBody", {
        written: fact("feed.writtenAt", "long"),
        read: fact("feed.readAt"),
      }),
    },
    {
      title: ot(locale, "hwk.manifest"),
      body: orich(locale, "hwk.manifestBody", {
        written: fact("manifest.writtenAt"),
        sha: fact("manifest.sha256"),
      }),
    },
    {
      title: ot(locale, "hwk.site"),
      body: orich(
        locale,
        withNetwork ? "hwk.siteNetworkBody" : "hwk.siteBody",
        {
          read: fact("memes.readAt"),
        }
      ),
    },
    {
      title: ot(locale, "hwk.rules"),
      body: orich(locale, "hwk.rulesBody", {
        repo: RECORD_REPOSITORY,
        commit: fact("rules.p26Commit"),
        newest: fact("rules.newestDecision"),
      }),
    },
    {
      title: ot(locale, "hwk.figures"),
      body: orich(locale, "hwk.figuresBody", {
        vectors: fact("rules.vectors"),
      }),
    },
    {
      title: ot(locale, "hwk.proofs"),
      body: orich(locale, "hwk.proofsBody", {
        cycle: fact("site.proofA.cycle"),
        block: fact("site.proofA.ethCallBlock"),
      }),
    },
  ];
  return (
    <HowWeKnow rows={rows} locale={locale} title={title} slug="tdh-overview" />
  );
}
