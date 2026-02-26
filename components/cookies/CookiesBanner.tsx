"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import useIsMobileDevice from "@/hooks/isMobileDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";

import { useCookieConsent } from "./CookieConsentContext";
import styles from "./CookiesBanner.module.scss";


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
      } d-flex align-items-center justify-content-between gap-2 ${
        isApp ? `flex-column` : ""
      }`}
    >
      <span className="d-flex align-items-center gap-2">
        <Image
          unoptimized
          src="/intern.png"
          alt="Cookie"
          width={isMobile ? 22 : 40}
          height={isMobile ? 22 : 40}
        />
        <span className="font-bolder">seize the cookies of consent</span>
      </span>
      <span className="d-flex align-items-center justify-content-between gap-3">
        <button className={styles["accept"]} onClick={consent}>
          Accept
        </button>
        <button className={styles["reject"]} onClick={reject}>
          <span className="font-smaller">Reject Non-Essential</span>
        </button>
        <Link className={styles["learnMore"]} href="/about/cookie-policy">
          <span className="font-smaller">Learn more</span>
        </Link>
      </span>
    </div>
  );
}
