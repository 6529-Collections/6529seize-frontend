"use client";

import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import Image from "next/image";

const APPS_LOCALE = DEFAULT_LOCALE;

const MOBILE_APPS = [
  {
    name: "iOS",
    href: MOBILE_APP_IOS,
    image: "/app-store.png",
    ariaLabelKey: "apps.mobile.ios.ariaLabel",
  },
  {
    name: "Android",
    href: MOBILE_APP_ANDROID,
    image: "/play-store.png",
    ariaLabelKey: "apps.mobile.android.ariaLabel",
  },
] as const;

export function MobileAppDownloads() {
  return (
    <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-1 xl:tw-grid-cols-2">
      {MOBILE_APPS.map((app) => (
        <MobileAppDownload
          key={app.name}
          platform={app.name}
          className="tw-w-full"
        />
      ))}
    </div>
  );
}

export function MobileAppDownload({
  platform,
  target = "_blank",
  className,
}: {
  readonly platform: "iOS" | "Android";
  readonly target?: "_blank" | "_self" | undefined;
  readonly className?: string | undefined;
}) {
  const app = MOBILE_APPS.find((candidate) => candidate.name === platform)!;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (target === "_self") {
      event.preventDefault();
      // A top-level redirect avoids Play Store errors inside embedded browsers.
      if (window.top) {
        window.top.location.href = app.href;
      }
    }
  };

  return (
    <a
      href={app.href}
      target={target}
      rel="noopener noreferrer"
      aria-label={t(APPS_LOCALE, app.ariaLabelKey)}
      onClick={handleClick}
      className={clsx(
        "tw-inline-flex tw-min-h-14 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black tw-px-3 tw-py-2 tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/60 hover:tw-bg-iron-950 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
        className
      )}
    >
      <Image
        unoptimized
        src={app.image}
        alt=""
        width={180}
        height={54}
        className="tw-h-auto tw-w-full tw-max-w-[180px]"
      />
    </a>
  );
}
