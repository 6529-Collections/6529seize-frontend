import type { ComponentPropsWithRef } from "react";

export type AuthorBadgeSize = "default" | "compact";

type AuthorBadgeButtonProps = ComponentPropsWithRef<"button"> & {
  readonly size?: AuthorBadgeSize | undefined;
};

const SIZE_CLASSES: Record<AuthorBadgeSize, string> = {
  default: "tw-size-5 [&>svg]:tw-size-3",
  compact: "tw-size-[18px] [&>svg]:tw-size-2.5",
};

export default function AuthorBadgeButton({
  size = "default",
  className = "",
  children,
  ...props
}: AuthorBadgeButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`tw-relative tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-p-0 tw-text-iron-200 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100 ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
