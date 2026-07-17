"use client";

import UserPageErrorWrapper from "@/components/user/utils/UserPageErrorWrapper";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageRepNewRepError({
  msg,
  showDetails = true,
  closeError,
}: {
  readonly msg: string;
  readonly showDetails?: boolean;
  readonly closeError: () => void;
}) {
  const locale = useBrowserLocale();
  return (
    <UserPageErrorWrapper
      closeError={closeError}
      closeLabel={t(locale, "rep.categories.validation.closeErrorLabel")}
    >
      <div className="tw-ml-3 tw-flex tw-min-w-0 tw-flex-col">
        <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-leading-snug tw-text-red">
          {t(locale, "rep.categories.validation.errorTitle")}
        </h3>
        <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-font-medium tw-leading-relaxed tw-text-iron-100">
          {msg}
        </p>
        {showDetails && (
          <p className="tw-mb-0 tw-mt-2 tw-break-words tw-text-left tw-text-xs tw-font-normal tw-leading-relaxed tw-text-iron-300 sm:tw-text-sm">
            {t(locale, "rep.categories.validation.aiFilterDetails")}
          </p>
        )}
      </div>
    </UserPageErrorWrapper>
  );
}
