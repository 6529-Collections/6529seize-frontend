import {
  DROPDOWN_CHECKMARK_CLASSES,
  DROPDOWN_PANEL_SURFACE_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import IconButton from "@/components/utils/button/IconButton";
import { Spinner } from "@/components/dotLoader/DotLoader";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import { useWaveInformationPanel } from "@/components/brain/mobile/WaveInformationPanelContext";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowPathIcon,
  AtSymbolIcon,
  BellAlertIcon,
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import type {
  ComponentProps,
  ComponentType,
  KeyboardEvent,
  SVGProps,
} from "react";
import { Fragment, useId } from "react";
import { createPortal } from "react-dom";
import { waveNotificationSettingsMessage as message } from "./waveNotificationSettings.messages";
import type { WaveNotificationSettingsState } from "./useWaveNotificationSettings";
import type { NotificationLevel } from "./waveNotificationSettings.helpers";

interface WaveNotificationPreferenceButtonsProps {
  readonly waveId: string;
  readonly settings: WaveNotificationSettingsState;
  readonly compact?: boolean | undefined;
}

// Headless UI supplies menuitem; retain the single-choice semantics.
function NotificationButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      role={props["aria-checked"] === undefined ? "menuitem" : "menuitemradio"}
    />
  );
}

interface NotificationMenuItemProps {
  readonly mobile: boolean;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly label: string;
  readonly ariaLabel: string;
  readonly description?: string;
  readonly hint?: string;
  readonly checked?: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly onSelect: () => void;
}

