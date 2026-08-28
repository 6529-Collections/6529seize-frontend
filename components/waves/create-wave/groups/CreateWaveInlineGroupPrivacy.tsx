import { LockClosedIcon } from "@heroicons/react/24/outline";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useId } from "react";
import TooltipIconButton from "@/components/common/TooltipIconButton";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CreateWaveInlineGroupPrivacy({
  disabled,
  isPrivate,
  onChange,
}: {
  readonly disabled: boolean;
  readonly isPrivate: boolean;
  readonly onChange: (isPrivate: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const label = t(locale, "waves.create.groups.hideCriteriaAndMembers");
  const tooltip = t(
    locale,
    "waves.create.groups.hideCriteriaAndMembersTooltip"
  );
  const inputId = useId();

  return (
    <div
      className={`tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950/60 tw-px-3 tw-py-2.5 sm:tw-w-auto sm:tw-min-w-48 ${
        disabled ? "tw-cursor-not-allowed tw-opacity-60" : "tw-cursor-pointer"
      }`}
    >
      <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-1">
        <label
          htmlFor={inputId}
          className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          <LockClosedIcon
            aria-hidden="true"
            className="tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
          />
          <span>{label}</span>
        </label>
        <TooltipIconButton
          icon={faInfoCircle}
          iconClassName="tw-size-3.5 tw-text-current"
          tooltipText={tooltip}
          tooltipPosition="top"
          tooltipWidth="tw-w-64"
          aria-label={t(
            locale,
            "waves.create.groups.hideCriteriaAndMembersInfoLabel"
          )}
          className="tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-200"
        />
      </span>
      <label
        htmlFor={inputId}
        className={disabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"}
      >
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          checked={isPrivate}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="tw-peer tw-sr-only"
        />
        <span
          className={`tw-flex-shrink-0 tw-rounded-full tw-bg-gradient-to-b tw-p-px peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 peer-focus-visible:tw-ring-offset-2 peer-focus-visible:tw-ring-offset-iron-950 ${
            isPrivate ? "tw-from-primary-300" : "tw-from-iron-600"
          }`}
        >
          <span
            aria-hidden="true"
            className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out ${
              isPrivate ? "tw-bg-primary-500" : "tw-bg-iron-700"
            }`}
          >
            <span
              className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                isPrivate ? "tw-translate-x-[18px]" : "tw-translate-x-0"
              }`}
            />
          </span>
        </span>
      </label>
    </div>
  );
}
