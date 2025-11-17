"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import Cookies from "js-cookie";
import { CONSENT_EULA_COOKIE } from "@/constants";
import { AuthContext } from "../auth/Auth";
import EULAModal from "./EULAModal";
import useCapacitor from "@/hooks/useCapacitor";
import { Device } from "@capacitor/device";

type EULAConsentContextType = {
  consent: () => void;
};

const EULAConsentContext = createContext<EULAConsentContextType | undefined>(
  undefined
);

export const useEULAConsent = () => {
  const context = useContext(EULAConsentContext);
  if (!context)
    throw new Error("useEULAConsent must be used within a EULAConsentProvider");
  return context;
};

type EULAConsentProviderProps = {
  children: ReactNode;
};

export const EULAConsentProvider: React.FC<EULAConsentProviderProps> = ({
  children,
}) => {
  const { setToast } = useContext(AuthContext);
  const [showEULAConsent, setShowEULAConsent] = useState(false);

  const capacitor = useCapacitor();
  const { isIos, platform } = capacitor;

  const getEULAConsent = useCallback(async () => {
    try {
      const eulaConsent = Cookies.get(CONSENT_EULA_COOKIE) === "true";
      if (!eulaConsent && isIos) {
        const deviceId = await Device.getId();
        const response = await commonApiFetch<{ accepted_at: number }>({
          endpoint: `policies/eula-consent/${deviceId.identifier}`,
        });
        const expires = response?.accepted_at
          ? new Date(response.accepted_at + 365 * 24 * 60 * 60 * 1000)
          : undefined;
        if (expires) {
          Cookies.set(CONSENT_EULA_COOKIE, "true", {
            expires,
          });
        } else {
          setShowEULAConsent(true);
        }
      } else {
        setShowEULAConsent(false);
      }
    } catch (error) {
      console.error("Failed to fetch EULA consent status", error);
    }
  }, [isIos]);

  const consent = useCallback(async () => {
    try {
      const deviceId = await Device.getId();
      await commonApiPost({
        endpoint: `policies/eula-consent`,
        body: {
          device_id: deviceId.identifier,
          platform,
        },
      });
      Cookies.set(CONSENT_EULA_COOKIE, "true", { expires: 365 });
      getEULAConsent();
    } catch (error) {
      console.error("Failed to post eula consent", error);
      setToast({
        type: "error",
        message: "Something went wrong...",
      });
    }
  }, [getEULAConsent, platform, setToast]);

  const value = useMemo(() => ({ consent }), [consent]);

  useEffect(() => {
    getEULAConsent();
  }, [getEULAConsent]);

  return (
    <EULAConsentContext.Provider value={value}>
      {children}
      {showEULAConsent && <EULAModal />}
    </EULAConsentContext.Provider>
  );
};
