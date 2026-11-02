import { useCallback, useEffect, useRef } from "react";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { logErrorSecurely } from "@/utils/error-sanitizer";
import type { AuthRequestActions } from "./authActionTypes";
import { useConnectedAction } from "./useConnectedAction";

interface ProfileProxySwitchOptions {
  readonly activeProxyId: string | null;
  readonly canSignActiveWallet: boolean;
  readonly contextFingerprint: string;
  readonly enableWalletAuthentication: boolean;
  readonly onSwitch: AuthRequestActions["onActiveProfileProxy"];
  readonly setToast: (toast: AppToastInput) => void;
}

export function useProfileProxySwitch(options: ProfileProxySwitchOptions) {
  const {
    activeProxyId,
    canSignActiveWallet,
    enableWalletAuthentication,
    setToast,
  } = options;
  const latestOptionsRef = useRef(options);
  const switchingRef = useRef(false);
  useEffect(() => {
    latestOptionsRef.current = options;
  }, [options]);

  const runConnectedAction = useConnectedAction({
    contextFingerprint: options.contextFingerprint,
    onContextChanged: () =>
      options.setToast({
        message: t(DEFAULT_LOCALE, "auth.proxySwitch.contextChanged"),
        type: "error",
      }),
  });

  const switchProfile = useCallback(async (proxy: ApiProfileProxy | null) => {
    if (switchingRef.current) {
      return false;
    }
    switchingRef.current = true;
    try {
      return await latestOptionsRef.current.onSwitch(proxy);
    } catch (error) {
      logErrorSecurely("profile_proxy_switch", error);
      latestOptionsRef.current.setToast({
        message: t(DEFAULT_LOCALE, "auth.proxySwitch.failed"),
        type: "error",
      });
      return false;
    } finally {
      switchingRef.current = false;
    }
  }, []);

  return useCallback(
    async (proxy: ApiProfileProxy | null): Promise<boolean> => {
      if ((proxy?.id ?? null) === activeProxyId) {
        return true;
      }
      if (!enableWalletAuthentication) {
        return await switchProfile(proxy);
      }
      if (!canSignActiveWallet) {
        setToast({
          message: t(DEFAULT_LOCALE, "auth.proxySwitch.connectWallet"),
          type: "info",
        });
      }
      let result: Promise<boolean> | undefined;
      // Connected actions run synchronously with an available signer. A
      // reconnect resumes later from useConnectedAction's effect instead.
      runConnectedAction(() => {
        result = switchProfile(proxy);
      });
      // The connection modal owns the pending interaction. Resume with the
      // latest signer after reconnecting; keep the profile menu on failure.
      return result ? await result : false;
    },
    [
      activeProxyId,
      canSignActiveWallet,
      enableWalletAuthentication,
      runConnectedAction,
      setToast,
      switchProfile,
    ]
  );
}
