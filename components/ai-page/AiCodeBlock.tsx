import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import AiCopyButton from "./AiCopyButton";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A command or a path exactly as it is typed. The label and the copy
 * button sit in a row above it, so the code gets the block's full width;
 * a long line scrolls rather than breaking inside a word.
 */
export default function AiCodeBlock({
  code,
  label,
  what,
  copy = true,
}: {
  readonly code: string;
  /** Which computer it is for, or what it is: "x86-64", "Log". */
  readonly label?: string | undefined;
  /** What the button copies, for screen readers; "the command" if unset. */
  readonly what?: string | undefined;
  /** False for an example, such as a link the install prints. */
  readonly copy?: boolean | undefined;
}) {
  const copied = what ?? t(LOCALE, "ai.code.command");
  return (
    <div className="tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950">
      {(label !== undefined || copy) && (
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-1 tw-pl-3.5 tw-pr-1.5">
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-text-iron-400">
            {label}
          </span>
          {copy && (
            <AiCopyButton
              value={code}
              text={t(LOCALE, "ai.code.copy")}
              copiedText={t(LOCALE, "ai.code.copied")}
              label={t(LOCALE, "ai.code.copyLabel", { what: copied })}
              copiedLabel={t(LOCALE, "ai.code.copied")}
              plain
            />
          )}
        </div>
      )}
      <pre className="tw-m-0 tw-overflow-x-auto tw-whitespace-pre tw-px-3.5 tw-py-3 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100">
        <code className="tw-bg-transparent tw-p-0 tw-font-mono tw-text-iron-100">
          {code}
        </code>
      </pre>
    </div>
  );
}
