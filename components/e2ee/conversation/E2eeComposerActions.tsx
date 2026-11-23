import { PlusIcon } from "@heroicons/react/24/outline";
import {
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from "react";
import {
  COMPOSER_ACTION_BUTTON_CLASS_NAME,
  COMPOSER_ACTION_IDLE_CLASS_NAME,
} from "@/components/waves/composerPresentation";
import DropActionTooltip from "@/components/waves/drops/DropActionTooltip";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function E2eeComposerActionTray({
  compact,
  expanded,
  toggleRef,
  onToggle,
  children,
}: {
  readonly compact: boolean;
  readonly expanded: boolean;
  readonly toggleRef: Ref<HTMLButtonElement>;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const actionsId = useId();
  const compactTrayClass = expanded
    ? "tw-col-span-2 tw-col-start-2 tw-row-start-2 tw-mt-2 tw-flex tw-min-w-0 tw-flex-wrap tw-items-start tw-gap-x-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-p-2"
    : "tw-hidden";

  return (
    <>
      {compact && (
        <button
          ref={toggleRef}
          type="button"
          aria-label={t(
            locale,
            expanded
              ? "waves.composer.actions.hide"
              : "waves.composer.actions.show"
          )}
          aria-expanded={expanded}
          aria-controls={actionsId}
          onClick={onToggle}
          className={`tw-col-start-1 tw-row-start-1 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${
            expanded
              ? "tw-border-primary-400/20 tw-bg-primary-500/10 tw-text-primary-300"
              : "tw-border-white/10 tw-bg-iron-800 tw-text-iron-300"
          }`}
        >
          <PlusIcon
            aria-hidden="true"
            className={`tw-size-5 tw-transition-transform motion-reduce:tw-transition-none ${expanded ? "tw-rotate-45" : ""}`}
          />
        </button>
      )}
      {/* Keep the GIF picker and its download mounted while collapsed. */}
      <div
        id={actionsId}
        hidden={compact && !expanded}
        role={compact ? "group" : undefined}
        aria-label={
          compact ? t(locale, "waves.composer.actions.label") : undefined
        }
        className={compact ? compactTrayClass : "tw-contents"}
      >
        {children}
      </div>
    </>
  );
}

export function E2eeComposerActionButton({
  tooltip,
  compactLabel,
  disabled,
  children,
  ...props
}: Omit<ComponentPropsWithRef<"button">, "children"> & {
  readonly tooltip: string;
  readonly compactLabel?: string | undefined;
  readonly children: ReactNode;
}) {
  const buttonClassName = compactLabel
    ? "tw-group tw-flex tw-min-w-11 tw-max-w-24 tw-flex-col tw-items-center tw-gap-1.5 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-1 tw-py-2 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    : `${COMPOSER_ACTION_BUTTON_CLASS_NAME} ${COMPOSER_ACTION_IDLE_CLASS_NAME}`;

  return (
    <DropActionTooltip content={tooltip}>
      <button
        {...props}
        type="button"
        aria-label={tooltip}
        disabled={disabled}
        className={`${buttonClassName} disabled:tw-cursor-not-allowed disabled:tw-opacity-50`}
      >
        {compactLabel ? (
          <>
            <span className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 group-hover:tw-bg-iron-700">
              {children}
            </span>
            <span className="tw-text-center tw-text-[11px] tw-font-medium tw-leading-4">
              {compactLabel}
            </span>
          </>
        ) : (
          children
        )}
      </button>
    </DropActionTooltip>
  );
}
