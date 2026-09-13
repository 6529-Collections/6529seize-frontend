import { useId } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { getCmsColorways } from "@/lib/profile-cms/studio/palettes";
import type { CmsStudioDesign } from "@/lib/profile-cms/studio/presentation";

const PALETTE_LABELS = {
  original: "profileCms.palette.original",
  seize: "profileCms.palette.seize",
  midnight: "profileCms.palette.midnight",
  olive: "profileCms.palette.olive",
  plum: "profileCms.palette.plum",
  "gallery-white": "profileCms.palette.galleryWhite",
  carbon: "profileCms.palette.carbon",
  clay: "profileCms.palette.clay",
  "white-cube": "profileCms.palette.whiteCube",
  oxblood: "profileCms.palette.oxblood",
  slate: "profileCms.palette.slate",
  newsprint: "profileCms.palette.newsprint",
  acid: "profileCms.palette.acid",
  cobalt: "profileCms.palette.cobalt",
  forest: "profileCms.palette.forest",
  navy: "profileCms.palette.navy",
  burgundy: "profileCms.palette.burgundy",
  graphite: "profileCms.palette.graphite",
} as const satisfies Record<string, MessageKey>;

type Palette = ReturnType<typeof getCmsColorways>[number];

export default function StudioPalettePicker({
  design,
  selected,
  locale,
  pending,
  onChoose,
}: {
  readonly design: CmsStudioDesign;
  readonly selected: string | undefined;
  readonly locale: SupportedLocale;
  readonly pending: boolean;
  readonly onChoose: (palette: Palette) => void;
}) {
  const id = useId();
  return (
    <fieldset
      className="tw-m-0 tw-min-w-0 tw-space-y-3 tw-border-0 tw-p-0"
      aria-describedby={`${id}-help`}
    >
      <legend className="tw-mb-2 tw-text-sm tw-font-semibold tw-text-iron-100">
        {t(locale, "profileCms.studio.palette")}
      </legend>
      <p
        id={`${id}-help`}
        className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300"
      >
        {t(locale, "profileCms.palette.help")}
      </p>
      <div className="tw-grid tw-grid-cols-2 tw-gap-2">
        {getCmsColorways(design).map((palette) => (
          <label
            key={palette.id}
            className="tw-relative tw-block tw-min-w-0 tw-cursor-pointer"
          >
            <input
              type="radio"
              name={id}
              value={palette.id}
              checked={selected === palette.id}
              onChange={() => onChoose(palette)}
              className="tw-peer tw-sr-only"
            />
            <span className="tw-flex tw-min-h-20 tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-950 tw-p-3 peer-checked:tw-border-primary-400 peer-checked:tw-ring-1 peer-checked:tw-ring-primary-400 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-offset-2 peer-focus-visible:tw-outline-primary-300 hover:tw-border-iron-400">
              <span
                aria-hidden="true"
                className="tw-flex tw-h-6 tw-overflow-hidden tw-rounded-md"
              >
                {palette.swatches.map((color, index) => (
                  <span
                    key={`${index}-${color}`}
                    style={{ backgroundColor: color }}
                    className="tw-flex-1"
                  />
                ))}
              </span>
              <span className="tw-flex tw-items-start tw-justify-between tw-gap-1 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100">
                {t(locale, PALETTE_LABELS[palette.id])}
                {selected === palette.id ? (
                  <span aria-hidden="true">✓</span>
                ) : null}
              </span>
            </span>
          </label>
        ))}
      </div>
      {pending ? (
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-300">
          {t(locale, "profileCms.palette.pending")}
        </p>
      ) : null}
    </fieldset>
  );
}
