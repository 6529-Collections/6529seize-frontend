import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  ABOUT_FEATURE_INTERACTIVE_PANEL_CLASS,
  ABOUT_FEATURE_PANEL_CLASS,
} from "./aboutFeaturePageStyles";

interface AboutFeaturePageAction {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

export function AboutFeaturePageHeader({
  artwork,
  description,
  eyebrow,
  primaryAction,
  secondaryAction,
  title,
}: {
  readonly artwork?: ReactNode;
  readonly description: string;
  readonly eyebrow: string;
  readonly primaryAction: AboutFeaturePageAction;
  readonly secondaryAction?: AboutFeaturePageAction;
  readonly title: string;
}) {
  return (
    <header className="tw-px-1 tw-pb-10 tw-pt-4 sm:tw-px-2 sm:tw-pb-12 sm:tw-pt-8">
      <div
        className={clsx(
          "tw-grid tw-items-center tw-gap-8",
          artwork !== undefined &&
            "lg:tw-grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
        )}
      >
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-500">
            {eyebrow}
          </p>
          <h1 className="tw-m-0 tw-mt-3 tw-text-[26px] tw-font-medium tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[32px]">
            {title}
          </h1>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-2xl tw-text-base tw-font-light tw-leading-7 tw-text-iron-300 sm:tw-text-lg sm:tw-leading-8">
            {description}
          </p>
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <AboutFeaturePageLink action={primaryAction} primary />
            {secondaryAction !== undefined && (
              <AboutFeaturePageLink action={secondaryAction} />
            )}
          </div>
        </div>
        {artwork !== undefined && (
          <div
            className={`${ABOUT_FEATURE_PANEL_CLASS} tw-flex tw-min-h-36 tw-items-center tw-justify-center tw-overflow-hidden tw-p-6 sm:tw-min-h-44 sm:tw-p-8`}
          >
            {artwork}
          </div>
        )}
      </div>
    </header>
  );
}

function AboutFeaturePageLink({
  action,
  primary = false,
}: {
  readonly action: AboutFeaturePageAction;
  readonly primary?: boolean;
}) {
  return (
    <Link
      className={clsx(
        "tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-no-underline tw-transition-colors hover:tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black",
        primary
          ? "tw-border-iron-50 tw-bg-iron-50 tw-text-black hover:tw-border-white hover:tw-bg-white hover:tw-text-black"
          : "tw-border-white/10 tw-bg-iron-950/60 tw-text-iron-200 hover:tw-border-white/20 hover:tw-bg-iron-900 hover:tw-text-iron-50"
      )}
      href={action.href}
      rel={action.external === true ? "noopener noreferrer" : undefined}
      target={action.external === true ? "_blank" : undefined}
    >
      <span>{action.label}</span>
      <FontAwesomeIcon
        aria-hidden="true"
        className="tw-text-xs tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transform-none"
        icon={
          action.external === true ? faArrowUpRightFromSquare : faArrowRight
        }
      />
    </Link>
  );
}

export function AboutFeatureCard({
  children,
  icon,
  iconClassName,
  iconWrapperClassName,
  title,
}: {
  readonly children: ReactNode;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly title: string;
}) {
  return (
    <li
      className={`${ABOUT_FEATURE_INTERACTIVE_PANEL_CLASS} tw-flex tw-flex-row tw-items-start tw-gap-4 tw-p-4 md:tw-flex-col md:tw-gap-0 md:tw-p-6`}
    >
      <span
        className={clsx(
          "tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full md:tw-size-12",
          iconWrapperClassName
        )}
      >
        <FontAwesomeIcon
          aria-hidden="true"
          className={clsx("tw-text-lg md:tw-text-xl", iconClassName)}
          icon={icon}
        />
      </span>
      <div className="tw-min-w-0 md:tw-mt-5">
        <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
          {title}
        </h3>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
          {children}
        </p>
      </div>
    </li>
  );
}

export function AboutTimelineStep({
  children,
  markerClassName,
  number,
  title,
}: {
  readonly children: ReactNode;
  readonly markerClassName: string;
  readonly number: string;
  readonly title: string;
}) {
  return (
    <div className="tw-relative tw-grid tw-grid-cols-[2rem_minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[2.5rem_minmax(0,1fr)] sm:tw-gap-5">
      <span
        aria-hidden="true"
        className={clsx(
          "tw-relative tw-z-10 tw-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-black tw-text-sm sm:tw-size-10",
          markerClassName
        )}
      >
        {number}
      </span>
      <div className="tw-min-w-0 tw-pt-1">
        <h3 className="tw-m-0 tw-text-lg tw-font-medium tw-leading-7 tw-text-iron-100">
          {title}
        </h3>
        <div className="tw-mt-2 tw-text-base tw-leading-7 tw-text-iron-300">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AboutFeatureCallout({
  children,
  className,
  icon,
  iconClassName,
  iconWrapperClassName,
  title,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon: IconDefinition;
  readonly iconClassName: string;
  readonly iconWrapperClassName: string;
  readonly title: string;
}) {
  return (
    <div
      className={clsx(
        ABOUT_FEATURE_PANEL_CLASS,
        "tw-flex tw-items-start tw-gap-4 tw-p-4 sm:tw-gap-5 sm:tw-p-6",
        className
      )}
    >
      <span
        className={clsx(
          "tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full",
          iconWrapperClassName
        )}
      >
        <FontAwesomeIcon
          aria-hidden="true"
          className={iconClassName}
          icon={icon}
        />
      </span>
      <div className="tw-min-w-0">
        <h3 className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
          {title}
        </h3>
        <div className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400 sm:tw-text-base sm:tw-leading-7">
          {children}
        </div>
      </div>
    </div>
  );
}
