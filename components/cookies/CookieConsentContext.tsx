"use client";

import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
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
import { useAuth } from "../auth/Auth";
import CookiesBanner from "./CookiesBanner";
import { scheduleGoogleAnalytics } from "./googleAnalytics";
import { rememberCountryHint } from "./usCountryHint";

type CookieConsent = boolean | undefined;

type CookieConsentContextType = {
  showCookieConsent: boolean;
  country: string;
  // True until the first country lookup settles. A failed or empty lookup
  // settles with an empty (unknown) country.
  isCountryPending: boolean;
  performanceConsent: CookieConsent;
  consent: () => void;
  reject: () => void;
};

interface CookieConsentResponse {
  is_eu: boolean;
  is_consent: boolean;
  country: string;
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

export const useOptionalCookieConsent = () => useContext(CookieConsentContext);

type CookieConsentProviderProps = {
  children: ReactNode;
  disabled?: boolean;
};

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

// Bound the first-load country lookup so a stalled request settles as an
// unknown country instead of leaving purchasing visibility pending.
const COUNTRY_CHECK_TIMEOUT_MS = 5_000;

const rejectWhenAborted = (signal: AbortSignal): Promise<never> =>
  new Promise((_resolve, reject) => {
    const rejectAborted = () =>
      reject(new Error("Country check timed out or was cancelled"));
    if (signal.aborted) {
      rejectAborted();
      return;
    }
    signal.addEventListener("abort", rejectAborted, { once: true });
  });

const fetchCountryCheck = async (
  unmountSignal: AbortSignal | undefined
): Promise<CookieConsentResponse> => {
  const lookup = new AbortController();
  const abortLookup = () => lookup.abort();
  unmountSignal?.addEventListener("abort", abortLookup, { once: true });
  const timeoutId = setTimeout(abortLookup, COUNTRY_CHECK_TIMEOUT_MS);
  try {
    return await Promise.race([
      commonApiFetch<CookieConsentResponse>({
        endpoint: `policies/country-check`,
        signal: lookup.signal,
      }),
      rejectWhenAborted(lookup.signal),
    ]);
  } finally {
    clearTimeout(timeoutId);
    unmountSignal?.removeEventListener("abort", abortLookup);
  }
};

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({
  children,
  disabled = false,
}) => {
  const { setToast } = useAuth();
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [country, setCountry] = useState("");
  const [isCountryPending, setIsCountryPending] = useState(true);
  const [performanceConsent, setPerformanceConsent] =
    useState<CookieConsent>(undefined);
  const performanceScriptsLoadedRef = useRef(false);
  const cancelGoogleAnalyticsRef = useRef<(() => boolean) | undefined>(
    undefined
  );

  const loadPerformanceCookies = useCallback(() => {
    if (performanceScriptsLoadedRef.current) {
      return;
    }
    performanceScriptsLoadedRef.current = true;
    cancelGoogleAnalyticsRef.current = scheduleGoogleAnalytics(
      () => getCookieConsentByName(CONSENT_PERFORMANCE_COOKIE) === true
    );
  }, []);

  // Google Analytics loads after first load, so a consent withdrawal or an
  // unmount can still stop it. A load cancelled before it started can be
  // scheduled again by a later consent. Once gtag.js has loaded, withdrawal
  // is a no-op here: a loaded script cannot be unloaded.
  const cancelPendingGoogleAnalytics = useCallback(() => {
    const cancel = cancelGoogleAnalyticsRef.current;
    cancelGoogleAnalyticsRef.current = undefined;
    if (cancel?.()) {
      performanceScriptsLoadedRef.current = false;
    }
  }, []);

  const getCookieConsent = useCallback(
    async (isFirstLoad: boolean = false, unmountSignal?: AbortSignal) => {
      try {
        const essentialCookies = getCookieConsentByName(
          CONSENT_ESSENTIAL_COOKIE
        );
        const performanceCookies = getCookieConsentByName(
          CONSENT_PERFORMANCE_COOKIE
        );
        setPerformanceConsent(performanceCookies);

        if (performanceCookies) {
          loadPerformanceCookies();
        } else {
          cancelPendingGoogleAnalytics();
        }

        if (essentialCookies != undefined && performanceCookies != undefined) {
          setShowCookieConsent(false);
        }

        if (!isFirstLoad) {
          return;
        }

        const response = await fetchCountryCheck(unmountSignal);
        if (unmountSignal?.aborted) {
          return;
        }
        setCountry(response.country);
        rememberCountryHint(response.country);
        if (response.is_eu) {
          setShowCookieConsent(
            essentialCookies == undefined && performanceCookies == undefined
          );
        } else if (performanceCookies === undefined) {
          // Outside the EU, performance cookies default to on, but only for a
          // visitor who has not chosen yet. A stored accept or reject always
          // wins over the regional default and is never rewritten here.
          Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true", { expires: 7 });
          Cookies.set(CONSENT_PERFORMANCE_COOKIE, "true", { expires: 7 });
          getCookieConsent();
        }
      } catch (error) {
        if (!unmountSignal?.aborted) {
          console.error("Failed to fetch cookie consent status", error);
        }
      } finally {
        if (isFirstLoad && !unmountSignal?.aborted) {
          setIsCountryPending(false);
        }
      }
    },
    [cancelPendingGoogleAnalytics, loadPerformanceCookies]
  );

  const consent = useCallback(async () => {
    try {
      await commonApiPost({ endpoint: `policies/cookies-consent`, body: {} });
      Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true", { expires: 365 });
      Cookies.set(CONSENT_PERFORMANCE_COOKIE, "true", { expires: 365 });
      getCookieConsent();
    } catch (error) {
      console.error("Failed to post cookie consent", error);
      setToast({
        type: "error",
        title: "Couldn't save cookie preferences.",
        description: "Please try again.",
      });
    }
  }, [getCookieConsent, setToast]);

  const reject = useCallback(async () => {
    try {
      await commonApiDelete({ endpoint: `policies/cookies-consent` });
      Cookies.set(CONSENT_ESSENTIAL_COOKIE, "true", { expires: 365 });
      Cookies.set(CONSENT_PERFORMANCE_COOKIE, "false", { expires: 365 });
      setToast({
        type: "success",
        message: "Cookie preferences saved.",
      });
      getCookieConsent();
    } catch (error) {
      console.error("Failed to delete cookie consent", error);
      setToast({
        type: "error",
        title: "Couldn't save cookie preferences.",
        description: "Please try again.",
      });
    }
  }, [getCookieConsent, setToast]);

  const noopConsent = useCallback(async () => {}, []);
  const noopReject = useCallback(async () => {}, []);

  const value = useMemo(
    () =>
      disabled
        ? {
            consent: noopConsent,
            reject: noopReject,
            showCookieConsent: false,
            country: "US",
            isCountryPending: false,
            performanceConsent: false as CookieConsent,
          }
        : {
            consent,
            reject,
            showCookieConsent,
            country,
            isCountryPending,
            performanceConsent,
          },
    [
      disabled,
      noopConsent,
      noopReject,
      consent,
      reject,
      showCookieConsent,
      country,
      isCountryPending,
      performanceConsent,
    ]
  );

  useEffect(() => cancelPendingGoogleAnalytics, [cancelPendingGoogleAnalytics]);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }
    const unmount = new AbortController();
    void getCookieConsent(true, unmount.signal);
    return () => unmount.abort();
  }, [disabled, getCookieConsent]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {!disabled && showCookieConsent && <CookiesBanner />}
    </CookieConsentContext.Provider>
  );
};
