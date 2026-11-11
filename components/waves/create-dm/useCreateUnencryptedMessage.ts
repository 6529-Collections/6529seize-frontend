"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { getDirectMessageAdmissionErrorMessage } from "@/helpers/waves/direct-message-admission.helpers";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";

export function useCreateUnencryptedMessage(onSuccess?: () => void) {
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const { setToast } = useAuth();
  const locale = useBrowserLocale();

  return async (addresses: string[]): Promise<boolean> => {
    try {
      const wave = await createDirectMessageWave({ addresses });
      onSuccess?.();
      navigateToDirectMessage({ waveId: wave.id, router, isApp });
      return true;
    } catch (error) {
      const description =
        getDirectMessageAdmissionErrorMessage(locale, error) ??
        getToastErrorDetails(error) ??
        t(locale, "profilePreferences.dm.createRetry");
      setToast({
        type: "error",
        title: t(locale, "quickDm.createError"),
        description,
      });
      return false;
    }
  };
}
