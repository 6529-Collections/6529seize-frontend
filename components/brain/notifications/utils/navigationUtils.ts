import { useRouter } from "next/navigation";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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

  return { navigateToWave };
}
