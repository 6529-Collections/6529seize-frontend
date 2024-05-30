import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { commonApiFetch, commonApiPost } from "../../services/api/common-api";

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
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const getCookieConsent = async () => {
    try {
      const response = await commonApiFetch<CookieConsentResponse>({
        endpoint: `policies/cookies_consent`,
      });
      setShowCookieConsent(response.is_eu && !response.is_consent);
    } catch (error) {
      console.error("Failed to fetch cookie consent status", error);
    }
  };

  const consent = async () => {
    try {
      await commonApiPost({ endpoint: `policies/cookies_consent`, body: {} });
      getCookieConsent();
    } catch (error) {
      console.error("Failed to post cookie consent", error);
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
