import { useRouter } from "next/router";
import styles from "./CookiesBanner.module.scss";
import { useCookieConsent } from "./CookieConsentContext";
import { commonApiPost } from "../../services/api/common-api";

export default function CookiesBanner() {
  const router = useRouter();
  const { showCookieConsent, consent } = useCookieConsent();

  if (!showCookieConsent) {
    return <></>;
  }

  if (["/blocked", "/access"].includes(router.pathname)) {
    return <></>;
  }

  return (
    <div className={styles.banner}>
      <span className="font-bolder">I am cookie consent</span>
      <button className={styles.accept} onClick={consent}>
        accept
      </button>
      <span className="font-bolder">to make me go away</span>
    </div>
  );
}
