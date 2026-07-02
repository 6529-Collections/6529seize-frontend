"use client";

import { usePathname } from "next/navigation";
import { useCookieConsent } from "./CookieConsentContext";
import Link from "next/link";
import Image from "next/image";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileDevice from "@/hooks/isMobileDevice";

export default function CookiesBanner() {
  const { isApp, isAppleMobile } = useDeviceInfo();
  const isMobile = useIsMobileDevice();
  const pathname = usePathname() ?? "";
  const { consent, reject } = useCookieConsent();

  if (["/restricted", "/access"].includes(pathname)) {
    return <></>;
  }

  return (
    <div
      className={`tw-fixed tw-bottom-0 tw-z-[999] tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-bg-[rgb(195,225,252)] tw-px-5 tw-py-[5px] tw-text-[rgb(34,34,34)] ${
        isApp
          ? "tw-bottom-20 tw-mb-[max(5px,env(safe-area-inset-bottom))]"
          : ""
      } ${isApp && isAppleMobile ? "tw-mb-0" : ""} ${
        isApp ? `tw-flex-col` : ""
      }`}
    >
      <span className="tw-flex tw-items-center tw-gap-2">
        <Image
          unoptimized
          src="/intern.png"
          alt="Cookie"
          width={isMobile ? 22 : 40}
          height={isMobile ? 22 : 40}
        />
        <span className="tw-font-bold">seize the cookies of consent</span>
      </span>
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <button
          className="tw-border-0 tw-bg-[rgb(34,34,34)] tw-px-2.5 tw-py-[5px] tw-transition-transform tw-duration-300 tw-ease-in-out hover:tw-scale-[1.02] hover:tw-bg-[#208359] hover:tw-text-white"
          onClick={consent}>
          Accept
        </button>
        <button
          className="tw-border-0 tw-bg-transparent tw-text-[rgb(34,34,34)] tw-no-underline hover:tw-text-[rgb(100,100,100)]"
          onClick={reject}>
          <span className="tw-text-sm">Reject Non-Essential</span>
        </button>
        <Link
          className="tw-border-0 tw-bg-transparent tw-text-[rgb(34,34,34)] tw-no-underline hover:tw-text-[rgb(100,100,100)]"
          href="/about/cookie-policy">
          <span className="tw-text-sm">Learn more</span>
        </Link>
      </span>
    </div>
  );
}
