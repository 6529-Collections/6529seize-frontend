import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhHeadingLink from "./TdhHeadingLink";

const INHERIT = {
  font: "inherit",
  letterSpacing: "inherit",
  color: "inherit",
} as const;

/**
 * A section heading with its link button set inline after the last word,
 * so the button stays beside the text however the heading wraps. The
 * wrapper carries the type size and balances the lines; the heading itself
 * is inline, so its accessible name is the title alone.
 */
export default function TdhHeading({
  id,
  title,
  locale,
  level = 2,
  className,
}: {
  readonly id: string;
  readonly title: string;
  readonly locale: SupportedLocale;
  readonly level?: 2 | 3;
  readonly className: string;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <div className={`tw-text-balance ${className}`}>
      <Tag
        id={`${id}-heading`}
        tabIndex={-1}
        className="tw-m-0 tw-inline focus:tw-outline-none"
        style={INHERIT}
      >
        {title}
      </Tag>
      <TdhHeadingLink
        id={id}
        inline
        label={t(locale, "network.tdh.shared.headingLink", {
          heading: title,
        })}
        copiedLabel={t(locale, "network.tdh.shared.linkCopied")}
      />
    </div>
  );
}
