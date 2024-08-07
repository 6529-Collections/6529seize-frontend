import { useEffect, useState } from "react";

const useIsCapacitor = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any)?.Capacitor) {
      setIsCapacitor(true);
    }
  }, []);

  return { isCapacitor, isNativePlatform };
};

export default useIsCapacitor;
