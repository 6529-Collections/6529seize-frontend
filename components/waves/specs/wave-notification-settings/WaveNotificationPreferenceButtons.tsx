import {
  DROPDOWN_CHECKMARK_CLASSES,
  DROPDOWN_PANEL_SURFACE_CLASSES,
  getDropdownOptionStateClasses,
} from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import IconButton from "@/components/utils/button/IconButton";
import { Spinner } from "@/components/dotLoader/DotLoader";
import MyStreamActionTooltip from "@/components/brain/my-stream/MyStreamActionTooltip";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useAndroidBackLayer } from "@/hooks/useAndroidBackLayer";
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
import { Fragment, useId, useRef, useState } from "react";
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
      onKeyDown={mobile ? onMobileMenuKeyDown : undefined}
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

function onMobileMenuKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  const menu = event.currentTarget.closest('[role="menu"]');
  if (!menu || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
    return;
  event.preventDefault();
  const items = Array.from(
    menu.querySelectorAll<HTMLButtonElement>(
      "button[role^=menuitem]:not(:disabled)"
    )
  );
  if (!items.length) return;
  const current = items.indexOf(event.currentTarget);
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
  const mobile = useIsMobileLayoutViewport();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement>(null);
  const closeMobile = () => setMobileOpen(false);
  useAndroidBackLayer(mobile && mobileOpen, menuRef, closeMobile);
  const instanceId = useId();
  const tooltipId = `wave-notification-actions-${waveId}-${instanceId}`;
  const busy = settings.muteLoading || settings.loadingTarget !== null;
  let Icon = BellIcon;
  if (settings.isMuted) Icon = BellSlashIcon;
  else if (settings.following && settings.notificationLevel === "all-messages")
    Icon = BellAlertIcon;
  const trigger = (
    <IconButton
      id={`${tooltipId}-trigger`}
      type="button"
      aria-busy={busy}
      onClick={() => {
        if (mobile) setMobileOpen(true);
      }}
      data-tooltip-id={tooltipId}
      data-tooltip-content={title}
      layout={compact ? "notification-mute" : "notification-mute-wide"}
      variant={settings.isMuted ? "selected" : "ghost"}
      aria-label={message("waves.notificationSettings.trigger.ariaLabel")}
      {...(mobile
        ? {
            "aria-haspopup": "dialog" as const,
            "aria-expanded": mobileOpen,
            "aria-controls": mobileOpen ? `${tooltipId}-menu` : undefined,
          }
        : {})}
    >
      <Icon className="tw-size-4 tw-flex-shrink-0" aria-hidden="true" />
    </IconButton>
  );
  const choices = (close: () => void) => (
    <ul
      ref={mobile ? menuRef : undefined}
      id={mobile ? `${tooltipId}-menu` : undefined}
      role={mobile ? "menu" : "none"}
      aria-label={mobile ? title : undefined}
      className={`tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 ${mobile ? "tw-p-0" : "tw-px-2"}`}
    >
      {settings.following && (
        <>
          <li
            role="group"
            aria-label={message("waves.notificationSettings.levels.ariaLabel")}
          >
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
          <li role="none">
            <hr className="tw-mx-0 tw-my-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/10" />
          </li>
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
          <CommonDropdownItemsMobileWrapper
            isOpen={mobileOpen}
            setOpen={setMobileOpen}
            label={title}
            hideOnDesktopHover={false}
            zIndexClassName="tw-z-[11000]"
          >
            <li role="none">{choices(closeMobile)}</li>
          </CommonDropdownItemsMobileWrapper>
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
                className={`tailwind-scope tw-z-[1020] tw-w-max tw-min-w-[290px] tw-max-w-[calc(100vw-2rem)] tw-py-1 focus:tw-outline-none ${DROPDOWN_PANEL_SURFACE_CLASSES}`}
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
