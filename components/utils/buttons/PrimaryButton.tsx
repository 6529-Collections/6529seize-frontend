import { ButtonHTMLAttributes } from "react";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

export enum PrimaryButtonSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  size = PrimaryButtonSize.MEDIUM,
  loading = false,
}: {
  readonly type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly size?: PrimaryButtonSize;
  readonly onClick?: () => void;
  readonly loading?: boolean;
}) {
  const BUTTON_CLASSES: Record<PrimaryButtonSize, string> = {
    [PrimaryButtonSize.SMALL]: "tw-px-3",
    [PrimaryButtonSize.MEDIUM]: "tw-px-4",
  };

  const DISABLED_CLASSES = "tw-opacity-50 tw-text-iron-200";
  const ENABLED_CLASSES =
    "tw-text-white desktop-hover:hover:tw-ring-primary-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset desktop-hover:hover:tw-bg-primary-600";

  const classes = `${BUTTON_CLASSES[size]} ${
    disabled ? DISABLED_CLASSES : ENABLED_CLASSES
  }`;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${classes} tw-relative tw-inline-flex tw-items-center tw-justify-center  tw-bg-primary-500 tw-py-2.5 tw-text-md tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-rounded-lg tw-shadow-sm tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className={loading ? "tw-opacity-0" : ""}>{children}</div>
      {loading && (
        <div className="tw-absolute">
          <CircleLoader />
        </div>
      )}
    </button>
  );
}
