import { useRouter } from "next/router";
import styles from "./CookiesBanner.module.scss";
import { useCookieConsent } from "./CookieConsentContext";
import Link from "next/link";

export default function CookiesBanner() {
  const router = useRouter();
  const { showCookieConsent, consent } = useCookieConsent();

  if (!showCookieConsent) {
    return <></>;
  }

  if (["/restricted", "/access"].includes(router.pathname)) {
    return <></>;
  }

  return (
    <div
      className={`${styles.banner} d-flex align-items-center justify-content-center gap-2 flex-wrap`}>
      <span className="font-bolder">
        I am the dreaded cookie consent and I&apos;ll go away if you
      </span>
      <button className={styles.accept} onClick={consent}>
        accept
      </button>
      <span className="font-bolder">my essential cookies</span>
      <Link className={styles.learnMore} href="/about/cookie-policy">
        Learn more
      </Link>
    </div>
  );
}
