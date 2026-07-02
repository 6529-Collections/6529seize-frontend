"use client";

import { usePathname } from "next/navigation";
import styles from "./CookiesBanner.module.scss";
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
      className={`${styles["banner"]} ${isApp ? styles["bannerMobile"] : ""} ${
        isApp && isAppleMobile ? styles["bannerIOS"] : ""
      } tw-flex tw-items-center tw-justify-between tw-gap-2 ${
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
        <button className={styles["accept"]} onClick={consent}>
          Accept
        </button>
        <button className={styles["reject"]} onClick={reject}>
          <span className="tw-text-sm">Reject Non-Essential</span>
        </button>
        <Link className={styles["learnMore"]} href="/about/cookie-policy">
          <span className="tw-text-sm">Learn more</span>
        </Link>
      </span>
    </div>
  );
}
