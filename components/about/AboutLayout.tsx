import clsx from "clsx";
import type { HTMLAttributes, TableHTMLAttributes } from "react";

import styles from "./AboutLayout.module.css";

export const ABOUT_TEXT_PAGE_CONTAINER_CLASS =
  "tw-px-5 tw-pb-4 tw-pt-4 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8";

// Reclaims AboutCol's mobile `tw-px-3` gutter for full-bleed feature surfaces.
// Keep the negative margin and added width paired with that column padding.
export const ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS =
  "max-sm:-tw-mx-3 max-sm:tw-w-[calc(100%+1.5rem)]";

type AboutContainerProps = HTMLAttributes<HTMLDivElement> & {
  readonly fluid?: boolean;
};

type AboutColProps = HTMLAttributes<HTMLDivElement> & {
  readonly xs?: 12;
};

export function AboutContainer({
  children,
  className,
  fluid = false,
  ...props
}: Readonly<AboutContainerProps>) {
  return (
    <div
      className={clsx(
        "tw-mx-auto tw-w-full tw-px-3",
        !fluid && styles["container"],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutRow({
  children,
  className,
  ...props
}: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx("-tw-mx-3 tw-flex tw-flex-wrap", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutCol({
  children,
  className,
  xs,
  ...props
}: Readonly<AboutColProps>) {
  return (
    <div
      className={clsx(
        xs === 12 ? "tw-w-full tw-flex-none" : "tw-flex-1",
        "tw-min-w-0 tw-px-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AboutTable({
  children,
  className,
  ...props
}: Readonly<TableHTMLAttributes<HTMLTableElement>>) {
  return (
    <table
      className={clsx("tw-mb-4 tw-w-full tw-align-top", className)}
      {...props}
    >
      {children}
    </table>
  );
}
