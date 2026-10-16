import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhScrollSpyNav from "../shared/TdhScrollSpyNav";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import { SectionMap } from "./SpecDiagrams";
import SpecSectionsA from "./SpecSectionsA";
import SpecSectionsB from "./SpecSectionsB";

/**
 * SHA-256 of design/tdh-v1-specification.md at 6529chain f840096, the text
 * this page restates.
 */
const P26_SHA256 =
  "c7918b6d3275b8058401a166bf81f4880bbf072d11ce01b1525b21207cabb28d";

const SECTION_IDS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "s12",
  "s13",
] as const;

export default function TdhSpecificationPage() {
  const locale = DEFAULT_LOCALE;
  const titles: Record<string, string> = Object.fromEntries(
    SECTION_IDS.map((id) => [
      id,
      t(locale, `network.tdh.spec.${id}.title` as MessageKey),
    ])
  );
  const tocItems = [
    { id: "symbols", label: t(locale, "network.tdh.spec.symbols.title") },
    ...SECTION_IDS.map((id) => ({ id, label: titles[id] ?? id })),
    { id: "decisions", label: t(locale, "network.tdh.spec.decisions.title") },
    { id: "evidence", label: t(locale, "network.tdh.spec.evidence.title") },
    { id: "changes", label: t(locale, "network.tdh.spec.changes.title") },
  ];

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/specification"
      dropdownHref="/network/tdh/specification"
      documentTitle={t(locale, "network.tdh.spec.pageTitle")}
      title={t(locale, "network.tdh.spec.title")}
      pills={
        <>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-font-mono tw-text-xs tw-text-iron-200">
            tdh-v1.0
          </span>
          <TdhStatusPill pill="proposal" locale={locale} />
        </>
      }
      lede={
        <>
          <p className="tw-m-0">
            {t(locale, "network.tdh.spec.lede")}
            <TdhSource refs={["P26 header"]} locale={locale} />
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.spec.version")}
            <TdhSource refs={["D121", "D116", "P26 header"]} locale={locale} />
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.spec.versionHash")}
            <code className="tw-mt-0.5 tw-block tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
              {P26_SHA256}
            </code>
          </p>
        </>
      }
      headerExtra={
        <div className="tw-mt-8">
          <SectionMap locale={locale} />
        </div>
      }
    >
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 lg:tw-grid lg:tw-grid-cols-[14rem_minmax(0,1fr)] lg:tw-gap-10">
        <TdhScrollSpyNav
          label={t(locale, "network.tdh.spec.contents")}
          items={tocItems}
        />
        <div className="tw-min-w-0">
          <SpecSectionsA locale={locale} />
          <SpecSectionsB locale={locale} />
          <TdhPager current="/network/tdh/specification" locale={locale} />
        </div>
      </div>
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.spec.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.spec.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/specification" }
  );
}
