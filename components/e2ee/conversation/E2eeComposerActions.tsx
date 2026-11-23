import { PaperClipIcon } from "@heroicons/react/24/outline";
import { motion, useReducedMotion } from "framer-motion";
import {
  useId,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from "react";
import {
  COMPOSER_ACTION_BUTTON_CLASS_NAME,
  COMPOSER_ACTION_ICON_CLASS_NAME,
  COMPOSER_ACTION_IDLE_CLASS_NAME,
} from "@/components/waves/composerPresentation";
import {
  COMPACT_COMPOSER_ACTION_SLOT_CLASS_NAME,
  COMPACT_COMPOSER_ACTION_TRAY_CLASS_NAME,
  CompactComposerActionButton,
  CompactComposerActionToggle,
  CompactComposerActionTrayContents,
  getCompactComposerTrayMotion,
} from "@/components/waves/CompactComposerActions";
import DropActionTooltip from "@/components/waves/drops/DropActionTooltip";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function E2eeComposerAttachButton({
  compact,
  enabled,
  onFilesChosen,
  onSelect,
}: {
  readonly compact: boolean;
  readonly enabled: boolean;
  readonly onFilesChosen: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onSelect: () => void;
}) {
  const locale = useBrowserLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {enabled && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="tw-hidden"
          onChange={onFilesChosen}
        />
      )}
      <E2eeComposerActionButton
        tooltip={t(locale, "e2ee.composer.attach")}
        compactLabel={
          compact ? t(locale, "e2ee.composer.attachShort") : undefined
        }
        onClick={() => {
          onSelect();
          fileInputRef.current?.click();
        }}
        disabled={!enabled}
      >
        <PaperClipIcon
          aria-hidden="true"
          className={COMPOSER_ACTION_ICON_CLASS_NAME}
        />
      </E2eeComposerActionButton>
    </>
  );
}

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
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = compact && !prefersReducedMotion;
  const trayMotion = getCompactComposerTrayMotion(shouldAnimate);
  const collapsed = compact && !expanded;

  return (
    <>
      {compact && (
        <div
          className={`tw-row-start-1 ${COMPACT_COMPOSER_ACTION_SLOT_CLASS_NAME}`}
        >
          <CompactComposerActionToggle
            ref={toggleRef}
            label={t(
              locale,
              expanded
                ? "waves.composer.actions.hide"
                : "waves.composer.actions.show"
            )}
            trayId={actionsId}
            expanded={expanded}
            shouldAnimate={shouldAnimate}
            onClick={onToggle}
          />
        </div>
      )}
      {/* Keep the GIF picker and its download mounted while collapsed. */}
      <motion.fieldset
        id={actionsId}
        aria-hidden={collapsed || undefined}
        inert={collapsed || undefined}
        initial={false}
        animate={collapsed ? trayMotion.exit : trayMotion.animate}
        transition={trayMotion.transition}
        className={
          compact
            ? `tw-row-start-2 tw-m-0 tw-min-w-0 tw-border-0 tw-p-0 ${COMPACT_COMPOSER_ACTION_TRAY_CLASS_NAME}`
            : "tw-contents"
        }
      >
        {compact && (
          <legend className="tw-sr-only">
            {t(locale, "waves.composer.actions.label")}
          </legend>
        )}
        <CompactComposerActionTrayContents inline={!compact}>
          {children}
        </CompactComposerActionTrayContents>
      </motion.fieldset>
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
  return (
    <DropActionTooltip content={tooltip}>
      {compactLabel ? (
        <CompactComposerActionButton
          {...props}
          aria-label={tooltip}
          disabled={disabled}
          label={compactLabel}
          icon={children}
        />
      ) : (
        <button
          {...props}
          type="button"
          aria-label={tooltip}
          disabled={disabled}
          className={`${COMPOSER_ACTION_BUTTON_CLASS_NAME} ${COMPOSER_ACTION_IDLE_CLASS_NAME} disabled:tw-cursor-not-allowed disabled:tw-opacity-50`}
        >
          {children}
        </button>
      )}
    </DropActionTooltip>
  );
}
