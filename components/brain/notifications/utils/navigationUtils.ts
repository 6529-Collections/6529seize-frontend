import { useRouter } from "next/navigation";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { ApiDrop } from "@/generated/models/ApiDrop";

export function getIsDirectMessage(
  wave: { id: string },
  fallback = false
): boolean {
  const w = wave as {
    chat?: { scope?: { group?: { is_direct_message?: boolean } } };
  };
  return w.chat?.scope?.group?.is_direct_message ?? fallback;
}

export function useWaveNavigation() {
  const router = useRouter();
  const { isApp } = useDeviceInfo();

  const navigateToWave = (
    waveId: string,
    serialNo: number,
    isDirectMessage: boolean
  ) => {
    router.push(
      getWaveRoute({
        waveId,
        serialNo,
        isDirectMessage,
        isApp,
      })
    );
  };

  const createReplyClickHandler = (waveId: string, isDirectMessage: boolean) => {
    return (serialNo: number) => {
      navigateToWave(waveId, serialNo, isDirectMessage);
    };
  };

  const createQuoteClickHandler = (fallbackIsDm = false) => {
    return (quote: ApiDrop) => {
      const quoteIsDm = getIsDirectMessage(quote.wave, fallbackIsDm);
      navigateToWave(quote.wave.id, quote.serial_no, quoteIsDm);
    };
  };

  return { navigateToWave, createReplyClickHandler, createQuoteClickHandler };
}
