import clsx from "clsx";
import type { HTMLAttributes, TableHTMLAttributes } from "react";

import styles from "./AboutLayout.module.css";

export const CONTENT_PAGE_MAIN_CLASS =
  "tailwind-scope tw-min-h-[100dvh] tw-border-0 tw-border-solid tw-border-iron-700 !tw-bg-iron-950 tw-text-iron-300 md:tw-border-l";
export const CONTENT_PAGE_TITLE_CLASS =
  "tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]";
export const CONTENT_PAGE_SECTION_HEADING_CLASS =
  "tw-text-2xl tw-font-semibold tw-leading-tight tw-text-iron-50";
export const CONTENT_PAGE_CONTAINER_CLASS =
  "tw-px-5 tw-pb-20 tw-pt-5 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8";

export const ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME =
  "tw-px-4 sm:tw-px-6 lg:tw-px-8";

export const ABOUT_PAGE_SURFACE_CLASS_NAME =
  "tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-900 tw-bg-[#0D0D0F]";

// Reclaims AboutCol's mobile `tw-px-3` gutter for full-bleed feature surfaces.
// Keep the negative margin and added width paired with that column padding.
export const ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS =
  "max-sm:-tw-mx-3 max-sm:tw-w-[calc(100%+1.5rem)]";

type AboutContainerProps = HTMLAttributes<HTMLDivElement> & {
  readonly fluid?: boolean;
  readonly horizontalPadding?: boolean;
};

type AboutColProps = HTMLAttributes<HTMLDivElement> & {
  readonly xs?: 12;
};

export function AboutContainer({
  children,
  className,
  fluid = false,
  horizontalPadding = true,
  ...props
}: Readonly<AboutContainerProps>) {
  return (
    <div
      className={clsx(
        "tw-mx-auto tw-w-full",
        horizontalPadding && "tw-px-3",
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
