import { Spinner } from "@/components/dotLoader/DotLoader";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { AtSymbolIcon, BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import type { ComponentProps, ComponentType, SVGProps } from "react";
import { Fragment, useId } from "react";
import { createPortal } from "react-dom";
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
  readonly mobile: boolean;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly label: string;
  readonly ariaLabel: string;
  readonly active: boolean;
  readonly buttonDisabled: boolean;
  readonly loading: boolean;
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

// Headless UI supplies menuitem; preserve the checked preference semantics.
function NotificationCheckbox(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      role="menuitemcheckbox"
      aria-checked={props["aria-checked"] ?? false}
    />
  );
}

function NotificationMenuItem({
  mobile,
  icon: Icon,
  label,
  ariaLabel,
  active,
  buttonDisabled,
  loading,
  onSelect,
}: NotificationMenuItemProps) {
  const Button = mobile ? "button" : NotificationCheckbox;
  const button = (
    <Button
      type="button"
      disabled={buttonDisabled}
      role={mobile ? "checkbox" : "menuitemcheckbox"}
      aria-checked={active}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`tw-flex tw-w-full ${mobile ? "tw-min-h-12" : ""} tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-text-iron-500 ${getMenuItemStyle(
        {
          active,
          disabled: buttonDisabled,
        }
      )}`}
      aria-label={ariaLabel}
    >
      <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
      <span className="tw-min-w-0 tw-flex-1 tw-text-left tw-text-sm tw-font-medium">
        {label}
      </span>
      <NotificationMenuItemIndicator loading={loading} active={active} />
    </Button>
  );
  return (
    <li role={mobile ? "listitem" : "none"} className="tw-list-none">
      {mobile ? (
        button
      ) : (
        <MenuItem as={Fragment} disabled={buttonDisabled}>
          {button}
        </MenuItem>
      )}
    </li>
  );
}

export default function WaveNotificationPreferenceButtons({
  waveId,
  settings,
  compact = false,
}: WaveNotificationPreferenceButtonsProps) {
  const title = waveNotificationSettingsMessage(
    "waves.notificationSettings.trigger.tooltip"
  );
  const sheet = useWaveInformationPanel(title);
  const mobile = sheet.isInSheet;
  const instanceId = useId();
  const tooltipId = `wave-notification-actions-${waveId}-${instanceId}`;
  const triggerId = `${tooltipId}-trigger`;
  const menuId = `${tooltipId}-menu`;
  const isOpen = sheet.isOpen;
  const triggerActive =
    settings.broadcastMentionsEnabled || settings.allDropsEnabled;
  const triggerSizeClass = compact
    ? "tw-size-9 tw-p-0"
    : "tw-h-10 tw-w-full tw-px-2.5 tw-py-2 lg:tw-h-9";
  const trigger = (
    <button
      id={triggerId}
      type="button"
      disabled={settings.loading && !settings.loadingTarget}
      aria-disabled={settings.loading}
      onClick={(event) => {
        if (settings.loading) event.preventDefault();
        else if (mobile) sheet.open(event.currentTarget);
      }}
      onKeyDown={(event) => {
        if (
          settings.loading &&
          ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)
        )
          event.preventDefault();
      }}
      data-tooltip-id={tooltipId}
      data-tooltip-content={title}
      className={`tw-flex ${triggerSizeClass} tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-font-semibold tw-transition tw-duration-300 tw-ease-out aria-disabled:tw-cursor-not-allowed aria-disabled:tw-text-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${getButtonStyle(triggerActive)}`}
      aria-label={waveNotificationSettingsMessage(
        "waves.notificationSettings.trigger.ariaLabel"
      )}
      {...(mobile
        ? {
            "aria-expanded": isOpen,
            "aria-controls": sheet.contentId,
          }
        : {})}
    >
      {settings.loadingTarget ? (
        <Spinner dimension={12} />
      ) : (
        <BellIcon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
      )}
    </button>
  );
  const choices = (close: () => void) => (
    <ul
      role={mobile ? "list" : "none"}
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-px-2"
    >
      <NotificationMenuItem
        mobile={mobile}
        icon={AtSymbolIcon}
        label={waveNotificationSettingsMessage(
          "waves.notificationSettings.broadcastMentions.label"
        )}
        ariaLabel={waveNotificationSettingsMessage(
          "waves.notificationSettings.broadcastMentions.ariaLabel"
        )}
        active={settings.broadcastMentionsEnabled}
        buttonDisabled={settings.loading}
        loading={settings.loadingTarget === "broadcast-mentions"}
        onSelect={() => {
          settings.onBroadcastMentionsClick();
          close();
        }}
      />
      <NotificationMenuItem
        mobile={mobile}
        icon={BellIcon}
        label={waveNotificationSettingsMessage(
          "waves.notificationSettings.allMessages.label"
        )}
        ariaLabel={waveNotificationSettingsMessage(
          "waves.notificationSettings.allMessages.ariaLabel"
        )}
        active={settings.allDropsEnabled}
        buttonDisabled={settings.loading}
        loading={settings.loadingTarget === "all-drops"}
        onSelect={() => {
          settings.onAllDropsNotificationsClick();
          close();
        }}
      />
    </ul>
  );

  return (
    <div
      className={
        compact ? "tw-relative tw-z-20" : "tw-relative tw-z-20 tw-w-full"
      }
    >
      {mobile ? (
        <>
          {trigger}
          {sheet.isOpen &&
            sheet.container &&
            createPortal(choices(sheet.close), sheet.container)}
        </>
      ) : (
        <Menu>
          {({ close }) => (
            <>
              <MenuButton as={Fragment}>{trigger}</MenuButton>
              <MenuItems
                id={menuId}
                anchor={{ to: "bottom end", gap: 8, padding: 16 }}
                modal={false}
                className="tailwind-scope tw-z-[1020] tw-w-[260px] tw-max-w-[calc(100vw-2rem)] tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus:tw-outline-none"
              >
                {choices(close)}
              </MenuItems>
            </>
          )}
        </Menu>
      )}
      <MyStreamActionTooltip id={tooltipId} />
    </div>
  );
}
