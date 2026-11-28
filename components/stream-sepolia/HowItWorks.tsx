"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

import { LINK } from "./createShared";
import { HowItWorksDiagram } from "./HowItWorksDiagram";
import { HowItWorksSteps, type HowItWorksStep } from "./HowItWorksSteps";
import { CARD, LABEL } from "./OneOfOnePanel";
import { STREAM_BASE } from "./StreamNav";
import { useEditionCloseOffset } from "./useStreamData";
import { SaleTermsList } from "./WorkPreview";

/**
 * "How it works": the facts come from the contracts session's FAQ draft
 * (written from the Stream docs, the glossary and the contracts). Promises,
 * the built-from diagram and the sale strips come first; the rest is short
 * expandable questions. Sale terms are read live from the auction contract.
 */

const LIVE_TERMS_ID = "faq-live-terms";

function Section({ id, title, children }: { readonly id: string; readonly title: string; readonly children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="tw-flex tw-flex-col tw-gap-4">
      <h2 id={id} className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

const PROMISES: readonly { readonly title: MessageKey; readonly text: MessageKey }[] = [
  { title: "streamSepolia.how.promise.token", text: "streamSepolia.how.promise.tokenText" },
  { title: "streamSepolia.how.promise.work", text: "streamSepolia.how.promise.workText" },
  { title: "streamSepolia.how.promise.money", text: "streamSepolia.how.promise.moneyText" },
];

/** The three promises of the permanent core, as large statements. */
function Promises() {
  const locale = useBrowserLocale();
  return (
    <section aria-labelledby="faq-promises" className="tw-flex tw-flex-col tw-gap-4">
      <h2 id="faq-promises" className={LABEL}>
        {t(locale, "streamSepolia.how.promises.title")}
      </h2>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 md:tw-grid-cols-3 md:tw-gap-4">
        {PROMISES.map((promise) => (
          <li
            key={promise.title}
            className="tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-border-t-2 tw-border-t-primary-400 tw-bg-iron-950 tw-p-5 sm:tw-p-6"
          >
            <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50 sm:tw-text-[1.75rem]">
              {t(locale, promise.title)}
            </p>
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">{t(locale, promise.text)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The four things you can make, as a 2 x 2 grid: product by kind. */
function ProductGrid() {
  const locale = useBrowserLocale();
  const cell = (titleKey: MessageKey, textKey: MessageKey) => (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-4">
      <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">{t(locale, titleKey)}</p>
      <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">{t(locale, textKey)}</p>
    </div>
  );
  return (
    <div className="tw-grid tw-gap-3 sm:tw-grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]">
      <span aria-hidden="true" className="tw-hidden sm:tw-block" />
      <p className={`${LABEL} tw-hidden sm:tw-block`}>{t(locale, "streamSepolia.faq.grid.one")}</p>
      <p className={`${LABEL} tw-hidden sm:tw-block`}>{t(locale, "streamSepolia.faq.grid.editions")}</p>
      <div className="sm:tw-pt-4">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">{t(locale, "streamSepolia.product.stream")}</p>
        <p className="tw-m-0 tw-text-xs tw-text-iron-500">{t(locale, "streamSepolia.faq.grid.streamNote")}</p>
      </div>
      {cell("streamSepolia.faq.grid.streamOneTitle", "streamSepolia.faq.grid.streamOne")}
      {cell("streamSepolia.faq.grid.streamEditionsTitle", "streamSepolia.faq.grid.streamEditions")}
      <div className="sm:tw-pt-4">
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">{t(locale, "streamSepolia.product.independent")}</p>
        <p className="tw-m-0 tw-text-xs tw-text-iron-500">{t(locale, "streamSepolia.faq.grid.independentNote")}</p>
      </div>
      {cell("streamSepolia.faq.grid.independentOneTitle", "streamSepolia.faq.grid.independentOne")}
      {cell("streamSepolia.faq.grid.independentEditionsTitle", "streamSepolia.faq.grid.independentEditions")}
    </div>
  );
}

const ONE_STEPS: readonly HowItWorksStep[] = [
  { title: "streamSepolia.how.sale.one.startTitle", text: "streamSepolia.how.sale.one.start" },
  { title: "streamSepolia.how.sale.one.bidTitle", text: "streamSepolia.how.sale.one.bid" },
  { title: "streamSepolia.how.sale.one.endTitle", text: "streamSepolia.how.sale.one.end" },
  { title: "streamSepolia.how.sale.one.settleTitle", text: "streamSepolia.how.sale.one.settle" },
];

/**
 * The close step reads the edition close offset live: one wording when both
 * products share it, one naming each when they differ, none until loaded.
 */
function editionCloseStep(curated: string | null, independent: string | null): HowItWorksStep {
  const title: MessageKey = "streamSepolia.how.sale.editions.closeTitle";
  if (curated && independent && curated !== independent) {
    return { title, text: "streamSepolia.how.sale.editions.closeOffsets", vars: { curated, independent } };
  }
  const offset = curated ?? independent;
  if (offset) return { title, text: "streamSepolia.how.sale.editions.closeOffset", vars: { offset } };
  return { title, text: "streamSepolia.how.sale.editions.close" };
}

const NOTE = "tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400";

function Sales() {
  const locale = useBrowserLocale();
  const curatedOffset = useEditionCloseOffset(true);
  const independentOffset = useEditionCloseOffset(false);
  const editionSteps: readonly HowItWorksStep[] = [
    { title: "streamSepolia.how.sale.editions.openTitle", text: "streamSepolia.how.sale.editions.open" },
    { title: "streamSepolia.how.sale.editions.bidTitle", text: "streamSepolia.how.sale.editions.bid" },
    editionCloseStep(curatedOffset, independentOffset),
    { title: "streamSepolia.how.sale.editions.claimTitle", text: "streamSepolia.how.sale.editions.claim" },
  ];
  return (
    <Section id="faq-sale" title={t(locale, "streamSepolia.faq.sale.title")}>
      <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">{t(locale, "streamSepolia.faq.shortSale")}</p>
      <div className={`${CARD} tw-flex tw-flex-col tw-gap-4`}>
        <HowItWorksSteps id="faq-sale-one" title="streamSepolia.how.sale.oneTitle" steps={ONE_STEPS} />
        <p className={`${NOTE} tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4`}>
          {t(locale, "streamSepolia.how.sale.noBid")}
        </p>
      </div>
      <div className={`${CARD} tw-flex tw-flex-col tw-gap-4`}>
        <HowItWorksSteps id="faq-sale-editions" title="streamSepolia.how.sale.editionsTitle" steps={editionSteps} />
        <p className={`${NOTE} tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pt-4`}>
          {t(locale, "streamSepolia.how.sale.sealed")}
        </p>
      </div>
      <p className={NOTE}>
        {t(locale, "streamSepolia.how.sale.terms")}{" "}
        <a href={`#${LIVE_TERMS_ID}`} className={LINK}>
          {t(locale, "streamSepolia.how.sale.termsLink")}
        </a>
      </p>
    </Section>
  );
}

type Question = { readonly id: string; readonly title: MessageKey; readonly body: readonly MessageKey[]; readonly list?: boolean };

const QUESTIONS: readonly Question[] = [
  {
    id: "faq-difference",
    title: "streamSepolia.faq.difference.title",
    body: [
      "streamSepolia.faq.difference.stream",
      "streamSepolia.faq.difference.independent",
      "streamSepolia.faq.difference.test",
    ],
  },
  {
    id: "faq-kinds",
    title: "streamSepolia.faq.kinds.title",
    list: true,
    body: [
      "streamSepolia.faq.kinds.one",
      "streamSepolia.faq.kinds.editions",
      "streamSepolia.faq.kinds.files",
      "streamSepolia.faq.kinds.record",
      "streamSepolia.how.kinds.test",
      "streamSepolia.how.kinds.cc0",
    ],
  },
  { id: "faq-storage", title: "streamSepolia.faq.storage.title", body: ["streamSepolia.faq.storage.text"] },
  { id: "faq-paid", title: "streamSepolia.faq.paid.title", body: ["streamSepolia.faq.paid.text"] },
  { id: "faq-network", title: "streamSepolia.faq.network.title", body: ["streamSepolia.faq.network.text"] },
  {
    id: "faq-test",
    title: "streamSepolia.faq.test.title",
    list: true,
    body: [
      "streamSepolia.faq.test.sepolia",
      "streamSepolia.faq.test.gate",
      "streamSepolia.faq.test.short",
      "streamSepolia.how.kinds.cc0",
      "streamSepolia.faq.test.audit",
    ],
  },
];

const BODY = "tw-text-[15px] tw-leading-7 tw-text-iron-300";

/** The remaining questions, each a native <details> so it opens with Enter or Space. */
function Questions() {
  const locale = useBrowserLocale();
  return (
    <Section id="faq-more" title={t(locale, "streamSepolia.how.more.title")}>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {QUESTIONS.map((question) => (
          <details
            key={question.id}
            id={question.id}
            className="tw-group tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950"
          >
            <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-px-4 tw-py-3 tw-text-[15px] tw-font-semibold tw-text-iron-100 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
              <span>{t(locale, question.title)}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-iron-500 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
              >
                <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="tw-px-4 tw-pb-4">
              {question.list ? (
                <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5">
                  {question.body.map((key) => (
                    <li key={key} className={BODY}>
                      {t(locale, key)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="tw-flex tw-flex-col tw-gap-3">
                  {question.body.map((key) => (
                    <p key={key} className={`tw-m-0 ${BODY}`}>
                      {t(locale, key)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function HowItWorks() {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-10">
      <header className="tw-flex tw-flex-col tw-gap-3">
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.faq.title")}</h1>
        <p className="tw-m-0 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">{t(locale, "streamSepolia.how.lead")}</p>
      </header>
      <Promises />
      <div className="tw-grid tw-items-start tw-gap-10 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <article className="tw-flex tw-min-w-0 tw-flex-col tw-gap-12">
          <Section id="faq-built" title={t(locale, "streamSepolia.faq.built.title")}>
            <p className="tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-300">
              {t(locale, "streamSepolia.how.built.lead")}
            </p>
            <HowItWorksDiagram />
          </Section>
          <Section id="faq-make" title={t(locale, "streamSepolia.how.make.title")}>
            <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">{t(locale, "streamSepolia.how.make.lead")}</p>
            <ProductGrid />
          </Section>
          <Sales />
          <Questions />
        </article>
        <aside className="tw-flex tw-flex-col tw-gap-4 lg:tw-sticky lg:tw-top-6">
          <section id={LIVE_TERMS_ID} className={`${CARD} tw-scroll-mt-6`} aria-labelledby={`${LIVE_TERMS_ID}-title`}>
            <h2 id={`${LIVE_TERMS_ID}-title`} className={`${LABEL} tw-mb-3`}>
              {t(locale, "streamSepolia.faq.liveTerms")}
            </h2>
            <SaleTermsList editions />
          </section>
          <section className={`${CARD} tw-flex tw-flex-col tw-gap-2`} aria-labelledby="faq-create">
            <h2 id="faq-create" className={`${LABEL} tw-mb-1`}>
              {t(locale, "streamSepolia.how.create.title")}
            </h2>
            <Link href={`${STREAM_BASE}/create`} className={`${LINK} tw-text-sm tw-font-semibold`}>
              {t(locale, "streamSepolia.door.stream")}
            </Link>
            <Link href={`${STREAM_BASE}/create?door=independent`} className={`${LINK} tw-text-sm tw-font-semibold`}>
              {t(locale, "streamSepolia.door.deployShort")}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
