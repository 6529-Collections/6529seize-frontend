"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages/en-US.complete";
import "@/i18n/namespaces/stream-sepolia";

import { LABEL } from "./OneOfOnePanel";

interface Module {
  readonly title: MessageKey;
  readonly job: MessageKey;
}

/** Shown in two rows of three, one above the core and one below it. */
const MODULES_ABOVE: readonly Module[] = [
  { title: "streamSepolia.how.built.module.auctions", job: "streamSepolia.how.built.module.auctionsJob" },
  { title: "streamSepolia.how.built.module.minting", job: "streamSepolia.how.built.module.mintingJob" },
  { title: "streamSepolia.how.built.module.royalties", job: "streamSepolia.how.built.module.royaltiesJob" },
];
const MODULES_BELOW: readonly Module[] = [
  { title: "streamSepolia.how.built.module.drawing", job: "streamSepolia.how.built.module.drawingJob" },
  { title: "streamSepolia.how.built.module.accounts", job: "streamSepolia.how.built.module.accountsJob" },
  { title: "streamSepolia.how.built.module.listing", job: "streamSepolia.how.built.module.listingJob" },
];

/** Replaceable modules: plain boxes in the core's visual language, with a dashed edge. */
function ModuleRow({ modules, label }: { readonly modules: readonly Module[]; readonly label: string }) {
  const locale = useBrowserLocale();
  return (
    <ul aria-label={label} className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3">
      {modules.map((module) => (
        <li
          key={module.title}
          className="tw-flex tw-flex-col tw-gap-1 tw-rounded-lg tw-border tw-border-dashed tw-border-white/20 tw-bg-white/[0.02] tw-p-3"
        >
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100">{t(locale, module.title)}</span>
          <span className="tw-text-sm tw-leading-6 tw-text-iron-400">{t(locale, module.job)}</span>
        </li>
      ))}
    </ul>
  );
}

const CORE: readonly { readonly title: MessageKey; readonly text: MessageKey; readonly contracts: MessageKey }[] = [
  {
    title: "streamSepolia.how.built.core.ownership",
    text: "streamSepolia.how.built.core.ownershipText",
    contracts: "streamSepolia.how.built.core.ownershipContracts",
  },
  {
    title: "streamSepolia.how.built.core.facts",
    text: "streamSepolia.how.built.core.factsText",
    contracts: "streamSepolia.how.built.core.factsContracts",
  },
  {
    title: "streamSepolia.how.built.core.money",
    text: "streamSepolia.how.built.core.moneyText",
    contracts: "streamSepolia.how.built.core.moneyContracts",
  },
];

/**
 * The permanent core inside a dashed ring of replaceable modules. Plain HTML
 * lists, so the diagram reads the same to a screen reader as it looks.
 */
export function HowItWorksDiagram() {
  const locale = useBrowserLocale();
  return (
    <figure
      className="tw-m-0 tw-flex tw-flex-col tw-gap-4 tw-rounded-2xl tw-border tw-border-dashed tw-border-white/20 tw-bg-white/[0.02] tw-p-3 sm:tw-p-5"
    >
      <div className="tw-flex tw-flex-col tw-gap-3">
        <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
          <span className={LABEL}>{t(locale, "streamSepolia.how.built.modulesLabel")}</span>
          <span className="tw-text-xs tw-text-iron-500">{t(locale, "streamSepolia.how.built.modulesNote")}</span>
        </p>
        <ModuleRow modules={MODULES_ABOVE} label={t(locale, "streamSepolia.how.built.modulesLabel")} />
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border-2 tw-border-solid tw-border-primary-400/60 tw-bg-primary-500/[0.07] tw-p-4 sm:tw-p-5">
        <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
          <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
            {t(locale, "streamSepolia.how.built.coreLabel")}
          </span>
          <span className="tw-text-xs tw-text-iron-400">{t(locale, "streamSepolia.how.built.coreNote")}</span>
        </p>
        <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-3">
          {CORE.map((item) => (
            <li
              key={item.title}
              className="tw-flex tw-flex-col tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950 tw-p-3"
            >
              <span className="tw-text-base tw-font-semibold tw-text-iron-50">{t(locale, item.title)}</span>
              <span className="tw-text-sm tw-leading-6 tw-text-iron-300">{t(locale, item.text)}</span>
              <span className="tw-mt-auto tw-break-words tw-pt-1 tw-font-mono tw-text-[11px] tw-leading-5 tw-text-iron-500">
                {t(locale, item.contracts)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <ModuleRow modules={MODULES_BELOW} label={t(locale, "streamSepolia.how.built.modulesLabel")} />
      <figcaption className="tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "streamSepolia.how.built.caption")}
      </figcaption>
    </figure>
  );
}
