import {
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  CONTENT_PAGE_CONTAINER_CLASS,
  CONTENT_PAGE_MAIN_CLASS,
} from "@/components/about/AboutLayout";
import SanctionsListBrowser from "@/components/sanctions/SanctionsListBrowser";
import {
  browserLabels,
  formatSanctionsDate,
  sourceListName,
  sourceName,
  toBrowserGroups,
} from "@/components/sanctions/sanctions-browser-groups";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import {
  SANCTIONS_SOURCE_ORDER,
  type SanctionsSourceId,
} from "@/lib/sanctions/sanctions-list.types";
import type { SanctionsPageModel } from "@/lib/sanctions/sanctions-page-model";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import type { ReactNode } from "react";

export const SANCTIONS_CONTACT_EMAIL = "support@6529.io";
export const OFAC_REMOVAL_URL =
  "https://ofac.treasury.gov/specially-designated-nationals-list-sdn-list/filing-a-petition-for-removal-from-an-ofac-list";
export const SANCTIONS_LIST_DOWNLOAD_PATH = "/sanctions/sanctions-list.v1.json";

const PLACE_KEYS: ReadonlyArray<MessageKey> = [
  "sanctions.places.cuba",
  "sanctions.places.iran",
  "sanctions.places.northKorea",
  "sanctions.places.crimea",
  "sanctions.places.donetskLuhansk",
];

const RULE_KEYS: ReadonlyArray<MessageKey> = [
  "sanctions.wallets.ruleAnyList",
  "sanctions.wallets.ruleProfile",
  "sanctions.wallets.ruleDelegation",
  "sanctions.wallets.ruleBrowse",
  "sanctions.wallets.ruleFrequency",
];

const SOURCE_NOTES: Partial<Record<SanctionsSourceId, MessageKey>> = {
  "il-nbctf": "sanctions.wallets.ilNote",
  "ca-sema": "sanctions.wallets.caNote",
};

const LINK_CLASS =
  "tw-text-primary-300 tw-underline tw-underline-offset-[3px] hover:tw-text-primary-400 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-300";
const H2_CLASS =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";
const H3_CLASS =
  "tw-mb-0 tw-mt-8 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50";
const BODY_CLASS = "tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300";
const LIST_CLASS =
  "tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-6 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-600";
const SECTION_CLASS =
  "tw-mt-12 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10";

export interface SanctionsPolicyPageProps {
  readonly locale: SupportedLocale;
  readonly model: SanctionsPageModel;
  readonly sha256: string;
  readonly cid: string;
  readonly builtOn: string;
  readonly preview: boolean;
}

function EmailLink(): ReactNode {
  return (
    <a href={`mailto:${SANCTIONS_CONTACT_EMAIL}`} className={LINK_CLASS}>
      {SANCTIONS_CONTACT_EMAIL}
    </a>
  );
}

function withEmail(locale: SupportedLocale, key: MessageKey): ReactNode {
  return tRich<ReactNode>(locale, key, { email: <EmailLink key="email" /> });
}

function PlacesSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="sanctions-places" className={SECTION_CLASS}>
      <h2 id="sanctions-places" className={H2_CLASS}>
        {t(locale, "sanctions.places.title")}
      </h2>
      <p className={BODY_CLASS}>{t(locale, "sanctions.places.intro")}</p>
      <ul className={LIST_CLASS}>
        {PLACE_KEYS.map((key) => (
          <li key={key}>{t(locale, key)}</li>
        ))}
      </ul>
      <h3 className={H3_CLASS}>
        {t(locale, "sanctions.places.detectionTitle")}
      </h3>
      <p className={BODY_CLASS}>{t(locale, "sanctions.places.detection")}</p>
      <p className={BODY_CLASS}>{t(locale, "sanctions.places.vpn")}</p>
      <p className={BODY_CLASS}>
        {withEmail(locale, "sanctions.places.contact")}
      </p>
    </section>
  );
}

function WalletsSection({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section aria-labelledby="sanctions-wallets" className={SECTION_CLASS}>
      <h2 id="sanctions-wallets" className={H2_CLASS}>
        {t(locale, "sanctions.wallets.title")}
      </h2>
      <p className={BODY_CLASS}>{t(locale, "sanctions.wallets.intro")}</p>
      <ul className={LIST_CLASS}>
        {SANCTIONS_SOURCE_ORDER.map((source) => {
          const note = SOURCE_NOTES[source];
          return (
            <li key={source}>
              <span className="tw-font-medium tw-text-iron-50">
                {sourceName(locale, source)}
              </span>
              {": "}
              {sourceListName(locale, source)}
              {note ? ` (${t(locale, note)})` : null}
            </li>
          );
        })}
      </ul>
      <h3 className={H3_CLASS}>{t(locale, "sanctions.wallets.rulesTitle")}</h3>
      <ul className={LIST_CLASS}>
        {RULE_KEYS.map((key) => (
          <li key={key}>{t(locale, key)}</li>
        ))}
      </ul>
      <h3 className={H3_CLASS}>{t(locale, "sanctions.wallets.appealTitle")}</h3>
      <p className={BODY_CLASS}>
        {withEmail(locale, "sanctions.wallets.appeal")}
      </p>
      <p className={BODY_CLASS}>
        {tRich<ReactNode>(locale, "sanctions.wallets.appealDelisting", {
          link: (
            <a
              key="ofac"
              href={OFAC_REMOVAL_URL}
              rel="noopener noreferrer"
              target="_blank"
              className={LINK_CLASS}
            >
              {t(locale, "sanctions.wallets.appealDelistingLink")}
            </a>
          ),
        })}
      </p>
    </section>
  );
}

