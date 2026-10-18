import Link from "next/link";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_BUTTON, EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import ExplainMyTdh from "./ExplainMyTdh";
import { ot } from "./copy";

/**
 * §03 Your number (TDH-DESIGN.md §4.1): "Is my number right?" Explain my
 * TDH, then "Why did my TDH change? Pick what happened", one click to Your
 * wallets' first section.
 */
export default function YourNumber({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section id="your-number" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.ed}>
        <div className="lg:tw-pt-2.5">
          <span className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-text-primary-300">
            03
          </span>
          <span className={EX_TEXT.label}>{ot(locale, "number.label")}</span>
        </div>
        <div>
          <h2 className={EX_TEXT.h2} id="tdh-profile">
            {ot(locale, "number.title")}
          </h2>
          <p className={`${EX_TEXT.body} tw-m-0 tw-mt-3`}>
            {ot(locale, "number.body")}
          </p>
        </div>
      </div>
      <div className={`${EX_LAYOUT.ed} tw-mt-6`} id="explain">
        <div className="max-lg:tw-hidden" />
        <div className={EX_LAYOUT.edWide}>
          <ExplainMyTdh locale={locale} />
          <p className="tw-m-0 tw-mt-4">
            <Link
              className={`${EX_BUTTON.link} tw-whitespace-normal`}
              href="/network/tdh/consolidation#why"
            >
              {ot(locale, "explain.why")}
              <Icon kind="arrow" className="tw-size-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
