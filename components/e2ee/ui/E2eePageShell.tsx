"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { hasContent } from "./hasContent";

/**
 * Explicit height for encrypted-message views, from the same layout
 * measurements as plaintext DM threads (header, mobile tabs and dock), so
 * their inner lists and composer scroll correctly on web and in the app.
 */
export function useE2eeViewStyle(): CSSProperties {
  return useLayout().waveViewStyle;
}

interface E2eePageShellProps {
  readonly title: string;
  readonly subtitle?: ReactNode | undefined;
  readonly backHref?: string | undefined;
  readonly backLabel?: string | undefined;
  /** Hide the back link where the messages side pane is visible. */
  readonly backOnSmallScreensOnly?: boolean | undefined;
  readonly actions?: ReactNode | undefined;
  readonly children: ReactNode;
}

/** Header bar and scrolling body for encrypted-message pages. */
export function E2eePageShell({
  title,
  subtitle,
  backHref,
  backLabel,
  backOnSmallScreensOnly = false,
  actions,
  children,
}: E2eePageShellProps) {
  const style = useE2eeViewStyle();
  return (
    <div
      style={style}
      className="tw-flex tw-min-h-0 tw-w-full tw-flex-col tw-bg-black"
    >
      <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
        {backHref !== undefined && backLabel !== undefined ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className={`${backOnSmallScreensOnly ? "lg:tw-hidden" : ""} tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-bg-iron-900 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400`}
          >
            <ArrowLeftIcon aria-hidden="true" className="tw-size-5" />
          </Link>
        ) : null}
        <div className="tw-min-w-0 tw-flex-1">
          <h1 className="tw-m-0 tw-line-clamp-2 tw-break-words tw-text-lg tw-font-semibold tw-leading-snug tw-text-iron-50 sm:tw-truncate">
            {title}
          </h1>
          {hasContent(subtitle) ? (
            <div className="tw-mt-0.5 tw-flex tw-min-w-0 tw-text-xs tw-text-iron-400">
              {subtitle}
            </div>
          ) : null}
        </div>
        {hasContent(actions) ? (
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

/** Centered message block used by gates, empty and error states. */
export function E2eeCenteredMessage({
  title,
  body,
  children,
  icon,
  headingLevel = 2,
}: {
  readonly title: string;
  readonly body?: ReactNode | undefined;
  readonly children?: ReactNode | undefined;
  /** Decorative icon above the title. */
  readonly icon?: ReactNode | undefined;
  readonly headingLevel?: 1 | 2 | undefined;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="tw-mx-auto tw-flex tw-max-w-lg tw-flex-col tw-items-center tw-gap-3 tw-px-6 tw-py-12 tw-text-center">
      {hasContent(icon) ? (
        <span
          aria-hidden="true"
          className="tw-mb-1 tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-emerald-500/10 tw-text-emerald-300 tw-ring-1 tw-ring-inset tw-ring-emerald-400/20"
        >
          {icon}
        </span>
      ) : null}
      <Heading className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        {title}
      </Heading>
      {hasContent(body) ? (
        <div className="tw-text-sm tw-leading-6 tw-text-iron-400">{body}</div>
      ) : null}
      {hasContent(children) ? (
        <div className="tw-mt-2 tw-flex tw-flex-wrap tw-justify-center tw-gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}
