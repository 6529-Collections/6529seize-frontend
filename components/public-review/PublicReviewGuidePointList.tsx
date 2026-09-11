import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type PublicReviewGuidePoint = {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
};

export function PublicReviewGuidePointList({
  points,
}: {
  readonly points: readonly PublicReviewGuidePoint[];
}) {
  return (
    <ul className="tw-mb-0 tw-mt-7 tw-grid tw-list-none tw-gap-y-5 tw-border-x-0 tw-border-y tw-border-solid tw-border-white/[0.08] tw-px-0 tw-py-6">
      {points.map((point) => (
        <li
          key={point.titleKey}
          className="tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-3"
        >
          <span
            aria-hidden="true"
            className="tw-mt-2.5 tw-size-1.5 tw-rounded-full tw-bg-primary-300"
          />
          <div>
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {t(DEFAULT_LOCALE, point.titleKey)}
            </h3>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(DEFAULT_LOCALE, point.descriptionKey)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
