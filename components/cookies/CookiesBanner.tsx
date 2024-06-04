import { useRouter } from "next/router";
import styles from "./CookiesBanner.module.scss";
import { useCookieConsent } from "./CookieConsentContext";
import Link from "next/link";
import Image from "next/image";
import useIsMobileDevice from "../../hooks/isMobileDevice";

export default function CookiesBanner() {
  const isMobile = useIsMobileDevice();
  const router = useRouter();
  const { showCookieConsent, consent, reject } = useCookieConsent();

  if (!showCookieConsent) {
    return <></>;
  }

  if (["/restricted", "/access"].includes(router.pathname)) {
    return <></>;
  }

  return (
    <div
      className={`${
        styles.banner
      } d-flex align-items-center justify-content-between gap-2 ${
        isMobile ? `flex-column` : ""
      }`}>
      <span className="d-flex align-items-center gap-2">
        {!isMobile && (
          <Image src="/intern.png" alt="Cookie" width={40} height={40} />
        )}
        <span className="font-bolder">seize the cookies of production</span>
      </span>
      <span className="d-flex align-items-center justify-content-between gap-3">
        <button className={styles.accept} onClick={consent}>
          Accept
        </button>
        <button className={styles.reject} onClick={reject}>
          Reject Non-Essential
        </button>
        <Link className={styles.learnMore} href="/about/cookie-policy">
          Learn more
        </Link>
      </span>
    </div>
  );
}
