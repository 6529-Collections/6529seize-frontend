import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";
import type { ComponentPropsWithRef, ReactNode, Ref } from "react";

export const COMPOSER_ACTION_MOTION_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const COMPACT_COMPOSER_ACTION_SLOT_CLASS_NAME =
  "tw-col-start-1 tw-mb-0.5 tw-size-10 tw-self-end desktop-hover:tw-mb-0 desktop-hover:tw-size-9 desktop-hover:tw-self-center";

export const COMPACT_COMPOSER_ACTION_TRAY_CLASS_NAME =
  "tw-col-span-2 tw-col-start-2 tw-overflow-hidden";

export function getCompactComposerTrayMotion(shouldAnimate: boolean) {
  return {
    initial: shouldAnimate ? { opacity: 0, height: 0, y: 4 } : false,
    animate: { opacity: 1, height: "auto", y: 0 },
    exit: { opacity: 0, height: 0, y: shouldAnimate ? 4 : 0 },
    transition: shouldAnimate
      ? COMPOSER_ACTION_MOTION_TRANSITION
      : { duration: 0 },
  };
}

function getToggleStyles(expanded: boolean, required: boolean) {
  if (expanded) {
    return "tw-border-primary-400/20 tw-bg-primary-500/10 tw-text-primary-300";
  }
  if (required) {
    return "tw-border-amber-300/25 tw-bg-amber-300/10 tw-text-amber-200";
  }
  return "tw-border-white/10 tw-bg-iron-800 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white";
}

export function CompactComposerActionToggle({
  ref,
  label,
  trayId,
  expanded,
  shouldAnimate,
  required = false,
  onClick,
  testId,
}: {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly label: string;
  readonly trayId: string;
  readonly expanded: boolean;
  readonly shouldAnimate: boolean;
  readonly required?: boolean;
  readonly onClick: () => void;
  readonly testId?: string;
}) {
  return (
    <motion.button
      ref={ref}
      data-testid={testId}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={trayId}
      animate={{ rotate: expanded ? 45 : 0 }}
      transition={
        shouldAnimate ? COMPOSER_ACTION_MOTION_TRANSITION : { duration: 0 }
      }
      className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:tw-size-9 ${getToggleStyles(expanded, required)}`}
    >
      <FontAwesomeIcon icon={faPlus} aria-hidden="true" className="tw-size-4" />
    </motion.button>
  );
}

function getActionSurfaceStyles({
  pressed,
  disabled,
  required,
}: {
  readonly pressed: boolean | undefined;
  readonly disabled: boolean;
  readonly required: boolean;
}) {
  if (pressed) {
    return "tw-bg-primary-500/15 tw-text-primary-200";
  }
  if (disabled) {
    return "tw-bg-iron-900 tw-text-iron-600";
  }
  if (required) {
    return "tw-bg-amber-300/10 tw-text-amber-200";
  }
  return "tw-bg-iron-800 tw-text-iron-300 group-hover:tw-bg-iron-700 group-hover:tw-text-white";
}

export function CompactComposerActionButton({
  label,
  icon,
  disabled = false,
  pressed,
  required = false,
  ...props
}: Omit<ComponentPropsWithRef<"button">, "children"> & {
  readonly label: string;
  readonly icon: ReactNode;
  readonly pressed?: boolean;
  readonly required?: boolean;
}) {
  return (
    <button
      {...props}
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      className={`tw-group tw-flex tw-w-11 tw-flex-none tw-flex-col tw-items-center tw-gap-1.5 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${
        disabled
          ? "tw-cursor-default tw-text-iron-600"
          : "tw-cursor-pointer tw-text-iron-300 desktop-hover:hover:tw-text-white"
      }`}
    >
      <span
        className={`tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-transition desktop-hover:tw-size-9 ${getActionSurfaceStyles(
          { pressed, disabled, required }
        )}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="tw-line-clamp-2 tw-w-11 tw-text-center tw-text-[11px] tw-font-medium tw-leading-4">
        {label}
      </span>
    </button>
  );
}

export function CompactComposerActionTrayContents({
  children,
  inline = false,
}: {
  readonly children: ReactNode;
  readonly inline?: boolean;
}) {
  return (
    <>
      {!inline && <div aria-hidden="true" className="tw-h-2" />}
      <div
        className={
          inline
            ? "tw-contents"
            : "tw-rounded-2xl tw-border tw-border-white/10 tw-bg-iron-950/95 tw-p-2 tw-pl-0 tw-shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
        }
      >
        <div
          className={
            inline
              ? "tw-contents"
              : "tw-flex tw-flex-wrap tw-items-start tw-justify-start tw-gap-6"
          }
        >
          {children}
        </div>
      </div>
    </>
  );
}
