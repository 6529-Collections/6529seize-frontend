import clsx from "clsx";
import type { HTMLAttributes, TableHTMLAttributes } from "react";

import styles from "./AboutLayout.module.css";

export const ABOUT_CONTENT_SURFACE_CLASS_NAME = "tw-bg-[#0D0D0F]";
export const ABOUT_CARD_SURFACE_CLASS_NAME = "tw-bg-iron-900/55";

// Shared visual language for the first-level About pages. These tokens are
// semantic so page structure can vary without changing the typography system.
export const ABOUT_PAGE_TITLE_CLASS_NAME =
  "tw-m-0 tw-max-w-3xl tw-text-balance tw-text-3xl tw-font-semibold tw-leading-[1.03] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-text-4xl";
export const ABOUT_SECTION_HEADING_CLASS_NAME =
  "tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-50";
export const ABOUT_COMPACT_HEADING_CLASS_NAME =
  "tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-100";
export const ABOUT_LEAD_TEXT_CLASS_NAME =
  "tw-text-lg tw-font-normal tw-leading-7 tw-text-iron-300";
export const ABOUT_BODY_TEXT_CLASS_NAME =
  "tw-text-base tw-font-normal tw-leading-7 tw-text-iron-300";
export const ABOUT_SUPPORTING_TEXT_CLASS_NAME =
  "tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400";
export const ABOUT_CARD_CLASS_NAME = `tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 ${ABOUT_CARD_SURFACE_CLASS_NAME}`;
export const ABOUT_INSET_CLASS_NAME =
  "tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-[#0D0D0F]/70";
export const ABOUT_SECTION_DIVIDER_CLASS_NAME = "tw-border-white/[0.06]";
export const ABOUT_MEDIA_FRAME_CLASS_NAME =
  "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-950";
export const ABOUT_FRAMED_ICON_WRAPPER_CLASS_NAME =
  "tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid sm:tw-size-11";
export const ABOUT_COMPACT_FRAMED_ICON_WRAPPER_CLASS_NAME =
  "tw-flex tw-size-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid";
export const ABOUT_FRAMED_ICON_CLASS_NAME = "tw-text-base";

export const ABOUT_EDITORIAL_SECTION_HEADING_CLASS_NAME =
  "tw-m-0 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";

export const ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME =
  "tw-m-0 tw-text-[26px] tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50";
export const ABOUT_DOCUMENTATION_NESTED_HEADING_CLASS_NAME =
  "tw-m-0 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50";

export const CONTENT_PAGE_MAIN_CLASS = `tailwind-scope tw-min-h-[100dvh] tw-border-0 tw-border-solid tw-border-iron-700 ${ABOUT_CONTENT_SURFACE_CLASS_NAME} tw-text-iron-300 md:tw-border-l`;
export const CONTENT_PAGE_CONTAINER_CLASS =
  "tw-px-5 tw-pb-20 tw-pt-5 tw-text-iron-50 sm:tw-px-6 lg:tw-px-8";

export const ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME =
  "tw-px-4 sm:tw-px-6 lg:tw-px-8";
export const ABOUT_FEATURE_CONTENT_GUTTER_CLASS_NAME = "tw-px-1 sm:tw-px-2";

export const ABOUT_PAGE_BOUNDARY_CLASS_NAME =
  "tw-min-h-[100dvh] tw-w-full tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800";
export const ABOUT_PAGE_SURFACE_CLASS_NAME = `${ABOUT_PAGE_BOUNDARY_CLASS_NAME} ${ABOUT_CONTENT_SURFACE_CLASS_NAME}`;

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
