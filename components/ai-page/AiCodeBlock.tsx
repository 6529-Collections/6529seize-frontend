import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import AiCopyButton from "./AiCopyButton";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A command or a path, as it is typed, with a button that copies it. An
 * optional label says which computer it is for.
 */
export default function AiCodeBlock({
  code,
  label,
  what,
}: {
  readonly code: string;
  readonly label?: string | undefined;
  /** What the button copies, for screen readers; "the command" if unset. */
  readonly what?: string | undefined;
}) {
  const copied = what ?? t(LOCALE, "ai.code.command");
  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950">
      {label && (
        <div className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-3.5 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-400">
          {label}
        </div>
      )}
      <div className="tw-flex tw-items-start tw-gap-3 tw-py-2.5 tw-pl-3.5 tw-pr-2.5">
        <pre className="tw-m-0 tw-min-w-0 tw-flex-1 tw-whitespace-pre-wrap tw-py-1 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100 [overflow-wrap:anywhere]">
          <code className="tw-bg-transparent tw-p-0 tw-font-mono tw-text-iron-100">
            {code}
          </code>
        </pre>
        <AiCopyButton
          value={code}
          text={t(LOCALE, "ai.code.copy")}
          copiedText={t(LOCALE, "ai.code.copied")}
          label={t(LOCALE, "ai.code.copyLabel", { what: copied })}
          copiedLabel={t(LOCALE, "ai.code.copied")}
        />
      </div>
    </div>
  );
}
