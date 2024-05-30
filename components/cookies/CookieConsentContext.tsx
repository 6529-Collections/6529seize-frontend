// contexts/CookieConsentContext.tsx
import { useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
    await commonApiFetch<CookieConsentResponse>({
      endpoint: `policies/cookies_consent`,
    })
      .then((response) => {
        setShowCookieConsent(response.is_eu && !response.is_consent);
      })
      .catch(() => {});
  };

  const consent = async () => {
    await commonApiPost({
      endpoint: `policies/cookies_consent`,
      body: {},
    })
      .then(() => {
        getCookieConsent();
      })
      .catch(() => {});
  };

  useEffect(() => {
    getCookieConsent();
  }, []);

  return (
    <CookieConsentContext.Provider value={{ showCookieConsent, consent }}>
      {children}
    </CookieConsentContext.Provider>
  );
};
