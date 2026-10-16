import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhPageShell from "../shared/TdhPageShell";
import TdhCopyButton from "../shared/TdhCopyButton";
import TdhDisclosure from "../shared/TdhDisclosure";
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

const VERSION_ROWS = ["rule", "text", "sha", "where", "status"] as const;

/**
 * The version of the text this page restates: one line (rule version, P26
 * commit and date), and a disclosure with its SHA-256, where the text is
 * and what its status is.
 */
function SpecVersion({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      aria-labelledby="spec-version-heading"
      className="tw-mt-1 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-1 sm:tw-px-5"
    >
      <h2 id="spec-version-heading" className="tw-sr-only">
        {t(locale, "network.tdh.spec.versionRow.title")}
      </h2>
      <TdhDisclosure
        summary={t(locale, "network.tdh.spec.versionRow.summary")}
        summaryClassName="tw-text-[15px] tw-text-iron-100"
      >
        <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-x-6 tw-gap-y-2 tw-pb-3 tw-pl-6 tw-text-sm tw-leading-6 sm:tw-grid-cols-[8rem_minmax(0,1fr)]">
          {VERSION_ROWS.map((row) => (
            <div key={row} className="tw-contents">
              <dt className="tw-font-medium tw-text-iron-300">
                {t(locale, `network.tdh.spec.versionRow.${row}` as MessageKey)}
              </dt>
              <dd className="tw-m-0 tw-mb-2 tw-min-w-0 tw-text-iron-200 sm:tw-mb-0">
                {row === "sha" ? (
                  <>
                    <span className="tw-inline-flex tw-max-w-full tw-items-center tw-gap-1">
                      <code
                        className="tw-min-w-0 tw-break-all tw-font-mono tw-text-[13px] tw-text-iron-100"
                        title={P26_SHA256}
                      >
                        {P26_SHA256}
                      </code>
                      <TdhCopyButton
                        value={P26_SHA256}
                        label={t(locale, "network.tdh.shared.copyNamed", {
                          name: t(locale, "network.tdh.spec.versionRow.sha"),
                        })}
                        copiedLabel={t(locale, "network.tdh.shared.copied")}
                        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
                      />
                    </span>
                    <span className="tw-block tw-text-iron-400">
                      {t(locale, "network.tdh.spec.versionRow.shaNote")}
                    </span>
                  </>
                ) : (
                  t(
                    locale,
                    `network.tdh.spec.versionRow.${row}Value` as MessageKey
                  )
                )}
              </dd>
            </div>
          ))}
        </dl>
        <TdhSource
          refs={["P26 header", "D116", "D121"]}
          locale={locale}
          block
          className="tw-pb-3 tw-pl-6"
        />
      </TdhDisclosure>
    </section>
  );
}

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
          <p className="tw-m-0">{t(locale, "network.tdh.spec.lede")}</p>
          <SpecVersion locale={locale} />
        </>
      }
      headerExtra={
        // On phones the Contents menu is the map; the flow needs the width.
        <div className="tw-mt-8 tw-hidden md:tw-block">
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
