"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

import { LINK } from "./createShared";
import { CARD, LABEL } from "./OneOfOnePanel";
import { STREAM_BASE } from "./StreamNav";
import { SaleTermsList } from "./WorkPreview";

/**
 * "How it works": the facts come from the contracts session's FAQ draft
 * (written from 6529-works docs/overview.md, the glossary and the contracts),
 * kept as written. Sale terms are read live from the auction contract.
 */

function Section({ id, title, children }: { readonly id: string; readonly title: string; readonly children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="tw-flex tw-flex-col tw-gap-3">
      <h2 id={id} className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Paragraphs({ keys }: { readonly keys: readonly MessageKey[] }) {
  const locale = useBrowserLocale();
  return (
    <>
      {keys.map((key) => (
        <p key={key} className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
          {t(locale, key)}
        </p>
      ))}
    </>
  );
}

function List({ keys, ordered = false }: { readonly keys: readonly MessageKey[]; readonly ordered?: boolean }) {
  const locale = useBrowserLocale();
  const items = keys.map((key) => (
    <li key={key} className="tw-text-[15px] tw-leading-7 tw-text-iron-300">
      {t(locale, key)}
    </li>
  ));
  return ordered ? (
    <ol className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5">{items}</ol>
  ) : (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-1 tw-pl-5">{items}</ul>
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

export function HowItWorks() {
  const locale = useBrowserLocale();
  return (
    <div className="tw-grid tw-items-start tw-gap-10 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <article className="tw-flex tw-min-w-0 tw-flex-col tw-gap-10">
        <header className="tw-flex tw-flex-col tw-gap-3">
          <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-iron-50">{t(locale, "streamSepolia.faq.title")}</h1>
          <p className="tw-m-0 tw-max-w-3xl tw-text-base tw-leading-7 tw-text-iron-300">{t(locale, "streamSepolia.faq.short")}</p>
        </header>
        <ProductGrid />
        <Paragraphs keys={["streamSepolia.faq.shortSale"]} />
        <Section id="faq-difference" title={t(locale, "streamSepolia.faq.difference.title")}>
          <Paragraphs
            keys={[
              "streamSepolia.faq.difference.stream",
              "streamSepolia.faq.difference.independent",
              "streamSepolia.faq.difference.test",
            ]}
          />
        </Section>
        <Section id="faq-kinds" title={t(locale, "streamSepolia.faq.kinds.title")}>
          <List
            keys={[
              "streamSepolia.faq.kinds.one",
              "streamSepolia.faq.kinds.editions",
              "streamSepolia.faq.kinds.files",
              "streamSepolia.faq.kinds.record",
            ]}
          />
          <Paragraphs keys={["streamSepolia.faq.kinds.test"]} />
        </Section>
        <Section id="faq-storage" title={t(locale, "streamSepolia.faq.storage.title")}>
          <Paragraphs keys={["streamSepolia.faq.storage.text"]} />
        </Section>
        <Section id="faq-sale" title={t(locale, "streamSepolia.faq.sale.title")}>
          <p className="tw-m-0 tw-text-[15px] tw-font-semibold tw-text-iron-100">{t(locale, "streamSepolia.faq.sale.oneTitle")}</p>
          <List
            ordered
            keys={["streamSepolia.faq.sale.one1", "streamSepolia.faq.sale.one2", "streamSepolia.faq.sale.one3"]}
          />
          <p className="tw-m-0 tw-text-[15px] tw-font-semibold tw-text-iron-100">
            {t(locale, "streamSepolia.faq.sale.editionsTitle")}
          </p>
          <Paragraphs keys={["streamSepolia.faq.sale.editions", "streamSepolia.faq.sale.terms"]} />
        </Section>
        <Section id="faq-paid" title={t(locale, "streamSepolia.faq.paid.title")}>
          <Paragraphs keys={["streamSepolia.faq.paid.text"]} />
        </Section>
        <Section id="faq-built" title={t(locale, "streamSepolia.faq.built.title")}>
          <Paragraphs keys={["streamSepolia.faq.built.permanent"]} />
          <List
            keys={[
              "streamSepolia.faq.built.ownership",
              "streamSepolia.faq.built.facts",
              "streamSepolia.faq.built.money",
              "streamSepolia.faq.built.content",
            ]}
          />
          <Paragraphs keys={["streamSepolia.faq.built.modules", "streamSepolia.faq.built.promise"]} />
          <List
            ordered
            keys={["streamSepolia.faq.built.promise1", "streamSepolia.faq.built.promise2", "streamSepolia.faq.built.promise3"]}
          />
        </Section>
        <Section id="faq-network" title={t(locale, "streamSepolia.faq.network.title")}>
          <Paragraphs keys={["streamSepolia.faq.network.text"]} />
        </Section>
        <Section id="faq-test" title={t(locale, "streamSepolia.faq.test.title")}>
          <List
            keys={[
              "streamSepolia.faq.test.sepolia",
              "streamSepolia.faq.test.gate",
              "streamSepolia.faq.test.short",
              "streamSepolia.faq.test.audit",
            ]}
          />
        </Section>
      </article>
      <aside className="tw-flex tw-flex-col tw-gap-4 lg:tw-sticky lg:tw-top-6">
        <section className={CARD} aria-labelledby="faq-live-terms">
          <h2 id="faq-live-terms" className={`${LABEL} tw-mb-3`}>
            {t(locale, "streamSepolia.faq.liveTerms")}
          </h2>
          <SaleTermsList editions />
        </section>
        <section className={`${CARD} tw-flex tw-flex-col tw-gap-2`}>
          <Link href={`${STREAM_BASE}/create`} className={`${LINK} tw-text-sm tw-font-semibold`}>
            {t(locale, "streamSepolia.door.stream")}
          </Link>
          <Link href={`${STREAM_BASE}/create?door=independent`} className={`${LINK} tw-text-sm tw-font-semibold`}>
            {t(locale, "streamSepolia.door.deployShort")}
          </Link>
        </section>
      </aside>
    </div>
  );
}
