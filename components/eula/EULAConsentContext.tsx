"use client";

import Button from "@/components/utils/button/Button";
import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
  EULA_VALIDITY_DAYS,
  EULA_VALIDITY_MS,
} from "@/constants/constants";
import useCapacitor from "@/hooks/useCapacitor";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import { Device } from "@capacitor/device";
import Cookies from "js-cookie";
import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import EULAModal from "./EULAModal";

type EULAConsentState =
  | "checking"
  | "acceptance-required"
  | "accepted"
  | "error";

type EULAConsentContextType = {
  readonly consent: () => Promise<void>;
  readonly isSaving: boolean;
  readonly saveError: string | null;
};

type BackendEULAConsent = {
  readonly accepted_at?: number | undefined;
  readonly eula_version?: string | null | undefined;
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

const getBackendConsentExpiration = (
  consent: BackendEULAConsent,
  now = Date.now()
): Date | null => {
  if (
    consent.eula_version !== CURRENT_EULA_VERSION ||
    typeof consent.accepted_at !== "number" ||
    !Number.isFinite(consent.accepted_at)
  ) {
    return null;
  }

  const expirationMillis = consent.accepted_at + EULA_VALIDITY_MS;
  if (expirationMillis <= now) {
    return null;
  }

  return new Date(expirationMillis);
};

type EULAConsentProviderProps = {
  readonly children: ReactNode;
};

const EULABlockingScreen = ({
  state,
  onRetry,
}: {
  readonly state: "checking" | "error";
  readonly onRetry: () => void;
}) => {
  const locale = useBrowserLocale();

  return (
    <main className="tailwind-scope tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-p-6 tw-text-iron-50">
      <section className="tw-w-full tw-max-w-md tw-rounded-xl tw-border tw-border-white/10 tw-bg-iron-900 tw-p-6 tw-text-center tw-shadow-2xl">
        {state === "checking" ? (
          <p className="tw-m-0" role="status" aria-live="polite">
            {t(locale, "eula.checking")}
          </p>
        ) : (
          <div role="alert">
            <h1 className="tw-mb-3 tw-text-xl tw-font-semibold">
              {t(locale, "eula.verificationError.title")}
            </h1>
            <p className="tw-mb-5 tw-text-iron-300">
              {t(locale, "eula.verificationError.description")}
            </p>
            <Button onClick={onRetry} variant="primary" size="lg">
              {t(locale, "eula.retry")}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
};

export const EULAConsentProvider: React.FC<EULAConsentProviderProps> = ({
  children,
}) => {
  const capacitor = useCapacitor();
  const locale = useBrowserLocale();
  const [consentState, setConsentState] = useState<EULAConsentState>(() => {
    if (!capacitor.isIos) return "accepted";
    return Cookies.get(CONSENT_EULA_COOKIE) === CURRENT_EULA_VERSION
      ? "accepted"
      : "checking";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const consentCheckIdRef = useRef(0);

  const getEULAConsent = useCallback(async () => {
    const consentCheckId = ++consentCheckIdRef.current;
    if (!capacitor.isIos) {
      setConsentState("accepted");
      return;
    }

    setConsentState("checking");
    setSaveError(null);
    try {
      const cookieVersion = Cookies.get(CONSENT_EULA_COOKIE);
      if (cookieVersion === CURRENT_EULA_VERSION) {
        setConsentState("accepted");
        return;
      }

      const deviceId = await Device.getId();
      if (consentCheckId !== consentCheckIdRef.current) return;

      const response = await commonApiFetch<BackendEULAConsent>({
        endpoint: `policies/eula-consent/${deviceId.identifier}`,
      });
      if (consentCheckId !== consentCheckIdRef.current) return;

      const expires = getBackendConsentExpiration(response);
      if (expires) {
        Cookies.set(CONSENT_EULA_COOKIE, CURRENT_EULA_VERSION, { expires });
        setConsentState("accepted");
        return;
      }

      setConsentState("acceptance-required");
    } catch (error) {
      if (consentCheckId !== consentCheckIdRef.current) return;
      console.error("Failed to fetch EULA consent status", error);
      setConsentState("error");
    }
  }, [capacitor.isIos]);

  const consent = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const deviceId = await Device.getId();
      await commonApiPost({
        endpoint: "policies/eula-consent",
        body: {
          device_id: deviceId.identifier,
          platform: "ios",
          eula_version: CURRENT_EULA_VERSION,
        },
      });
      Cookies.set(CONSENT_EULA_COOKIE, CURRENT_EULA_VERSION, {
        expires: EULA_VALIDITY_DAYS,
      });
      setConsentState("accepted");
    } catch (error) {
      console.error("Failed to post EULA consent", error);
      setSaveError(t(locale, "eula.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [locale]);

  const value = useMemo(
    () => ({ consent, isSaving, saveError }),
    [consent, isSaving, saveError]
  );

  useEffect(() => {
    const checkConsent = globalThis.setTimeout(() => {
      void getEULAConsent();
    }, 0);

    return () => {
      globalThis.clearTimeout(checkConsent);
      consentCheckIdRef.current += 1;
    };
  }, [getEULAConsent]);

  if (consentState === "checking" || consentState === "error") {
    return (
      <EULABlockingScreen
        state={consentState}
        onRetry={() => void getEULAConsent()}
      />
    );
  }

  return (
    <EULAConsentContext.Provider value={value}>
      {consentState === "accepted" ? children : <EULAModal />}
    </EULAConsentContext.Provider>
  );
};
