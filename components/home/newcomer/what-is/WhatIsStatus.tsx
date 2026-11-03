import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";

export type WhatIsStatusKind = "running" | "testing" | "planned" | "design";

// A shape and a word for each stage, so the stage never rests on colour alone.
const MARK_CLASSES: Record<WhatIsStatusKind, string> = {
  running: "tw-bg-emerald-400",
  testing: "tw-border tw-border-solid tw-border-amber-300",
  planned: "tw-border-[1.5px] tw-border-solid tw-border-iron-300",
  design: "tw-border-[1.5px] tw-border-dashed tw-border-iron-400",
};

export function WhatIsStatus({
  kind,
  locale,
}: {
  readonly kind: WhatIsStatusKind;
  readonly locale: SupportedLocale;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-300">
      <span
        aria-hidden="true"
        className={`tw-block tw-size-2.5 tw-shrink-0 tw-rounded-full ${MARK_CLASSES[kind]}`}
        style={
          kind === "testing"
            ? {
                backgroundImage:
                  "linear-gradient(90deg, rgb(252 211 77) 50%, transparent 50%)",
              }
            : undefined
        }
      />
      <span className="tw-sr-only">
        {t(locale, "home.whatIs.status.label")}
      </span>
      {t(locale, `home.whatIs.status.${kind}`)}
    </span>
  );
}
