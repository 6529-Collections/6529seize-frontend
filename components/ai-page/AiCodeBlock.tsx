import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/ai-download";
import AiCodeScroll from "./AiCodeScroll";
import AiCopyButton from "./AiCopyButton";

// Rendered on the server, in the locale the server renders.
const LOCALE = DEFAULT_LOCALE;

/**
 * A command or a path exactly as it is typed. A bar above it says where it
 * goes ("Terminal", "x86-64", "File to delete") and holds the copy button,
 * so the code gets the block's full width; a long line scrolls, with its
 * right edge fading while more is hidden.
 */
export default function AiCodeBlock({
  code,
  label,
  what,
  copy = true,
}: {
  readonly code: string;
  /** Where it goes, or which computer it is for. Every block has one. */
  readonly label: string;
  /** What the button copies, for screen readers; "the command" if unset. */
  readonly what?: string | undefined;
  /** False for an example, such as a link the install prints. */
  readonly copy?: boolean | undefined;
}) {
  const copied = what ?? t(LOCALE, "ai.code.command");
  return (
    <div className="tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950">
      <div className="tw-flex tw-min-h-9 tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-1 tw-pl-3.5 tw-pr-1.5">
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
      <AiCodeScroll>
        <code className="tw-bg-transparent tw-p-0 tw-font-mono tw-text-iron-100">
          {code}
        </code>
      </AiCodeScroll>
    </div>
  );
}
