import type { ReactNode } from "react";
import { Glyph, type GlyphKind } from "@/components/explained/marks/glyphs";

/**
 * It protects / It does not: the kit's honesty box (EXPLAINED.md §9) with
 * its own two labels. The kit's `HonestyBox` says "It shows / It does not
 * show", which fits a check, not a rule; a `labels` prop on it would make
 * this one unnecessary (a promotion candidate). Each item keeps its mark:
 * Tested for what the exhaustive checks cover, Not guaranteed for what the
 * rule cannot do.
 */
interface Column {
  readonly label: string;
  readonly glyph: GlyphKind;
  readonly items: readonly ReactNode[];
}

function ColumnList({ column }: { readonly column: Column }) {
  return (
    <div className="tw-px-6 tw-py-[22px]">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {column.label}
      </span>
      <ul className="tw-m-0 tw-mt-3.5 tw-grid tw-list-none tw-gap-3 tw-p-0">
        {column.items.map((item, index) => (
          // Items are fixed copy in a fixed order.
          <li
            key={index}
            className="tw-grid tw-grid-cols-[16px_minmax(0,1fr)] tw-gap-2.5 tw-text-base tw-leading-[25px] tw-text-iron-300"
          >
            <Glyph kind={column.glyph} className="tw-mt-[5px] tw-size-3.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProtectsBox({
  protects,
  doesNot,
}: {
  readonly protects: Omit<Column, "glyph">;
  readonly doesNot: Omit<Column, "glyph">;
}) {
  return (
    <div
      className="tw-grid tw-grid-cols-1 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 md:tw-grid-cols-2"
      data-honest=""
    >
      <ColumnList column={{ ...protects, glyph: "tested" }} />
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 md:tw-border-l md:tw-border-t-0">
        <ColumnList column={{ ...doesNot, glyph: "notGuaranteed" }} />
      </div>
    </div>
  );
}