function NotificationMenuItem({
  mobile,
  icon: Icon,
  label,
  ariaLabel,
  description,
  hint,
  checked,
  disabled,
  loading,
  onSelect,
}: NotificationMenuItemProps) {
  const descriptionId = useId();
  const hintId = `${descriptionId}-hint`;
  const describedBy =
    [description && descriptionId, hint && hintId].filter(Boolean).join(" ") ||
    undefined;
  const button = (
    <NotificationButton
      type="button"
      disabled={disabled}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-busy={loading}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 [[role=menu]:focus-visible_&]:data-[focus]:tw-ring-2 [[role=menu]:focus-visible_&]:data-[focus]:tw-ring-inset [[role=menu]:focus-visible_&]:data-[focus]:tw-ring-iron-400 ${mobile ? "tw-min-h-12" : ""} ${getDropdownOptionStateClasses(checked === true)}`}
    >
      <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-sm tw-font-medium">{label}</span>
        {description && (
          <span
            id={descriptionId}
            className="tw-block tw-text-xs tw-leading-5 tw-text-iron-400"
          >
            {description}
          </span>
        )}
      </span>
      {hint && (
        <span id={hintId} className="tw-text-xs tw-text-iron-400">
          {hint}
        </span>
      )}
      {loading ? (
        <Spinner dimension={12} />
      ) : (
        checked !== undefined && (
          <span className="tw-size-4 tw-flex-shrink-0" aria-hidden="true">
            {checked && <CheckIcon className={DROPDOWN_CHECKMARK_CLASSES} />}
          </span>
        )
      )}
    </NotificationButton>
  );
  return (
    <li role="none" className="tw-list-none">
      {mobile ? (
        button
      ) : (
        <MenuItem as={Fragment} disabled={disabled}>
          {button}
        </MenuItem>
      )}
    </li>
  );
}

const LEVELS = [
  { level: "all-messages", key: "allMessages", icon: BellAlertIcon },
  {
    level: "broadcast-mentions",
    key: "broadcastMentions",
    icon: MegaphoneIcon,
  },
  { level: "mentions-only", key: "mentionsOnly", icon: AtSymbolIcon },
] as const satisfies readonly {
  level: NotificationLevel;
  key: string;
  icon: typeof BellIcon;
}[];

function onSheetMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button[role^=menuitem]:not(:disabled)"
    )
  );
  if (!items.length) return;
  const current = items.findIndex((item) => item === document.activeElement);
  let next = (current + 1) % items.length;
  if (event.key === "ArrowUp")
    next = (current - 1 + items.length) % items.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = items.length - 1;
  items[next]?.focus();
}

export default function WaveNotificationPreferenceButtons({
  waveId,
  settings,
  compact = false,
}: WaveNotificationPreferenceButtonsProps) {
  const title = message("waves.notificationSettings.trigger.tooltip");
  const sheet = useWaveInformationPanel(title);
  const mobile = sheet.isInSheet;
  const instanceId = useId();
  const tooltipId = `wave-notification-actions-${waveId}-${instanceId}`;
  const busy = settings.muteLoading || settings.loadingTarget !== null;
  const Icon = settings.isMuted ? BellSlashIcon : BellIcon;
  const trigger = (
    <IconButton
      id={`${tooltipId}-trigger`}
      type="button"
      aria-busy={busy}
      onClick={(event) => {
        if (mobile) sheet.open(event.currentTarget);
      }}
      data-tooltip-id={tooltipId}
      data-tooltip-content={title}
      layout={compact ? "notification-mute" : "notification-wide"}
      variant="ghost"
      aria-label={message("waves.notificationSettings.trigger.ariaLabel")}
      {...(mobile
        ? {
            "aria-haspopup": "menu" as const,
            "aria-expanded": sheet.isOpen,
            "aria-controls": sheet.contentId,
          }
        : {})}
    >
      <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
    </IconButton>
  );
  const choices = (close: () => void) => (
    <ul
      role={mobile ? "menu" : "none"}
      aria-label={mobile ? title : undefined}
      onKeyDown={mobile ? onSheetMenuKeyDown : undefined}
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-px-2"
    >
      {settings.following && (
        <>
          <li role="group" aria-labelledby={`${tooltipId}-heading`}>
            <span
              id={`${tooltipId}-heading`}
              className="tw-block tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-text-iron-400"
            >
              {message("waves.notificationSettings.heading")}
            </span>
            <ul
              role="none"
              className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-p-0"
            >
              {settings.preferencesUnavailable ? (
                <NotificationMenuItem
                  mobile={mobile}
                  icon={ArrowPathIcon}
                  label={message("waves.notificationSettings.retry.label")}
                  ariaLabel={message(
                    "waves.notificationSettings.retry.ariaLabel"
                  )}
                  disabled={busy || settings.preferencesFetching}
                  loading={settings.preferencesFetching}
                  onSelect={settings.onRetryClick}
                />
              ) : (
                LEVELS.map(({ level, key, icon }) => (
                  <NotificationMenuItem
                    key={level}
                    mobile={mobile}
                    icon={icon}
                    label={message(`waves.notificationSettings.${key}.label`)}
                    ariaLabel={message(
                      `waves.notificationSettings.${key}.ariaLabel`
                    )}
                    description={message(
                      `waves.notificationSettings.${key}.description`
                    )}
                    checked={settings.notificationLevel === level}
                    disabled={
                      settings.isMuted ||
                      settings.loading ||
                      settings.muteLoading
                    }
                    loading={settings.loadingTarget === level}
                    onSelect={() => {
                      void settings.onLevelSelect(level);
                      close();
                    }}
                  />
                ))
              )}
            </ul>
          </li>
          <li
            role="separator"
            className="tw-my-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/10"
          />
        </>
      )}
      <NotificationMenuItem
        mobile={mobile}
        icon={BellSlashIcon}
        label={message(
          settings.isMuted
            ? "waves.notificationSettings.mute.unmuteLabel"
            : "waves.notificationSettings.mute.label"
        )}
        ariaLabel={message(
          settings.isMuted
            ? "waves.notificationSettings.mute.unmuteAriaLabel"
            : "waves.notificationSettings.mute.ariaLabel"
        )}
        hint={message("waves.notificationSettings.mute.hint")}
        disabled={busy}
        loading={settings.muteLoading}
        onSelect={() => {
          settings.onMuteClick();
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
                id={`${tooltipId}-menu`}
                anchor={{ to: "bottom end", gap: 8, padding: 16 }}
                modal={false}
                className={`tailwind-scope tw-z-[1020] tw-w-[290px] tw-max-w-[calc(100vw-2rem)] tw-py-1 focus:tw-outline-none ${DROPDOWN_PANEL_SURFACE_CLASSES}`}
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
