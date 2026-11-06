"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function ChatFileDropOverlay({
  description,
}: {
  readonly description?: string;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-40 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-2 tw-border-dotted tw-border-primary-400 tw-bg-iron-900/75 tw-p-6">
      <div className="tw-max-w-3xl tw-p-4 tw-text-center">
        <p className="tw-text-base tw-font-semibold tw-text-primary-300">
          {t(locale, "drop.upload.dropHere")}
        </p>
        {description && (
          <p className="tw-mt-2 tw-text-xs tw-text-iron-300">{description}</p>
        )}
      </div>
    </div>
  );
}
