import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

export default function CollectMarketButton({
  locale,
  onClick,
  mobileRow = false,
  fullWidth = false,
}: {
  readonly locale: SupportedLocale;
  readonly onClick: () => void;
  readonly mobileRow?: boolean;
  readonly fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      className={getButtonClasses({
        variant: "ghost",
        size: null,
        className: `tw-min-h-11 tw-px-0 ${fullWidth ? "tw-w-full !tw-justify-between tw-text-sm" : "tw-text-[13px]"} ${mobileRow ? "tw-gap-1 !tw-font-medium" : "tw-gap-2 !tw-font-normal"}`,
      })}
      onClick={onClick}
    >
      {t(locale, "marketDepth.view")}
      {mobileRow && (
        <ChevronRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-500"
        />
      )}
    </button>
  );
}
