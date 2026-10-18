import type { SupportedLocale } from "@/i18n/locales";
import { kt, type KitKey } from "../i18n";
import { MARK_TEXT, type MarkSize } from "./Mark";

/**
 * "Does it run?" (EXPLAINED.md §3): a three-segment track. Design fills one
 * segment, Built two, Live three, the Live segment blue.
 */
export type Maturity = "design" | "built" | "live";

const WORD: Record<Maturity, KitKey> = {
  design: "explained.kit.track.design",
  built: "explained.kit.track.built",
  live: "explained.kit.track.live",
};

const FILLED: Record<Maturity, number> = { design: 1, built: 2, live: 3 };

export interface TrackProps {
  readonly maturity: Maturity;
  readonly locale: SupportedLocale;
  /** A word in place of Design, Built or Live, such as "Live on 6529.io". */
  readonly label?: string;
  readonly refText?: string;
  readonly size?: MarkSize;
}

export function TrackBar({ maturity }: { readonly maturity: Maturity }) {
  const filled = FILLED[maturity];
  return (
    <span
      className="tw-inline-flex tw-items-center tw-gap-[3px]"
      aria-hidden="true"
    >
      {[1, 2, 3].map((segment) => {
        let tone = "tw-bg-iron-700";
        if (segment <= filled) {
          tone = segment === 3 ? "tw-bg-primary-400" : "tw-bg-iron-300";
        }
        return (
          <i
            key={segment}
            className={`tw-inline-block tw-h-1 tw-w-3 tw-rounded-sm ${tone}`}
          />
        );
      })}
    </span>
  );
}

export default function Track({
  maturity,
  locale,
  label,
  refText,
  size = "md",
}: TrackProps) {
  const word = kt(locale, WORD[maturity]);
  return (
    <span
      className={`tw-inline-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-font-semibold tw-text-iron-50 ${MARK_TEXT[size]}`}
      data-track={maturity}
    >
      <TrackBar maturity={maturity} />
      {label !== undefined && label !== word && (
        <span className="tw-sr-only">{`${kt(locale, "explained.kit.track.label", { stage: word })}: `}</span>
      )}
      <span>{label ?? word}</span>
      {refText !== undefined && (
        <span className="tw-whitespace-normal tw-font-medium tw-text-iron-400">
          {refText}
        </span>
      )}
    </span>
  );
}
