import { getAppMetadata } from "@/components/providers/metadata";
import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/verification/formalManifest.server";
import TdhPageShell from "../shared/TdhPageShell";
import TdhSection from "../shared/TdhSection";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import AssuranceLayers from "./AssuranceLayers";
import StatementsTable from "./StatementsTable";
import {
  MODEL_MODULES,
  PLANNED_STATEMENTS,
  type StatementRow,
} from "./statements";

// Re-read hourly so statuses follow the Lean build's manifest once it exists.
export const revalidate = 3600;

const PROSE =
  "tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200";
const NOT_KEYS = ["english", "programs", "inputs", "rule", "lean"] as const;

export default async function TdhFormalPage() {
  const locale = DEFAULT_LOCALE;
  const manifest = await loadFormalManifest();
  const rows: StatementRow[] = manifest
    ? manifest.statements.map((statement) => ({ ...statement }))
    : PLANNED_STATEMENTS.map((statement) => ({
        id: statement.id,
        title: t(
          locale,
          `network.tdh.formal.st.${statement.id}.title` as MessageKey
        ),
        plain: t(
          locale,
          `network.tdh.formal.st.${statement.id}.plain` as MessageKey
        ),
        p26: statement.p26,
        lean: null,
        status: "planned",
      }));

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/formal"
      dropdownHref="/network/tdh"
      documentTitle={t(locale, "network.tdh.formal.pageTitle")}
      title={t(locale, "network.tdh.formal.title")}
      pills={<TdhStatusPill pill="inProgress" locale={locale} />}
      lede={<p className="tw-m-0">{t(locale, "network.tdh.formal.lede")}</p>}
    >
      <TdhSection
        id="why"
        title={t(locale, "network.tdh.formal.why.title")}
        locale={locale}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.why.body")}
            <TdhSource refs={["Clean room 2026-10-11"]} locale={locale} />
          </p>
          <p className={PROSE}>{t(locale, "network.tdh.formal.why.body2")}</p>
        </div>
      </TdhSection>

      <TdhSection
        id="contains"
        title={t(locale, "network.tdh.formal.contains.title")}
        locale={locale}
      >
        <div className="tw-space-y-5">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.contains.body")}
          </p>
          {!manifest && (
            <p className="tw-m-0 tw-flex tw-max-w-3xl tw-flex-wrap tw-items-start tw-gap-2 tw-rounded-lg tw-bg-iron-900/70 tw-px-4 tw-py-3 tw-text-sm tw-leading-6 tw-text-iron-300">
              <TdhStatusPill pill="inProgress" locale={locale} size="sm" />
              <span className="tw-min-w-0 tw-flex-1">
                {t(locale, "network.tdh.formal.contains.status")}
              </span>
            </p>
          )}
          <div className={TDH_TABLE_FRAME}>
            <table className={TDH_TABLE}>
              <caption className={TDH_CAPTION}>
                {t(locale, "network.tdh.formal.module.caption")}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.module")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.covers")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.section")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODEL_MODULES.map((row) => (
                  <tr key={row.module}>
                    <th
                      scope="row"
                      className={`${TDH_TD} tw-font-mono tw-text-xs tw-font-normal tw-text-iron-100`}
                    >
                      {row.module}
                    </th>
                    <td className={TDH_TD}>
                      {t(locale, `network.tdh.formal.module.${row.key}`)}
                    </td>
                    <td
                      className={`${TDH_TD} tw-font-mono tw-text-xs tw-text-iron-400`}
                    >
                      P26 {row.section}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TdhSection>

      <TdhSection
        id="statements"
        title={t(locale, "network.tdh.formal.statements.title")}
        locale={locale}
        wide
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {manifest
              ? t(locale, "network.tdh.formal.statements.manifest", {
                  date: formatDate(locale, manifest.builtAt.slice(0, 10)),
                  version: manifest.leanVersion,
                  passed: formatInteger(locale, manifest.vectorsPassed),
                  total: formatInteger(locale, manifest.vectorsTotal),
                })
              : t(locale, "network.tdh.formal.statements.intro")}
          </p>
          <StatementsTable locale={locale} rows={rows} />
        </div>
      </TdhSection>

      <TdhSection
        id="not"
        title={t(locale, "network.tdh.formal.not.title")}
        locale={locale}
      >
        <ul className="tw-m-0 tw-max-w-3xl tw-list-none tw-space-y-4 tw-p-0">
          {NOT_KEYS.map((key) => (
            <li
              key={key}
              className="tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)] tw-gap-3"
            >
              <span
                aria-hidden="true"
                className="tw-mt-2 tw-size-2 tw-rounded-full tw-bg-amber-400"
              />
              <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
                <strong className="tw-font-semibold tw-text-iron-50">
                  {t(locale, `network.tdh.formal.not.${key}.title`)}
                </strong>{" "}
                {t(locale, `network.tdh.formal.not.${key}.body`)}
                {key === "inputs" && (
                  <TdhSource refs={["D118", "D119"]} locale={locale} />
                )}
              </p>
            </li>
          ))}
        </ul>
      </TdhSection>

      <TdhSection
        id="layers"
        title={t(locale, "network.tdh.formal.layers.title")}
        locale={locale}
      >
        <AssuranceLayers locale={locale} />
      </TdhSection>

      <TdhSection
        id="check"
        title={t(locale, "network.tdh.formal.check.title")}
        locale={locale}
      >
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-3">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.check.body")}
            <TdhSource refs={["D116"]} locale={locale} />
          </p>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-dashed tw-border-iron-600 tw-px-3 tw-py-1 tw-text-xs tw-text-iron-300">
            {t(locale, "network.tdh.shared.sourceToBePublished")}
          </span>
        </div>
      </TdhSection>
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.formal.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.formal.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/formal" }
  );
}
