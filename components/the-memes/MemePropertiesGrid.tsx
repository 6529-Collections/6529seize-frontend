"use client";

import { MetadataCard } from "@/components/the-memes/MemePageAdditionalDetails";
import type { IAttribute } from "@/entities/INFT";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useId, useState } from "react";

export default function MemePropertiesGrid({
  attributes,
  locale = DEFAULT_LOCALE,
  compactMobile = false,
  collapseOnMobile = false,
}: {
  readonly attributes: readonly IAttribute[];
  readonly locale?: SupportedLocale;
  readonly compactMobile?: boolean;
  readonly collapseOnMobile?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const propertiesId = useId();
  const hiddenTileClassName = collapseOnMobile
    ? "tw-hidden sm:tw-flex md:tw-hidden"
    : "tw-flex md:tw-hidden";
  const toggleVisibilityClassName = collapseOnMobile
    ? "sm:tw-hidden md:tw-flex"
    : "tw-hidden md:tw-flex";

  return (
    <>
      <div
        id={propertiesId}
        className={`tw-grid tw-grid-cols-2 sm:tw-grid-cols-3 sm:tw-gap-3 ${compactMobile ? "tw-gap-2" : "tw-gap-3"}`}
      >
        {attributes.map((attribute, index) => (
          <MetadataCard
            key={`${attribute.trait_type}-${attribute.value}`}
            compactMobile={compactMobile}
            className={
              index >= 6 && !expanded ? hiddenTileClassName : "tw-flex"
            }
            label={attribute.trait_type}
            value={attribute.value}
          />
        ))}
      </div>
      {attributes.length > 6 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={propertiesId}
          onClick={() => setExpanded(!expanded)}
          className={`tw-mt-3 tw-h-10 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-text-[13px] tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 md:!tw-mt-2 md:tw-ml-auto md:tw-h-8 md:tw-w-fit md:tw-items-center md:tw-gap-1.5 md:tw-border-0 md:tw-bg-transparent md:tw-px-0 md:tw-text-sm md:tw-font-medium md:tw-text-iron-400 md:hover:tw-text-iron-100 ${toggleVisibilityClassName}`}
        >
          {t(
            locale,
            expanded
              ? "theMemes.detail.mobile.fewerProperties"
              : "theMemes.detail.mobile.showProperties",
            { count: formatInteger(locale, attributes.length) }
          )}
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-hidden tw-size-3.5 md:tw-block ${expanded ? "tw-rotate-180" : ""}`}
          />
        </button>
      )}
    </>
  );
}
