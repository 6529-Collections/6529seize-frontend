import { Spinner } from "@/components/dotLoader/DotLoader";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { AtSymbolIcon, BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { useRef, useState } from "react";
import { waveNotificationSettingsMessage } from "./waveNotificationSettings.messages";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";

interface WaveNotificationPreferenceButtonsProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

const getButtonStyle = (active: boolean) => {
  return active
    ? "tw-bg-primary-400/10 tw-border-primary-400/30 tw-text-primary-400 desktop-hover:tw-hover:tw-bg-primary-400/20"
    : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent tw-border-iron-700";
};

const getMenuItemStyle = ({
  active,
  disabled,
}: {
  readonly active: boolean;
  readonly disabled: boolean;
}) => {
  if (disabled) {
    return "tw-cursor-not-allowed tw-text-iron-500";
  }

  if (active) {
    return "tw-cursor-pointer tw-text-primary-400 desktop-hover:hover:tw-bg-primary-400/10";
  }

  return "tw-cursor-pointer tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800";
};

interface NotificationMenuItemProps {
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly label: string;
  readonly ariaLabel: string;
  readonly active: boolean;
  readonly actionDisabled?: boolean | undefined;
  readonly buttonDisabled: boolean;
  readonly loading: boolean;
  readonly description?: string | undefined;
  readonly descriptionId?: string | undefined;
  readonly onSelect: () => void;
}

function NotificationMenuItemIndicator({
  loading,
  active,
}: {
  readonly loading: boolean;
  readonly active: boolean;
}) {
  if (loading) {
    return <Spinner dimension={12} />;
  }

  if (active) {
    return (
      <CheckIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
    );
  }

  return <span className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />;
}

function NotificationMenuItem({
  icon: Icon,
  label,
  ariaLabel,
  active,
  actionDisabled = false,
  buttonDisabled,
  loading,
  description,
  descriptionId,
  onSelect,
}: NotificationMenuItemProps) {
  const itemDisabled = buttonDisabled || actionDisabled;

  return (
    <li role="none" className="tw-list-none">
      <button
        type="button"
        disabled={buttonDisabled}
        role="menuitemcheckbox"
        aria-checked={active}
        aria-disabled={actionDisabled || undefined}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (actionDisabled) {
            return;
          }
          onSelect();
        }}
        className={`tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500 ${getMenuItemStyle(
          {
            active,
            disabled: itemDisabled,
          }
        )}`}
        aria-label={ariaLabel}
      >
        <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
        <span className="tw-min-w-0 tw-flex-1 tw-text-left">
          <span className="tw-block tw-text-sm tw-font-medium">{label}</span>
          {description && (
            <span
              id={descriptionId}
              className="tw-mt-0.5 tw-block tw-whitespace-nowrap tw-text-[11px] tw-font-normal tw-leading-[14px] tw-text-iron-400"
            >
              {description}
            </span>
          )}
        </span>
        <NotificationMenuItemIndicator loading={loading} active={active} />
      </button>
    </li>
  );
}

export default function WaveNotificationPreferenceButtons({
  waveId,
  settings,
  compact = false,
}: WaveNotificationPreferenceButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const allDropsSelectionDisabled =
    settings.disableAllDropsSelection && !settings.allDropsEnabled;
  const tooltipId = `wave-notification-actions-${waveId}`;
  const triggerId = `${tooltipId}-trigger`;
  const menuId = `${tooltipId}-menu`;
  const allDropsLimitDescriptionId = `${tooltipId}-all-drops-limit-description`;
  const triggerActive =
    settings.allGroupNotificationsEnabled || settings.allDropsEnabled;
  const triggerSizeClass = compact
    ? "tw-size-9 tw-p-0"
    : "tw-h-10 tw-w-full tw-px-2.5 tw-py-2 lg:tw-h-9";
  const triggerLabel = waveNotificationSettingsMessage(
    "waves.notificationSettings.trigger.ariaLabel"
  );

  const triggerContent = settings.loadingTarget ? (
    <Spinner dimension={12} />
  ) : (
    <BellIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
  );

  return (
    <div
      className={
        compact ? "tw-relative tw-z-20" : "tw-relative tw-z-20 tw-w-full"
      }
    >
      <button
        id={triggerId}
        ref={buttonRef}
        type="button"
        disabled={settings.loading}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
        data-tooltip-id={tooltipId}
        data-tooltip-content={waveNotificationSettingsMessage(
          "waves.notificationSettings.trigger.tooltip"
        )}
        className={`tw-flex ${triggerSizeClass} tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-transition tw-duration-300 tw-ease-out disabled:tw-cursor-not-allowed disabled:tw-text-iron-500 ${getButtonStyle(triggerActive)}`}
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
      >
        {triggerContent}
      </button>

      <CommonDropdownItemsDefaultWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
        horizontalAlign="right"
        minWidth={260}
        menuId={menuId}
        menuLabelledBy={triggerId}
      >
        <NotificationMenuItem
          icon={AtSymbolIcon}
          label={waveNotificationSettingsMessage(
            "waves.notificationSettings.allMentions.label"
          )}
          ariaLabel={waveNotificationSettingsMessage(
            "waves.notificationSettings.allMentions.ariaLabel"
          )}
          active={settings.allGroupNotificationsEnabled}
          buttonDisabled={settings.loading}
          loading={settings.loadingTarget === "all-group"}
          onSelect={() => {
            settings.onAllGroupNotificationsClick();
            setIsOpen(false);
          }}
        />
        <NotificationMenuItem
          icon={BellIcon}
          label={waveNotificationSettingsMessage(
            "waves.notificationSettings.allMessages.label"
          )}
          ariaLabel={waveNotificationSettingsMessage(
            "waves.notificationSettings.allMessages.ariaLabel"
          )}
          active={settings.allDropsEnabled}
          actionDisabled={allDropsSelectionDisabled}
          buttonDisabled={settings.loading}
          loading={settings.loadingTarget === "all-drops"}
          description={
            settings.disableAllDropsSelection
              ? settings.allDropsLimitDescription
              : undefined
          }
          descriptionId={allDropsLimitDescriptionId}
          onSelect={() => {
            if (allDropsSelectionDisabled) {
              return;
            }
            settings.onAllDropsNotificationsClick();
            setIsOpen(false);
          }}
        />
      </CommonDropdownItemsDefaultWrapper>
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
