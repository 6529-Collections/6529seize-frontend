import { useEffect } from "react";
import { useActiveWaveManager } from "./useActiveWaveManager";

function useWaveMessages() {
  const { activeWaveId } = useActiveWaveManager();
  const prepareWave = (waveId: string) => {
    console.log("prepareWave", waveId);
  };

  useEffect(() => {
    if (activeWaveId) {
      prepareWave(activeWaveId);
    }
  }, [activeWaveId]);

  return {
    prepareWave,
  };
}

export default useWaveMessages;
