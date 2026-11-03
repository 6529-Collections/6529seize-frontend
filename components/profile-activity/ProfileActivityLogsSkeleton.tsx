import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function ProfileActivityLogsSkeleton() {
  return (
    <output
      aria-label={t(DEFAULT_LOCALE, "profileActivity.loading")}
      aria-busy="true"
      className="tw-mt-4 tw-block tw-space-y-2.5 md:tw-mt-6"
    >
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="tw-flex tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-p-4 motion-safe:tw-animate-pulse"
        >
          <div className="tw-h-6 tw-w-6 tw-shrink-0 tw-rounded-md tw-bg-iron-800" />
          <div className="tw-min-w-0 tw-flex-1 tw-space-y-2">
            <div className="tw-h-3 tw-w-3/4 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-1/3 tw-rounded tw-bg-iron-800/60" />
          </div>
          <div className="tw-h-3 tw-w-12 tw-shrink-0 tw-rounded tw-bg-iron-800/60" />
        </div>
      ))}
    </output>
  );
}
