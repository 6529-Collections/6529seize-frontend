import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";

import {
  getButtonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonStyles";

interface ButtonLinkProps extends Omit<
  ComponentProps<typeof Link>,
  "children"
> {
  readonly variant?: ButtonVariant | undefined;
  readonly size?: ButtonSize | null | undefined;
  readonly fullWidth?: boolean | undefined;
  readonly children: ReactNode;
}

export default function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...linkProps
}: ButtonLinkProps) {
  return (
    <Link
      {...linkProps}
      className={getButtonClasses({
        variant,
        size,
        fullWidth,
        className: clsx(
          "tw-no-underline hover:tw-no-underline focus:tw-no-underline",
          className
        ),
      })}
    >
      {children}
    </Link>
  );
}