function ListSummary({
  locale,
  model,
  sha256,
  cid,
  builtOn,
  preview,
}: SanctionsPolicyPageProps) {
  const facts: ReadonlyArray<[string, string]> = [
    [
      t(locale, "sanctions.list.totalLabel"),
      formatInteger(locale, model.enforcedAddressCount),
    ],
    [
      t(locale, "sanctions.list.sourcesLabel"),
      formatInteger(locale, model.sourceCount),
    ],
    [
      t(locale, "sanctions.list.builtLabel"),
      formatSanctionsDate(locale, builtOn),
    ],
  ];
  return (
    <>
      <dl className="tw-mb-0 tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
        {facts.map(([label, value]) => (
          <div
            key={label}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/55 tw-px-4 tw-py-3"
          >
            <dt className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              {label}
            </dt>
            <dd className="tw-m-0 tw-mt-1 tw-text-xl tw-font-semibold tw-text-iron-50">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {preview ? (
        <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "sanctions.list.previewNote", {
            date: formatSanctionsDate(locale, builtOn),
          })}
        </p>
      ) : null}
      <div className="tw-mt-6 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-4 tw-py-4">
        <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
          {t(locale, "sanctions.list.verifyTitle")}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "sanctions.list.verify")}
        </p>
        <dl className="tw-mb-0 tw-mt-3 tw-space-y-2 tw-text-sm">
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "sanctions.list.sha256Label")}
            </dt>
            <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-50">
              {sha256}
            </dd>
          </div>
          <div>
            <dt className="tw-text-iron-400">
              {t(locale, "sanctions.list.cidLabel")}
            </dt>
            <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-iron-50">
              {cid}
            </dd>
          </div>
        </dl>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm">
          <a
            href={SANCTIONS_LIST_DOWNLOAD_PATH}
            download
            className={LINK_CLASS}
          >
            {t(locale, "sanctions.list.download")}
          </a>
        </p>
      </div>
    </>
  );
}

/**
 * `/sanctions`: how 6529 applies sanctions by place and by wallet address, and
 * the official list it checks. Server-rendered from the published list only;
 * it never shows which 6529 profiles matched.
 */
export default function SanctionsPolicyPage(props: SanctionsPolicyPageProps) {
  const { locale, model } = props;
  return (
    <main className={clsx(styles["main"], CONTENT_PAGE_MAIN_CLASS)}>
      <div className={CONTENT_PAGE_CONTAINER_CLASS}>
        <div className="tw-mx-auto tw-max-w-5xl">
          <div className="tw-max-w-3xl">
            <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
              {t(locale, "sanctions.title")}
            </h1>
            <p className="tw-mb-0 tw-mt-5 tw-text-lg tw-leading-8 tw-text-iron-300">
              {t(locale, "sanctions.lead")}
            </p>
            <p className={BODY_CLASS}>{t(locale, "sanctions.leadNote")}</p>
            <nav
              aria-label={t(locale, "sanctions.contents.label")}
              className="tw-mt-6"
            >
              <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-5 tw-gap-y-2 tw-p-0 tw-text-sm">
                <li>
                  <a href="#sanctions-places" className={LINK_CLASS}>
                    {t(locale, "sanctions.places.title")}
                  </a>
                </li>
                <li>
                  <a href="#sanctions-wallets" className={LINK_CLASS}>
                    {t(locale, "sanctions.wallets.title")}
                  </a>
                </li>
                <li>
                  <a href="#sanctions-list" className={LINK_CLASS}>
                    {t(locale, "sanctions.list.title")}
                  </a>
                </li>
              </ul>
            </nav>
            <PlacesSection locale={locale} />
            <WalletsSection locale={locale} />
          </div>
          <section aria-labelledby="sanctions-list" className={SECTION_CLASS}>
            <div className="tw-max-w-3xl">
              <h2 id="sanctions-list" className={H2_CLASS}>
                {t(locale, "sanctions.list.title")}
              </h2>
              <p className={BODY_CLASS}>{t(locale, "sanctions.list.intro")}</p>
              <ListSummary {...props} />
            </div>
            <div className="tw-mt-10">
              <SanctionsListBrowser
                groups={toBrowserGroups(locale, model)}
                labels={browserLabels(locale)}
              />
            </div>
          </section>
          <footer className="tw-mt-16 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "sanctions.footer")}
          </footer>
        </div>
      </div>
    </main>
  );
}
