import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import Mark, { type MarkProps } from "./Mark";
import Tag, { type TagKind } from "./Tag";
import Track, { type TrackProps } from "./Track";

/**
 * One stamp line per model, in its footer (EXPLAINED.md §3 rule 2): at most
 * three marks, and an optional provenance tag. Write the model so every mark
 * is true of all of it.
 */
export type StampItem =
  | Omit<MarkProps, "locale" | "size">
  | Omit<TrackProps, "locale" | "size">;

const MAX_STAMP_MARKS = 3;

function isTrack(item: StampItem): item is Omit<TrackProps, "locale" | "size"> {
  return "maturity" in item;
}

export default function StampLine({
  marks,
  tag,
  locale,
}: {
  readonly marks: readonly StampItem[];
  readonly tag?: { readonly kind: TagKind; readonly text?: string };
  readonly locale: SupportedLocale;
}) {
  if (marks.length > MAX_STAMP_MARKS) {
    throw new Error(
      `A stamp line carries at most ${MAX_STAMP_MARKS} marks; got ${marks.length}.`
    );
  }
  return (
    <span
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-1.5 tw-text-[13px] tw-leading-5 tw-text-iron-400"
      aria-label={kt(locale, "explained.kit.lens.stamp")}
      role="group"
      data-stampline=""
    >
      {marks.map((item) =>
        isTrack(item) ? (
          <Track
            key={`track-${item.maturity}-${item.label ?? ""}`}
            {...item}
            locale={locale}
            size="sm"
          />
        ) : (
          <Mark
            key={`mark-${item.kind}-${item.label ?? ""}`}
            {...item}
            locale={locale}
            size="sm"
          />
        )
      )}
      {tag !== undefined && (
        <Tag kind={tag.kind} locale={locale}>
          {tag.text}
        </Tag>
      )}
    </span>
  );
}
