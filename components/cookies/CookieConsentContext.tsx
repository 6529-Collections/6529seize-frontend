import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "../../services/api/common-api";
import Cookies from "js-cookie";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "../../constants";
import { AuthContext } from "../auth/Auth";

const GTM_ID = "G-71NLVV3KY3";

type CookieConsentContextType = {
  showCookieConsent: boolean;
  consent: () => void;
  reject: () => void;
};

interface CookieConsentResponse {
  is_eu: boolean;
  is_consent: boolean;
}

const CookieConsentContext = createContext<
  CookieConsentContextType | undefined
>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context)
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider"
    );
  return context;
};

type CookieConsentProviderProps = {
  children: ReactNode;
};

type CookieConsent = boolean | undefined;

export const getCookieConsentByName = (name: string): CookieConsent => {
  const cookie = Cookies.get(name);
  if (cookie === "true") {
    return true;
  }
  if (cookie === "false") {
    return false;
  }
  return undefined;
};

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({
  children,
}) => {
  const { setToast } = useContext(AuthContext);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const getCookieConsent = async () => {
    try {
      const essentialCookies = getCookieConsentByName(CONSENT_ESSENTIAL_COOKIE);
      const performanceCookies = getCookieConsentByName(
        CONSENT_PERFORMANCE_COOKIE
      );

      if (performanceCookies) {
        loadPerformanceCookies();
      }

      if (essentialCookies != undefined && performanceCookies != undefined) {
        setShowCookieConsent(false);
        return;
      }
      const response = await commonApiFetch<CookieConsentResponse>({
        endpoint: `policies/country-check`,
      });
      if (response.is_eu) {
        setShowCookieConsent(true);
      } else {
        Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true", { expires: 365 });
        Cookies.set(CONSENT_PERFORMANCE_COOKIE, "true", { expires: 365 });
        getCookieConsent();
      }
    } catch (error) {
      console.error("Failed to fetch cookie consent status", error);
    }
  };

  const consent = async () => {
    try {
      await commonApiPost({ endpoint: `policies/cookies-consent`, body: {} });
      Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true", { expires: 365 });
      Cookies.set(CONSENT_PERFORMANCE_COOKIE, "true", { expires: 365 });
      setToast({
        type: "success",
        message: "Cookie policy accepted!",
      });
      getCookieConsent();
    } catch (error) {
      console.error("Failed to post cookie consent", error);
      setToast({
        type: "error",
        message: "Something went wrong...",
      });
    }
  };

  const reject = async () => {
    try {
      await commonApiDelete({ endpoint: `policies/cookies-consent` });
      Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true");
      Cookies.set(CONSENT_PERFORMANCE_COOKIE, "false");
      setToast({
        type: "success",
        message: "Cookie preferences updated",
      });
      getCookieConsent();
    } catch (error) {
      console.error("Failed to delete cookie consent", error);
      setToast({
        type: "error",
        message: "Something went wrong...",
      });
    }
  };

  const loadPerformanceCookies = () => {
    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GTM_ID}', {
            'cookie_expires': 31536000
        });
      `;
    document.head.appendChild(script2);
  };

  const value = useMemo(
    () => ({ showCookieConsent, consent, reject }),
    [showCookieConsent, consent, reject]
  );

  useEffect(() => {
    getCookieConsent();
  }, []);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};
