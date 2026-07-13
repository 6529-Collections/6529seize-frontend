"use client";

import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import clsx from "clsx";
import Image from "next/image";

const APPS_LOCALE = DEFAULT_LOCALE;

type MobilePlatform = "iOS" | "Android";

interface MobileApp {
  readonly name: MobilePlatform;
  readonly href: string;
  readonly image: string;
  readonly ariaLabelKey: MessageKey;
}

const MOBILE_APPS = {
  iOS: {
    name: "iOS",
    href: MOBILE_APP_IOS,
    image: "/app-store.png",
    ariaLabelKey: "apps.mobile.ios.ariaLabel",
  },
  Android: {
    name: "Android",
    href: MOBILE_APP_ANDROID,
    image: "/play-store.png",
    ariaLabelKey: "apps.mobile.android.ariaLabel",
  },
} as const satisfies Record<MobilePlatform, MobileApp>;

export function MobileAppDownloads() {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-justify-center tw-gap-4">
      {Object.values(MOBILE_APPS).map((app) => (
        <MobileAppDownload
          key={app.name}
          platform={app.name}
          className="tw-w-full tw-max-w-[220px]"
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
  readonly platform: MobilePlatform;
  readonly target?: "_blank" | "_self" | undefined;
  readonly className?: string | undefined;
}) {
  const app = MOBILE_APPS[platform];

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (target === "_self") {
      event.preventDefault();
      // A top-level redirect avoids Play Store errors inside embedded browsers.
      if (typeof window !== "undefined" && window.top) {
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
        "tw-inline-flex tw-min-h-14 tw-items-center tw-justify-center tw-rounded-lg tw-transition tw-duration-200 tw-ease-out hover:tw-opacity-90 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950",
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
