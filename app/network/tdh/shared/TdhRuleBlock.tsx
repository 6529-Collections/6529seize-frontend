import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhCopyButton from "./TdhCopyButton";
import TdhSource from "./TdhSource";
import { TDH_FOCUS_RING } from "./tdhStyles";

/**
 * A rule block (plan §4.3): a formula or pseudocode exactly as P26 writes it,
 * with a caption naming its section and a copy button. On phones the block
 * scrolls inside itself, so the page never scrolls sideways.
 */
export default function TdhRuleBlock({
  code,
  source,
  locale,
  label,
}: {
  readonly code: string;
  readonly source?: string;
  readonly locale: SupportedLocale;
  readonly label?: string;
}) {
  const caption = label ?? source ?? t(locale, "network.tdh.shared.rule");
  return (
    <figure className="tw-m-0 tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950">
      <figcaption className="tw-flex tw-min-h-11 tw-items-center tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-0 tw-pl-3 tw-pr-1">
        <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-400">
          <span>{t(locale, "network.tdh.shared.rule")}</span>
          {source && <TdhSource refs={[source]} locale={locale} />}
        </span>
        <TdhCopyButton
          value={code}
          label={t(locale, "network.tdh.shared.copyNamed", {
            name: t(locale, "network.tdh.shared.ruleRegion", { caption }),
          })}
          copiedLabel={t(locale, "network.tdh.shared.copied")}
          failedLabel={t(locale, "network.tdh.shared.copyFailed")}
        />
      </figcaption>
      <pre
        tabIndex={0}
        role="region"
        aria-label={t(locale, "network.tdh.shared.ruleRegion", { caption })}
        className={`tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-bg-transparent tw-p-4 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100 ${TDH_FOCUS_RING}`}
      >
        <code className="tw-text-iron-100">{code}</code>
      </pre>
    </figure>
  );
}
