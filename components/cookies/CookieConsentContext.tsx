import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { commonApiFetch, commonApiPost } from "../../services/api/common-api";
import Cookies from "js-cookie";
import { CONSENT_COOKIE } from "../../constants";
import { AuthContext } from "../auth/Auth";

type CookieConsentContextType = {
  showCookieConsent: boolean;
  consent: () => void;
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

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({
  children,
}) => {
  const { setToast } = useContext(AuthContext);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const getCookieConsent = async () => {
    try {
      const cookie = Cookies.get(CONSENT_COOKIE);
      if (cookie && cookie === "true") {
        setShowCookieConsent(false);
        return;
      }
      const response = await commonApiFetch<CookieConsentResponse>({
        endpoint: `policies/cookies_consent`,
      });
      setShowCookieConsent(response.is_eu);
    } catch (error) {
      console.error("Failed to fetch cookie consent status", error);
    }
  };

  const consent = async () => {
    try {
      await commonApiPost({ endpoint: `policies/cookies_consent`, body: {} });
      Cookies.set(CONSENT_COOKIE, "true", { expires: 30 });
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

  const value = useMemo(
    () => ({ showCookieConsent, consent }),
    [showCookieConsent, consent]
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
