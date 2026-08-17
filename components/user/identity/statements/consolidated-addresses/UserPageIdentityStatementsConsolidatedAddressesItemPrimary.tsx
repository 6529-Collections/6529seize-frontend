import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MouseEvent } from "react";

export default function UserPageIdentityStatementsConsolidatedAddressesItemPrimary({
  isPrimary,
  canEdit,
  assignPrimary,
  isAssigningPrimary,
}: {
  readonly isPrimary: boolean;
  readonly canEdit: boolean;
  readonly assignPrimary: () => void;
  readonly isAssigningPrimary: boolean;
}) {
  const locale = useBrowserLocale();

  if (isPrimary) {
    return (
      <span className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-emerald-500/20 tw-bg-emerald-900/20 tw-px-2 tw-py-1 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-emerald-400 lg:tw-rounded lg:tw-px-1.5 lg:tw-py-px lg:tw-text-[9px]">
        {t(locale, "user.profile.identity.statements.primary")}
      </span>
    );
  }

  if (canEdit) {
    const handleAssignPrimary = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      assignPrimary();
    };

    return (
      <button
        type="button"
        disabled={isAssigningPrimary}
        onClick={handleAssignPrimary}
        aria-label={
          isAssigningPrimary
            ? t(locale, "user.profile.identity.statements.settingPrimary")
            : t(locale, "user.profile.identity.statements.setPrimary")
        }
        className="tw-inline-flex tw-min-h-11 tw-flex-shrink-0 tw-touch-manipulation tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-[11px] tw-font-semibold tw-text-iron-400 tw-transition-colors hover:tw-bg-white/[0.05] hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-60 lg:tw-ml-1 lg:tw-min-h-0 lg:tw-rounded-none lg:tw-px-0 lg:tw-text-xs lg:tw-font-medium"
      >
        {isAssigningPrimary ? (
          <>
            <CircleLoader />
            <span className="tw-sr-only">
              {t(locale, "user.profile.identity.statements.settingPrimary")}
            </span>
          </>
        ) : (
          t(locale, "user.profile.identity.statements.setPrimary")
        )}
      </button>
    );
  }

  return null;
}
