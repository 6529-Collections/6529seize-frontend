"use client";

import type { NFT } from "@/entities/INFT";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { useId } from "react";

const MemePageReferencesSubMenu = dynamic(() =>
  import("./MemePageReferences").then((mod) => mod.MemePageReferencesSubMenu)
);

export default function MemePageReferencesSection({
  nft,
  locale,
  open,
  onToggle,
}: Readonly<{
  nft: NFT;
  locale: SupportedLocale;
  open: boolean;
  onToggle: () => void;
}>) {
  const panelId = useId();
  const buttonId = useId();
  return (
    <section className="tw-mt-8 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800">
      <h2 className="tw-m-0">
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border-0 tw-bg-transparent tw-py-4 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-300 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "theMemes.detail.references.sectionTitle")}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-h-5 tw-w-5 tw-shrink-0 ${open ? "tw-rotate-180" : ""}`}
          />
        </button>
      </h2>
      <section id={panelId} aria-labelledby={buttonId} hidden={!open}>
        {open && <MemePageReferencesSubMenu show nft={nft} locale={locale} />}
      </section>
    </section>
  );
}
