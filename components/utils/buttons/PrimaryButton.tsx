import { ButtonHTMLAttributes } from "react";

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button",
}: {
  readonly type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
}) {

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${
        disabled
          ? "tw-opacity-50 tw-text-iron-200"
          : "tw-text-white  hover:tw-ring-primary-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset hover:tw-bg-primary-600"
      } tw-inline-flex tw-items-center tw-justify-center  tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-rounded-lg tw-shadow-sm tw-transition tw-duration-300 tw-ease-out`}
    >
      {children}
    </button>
  );
}
