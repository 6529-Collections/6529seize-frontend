import { useEffect, useState } from "react";

const useIsCapacitor = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any)?.Capacitor) {
      setIsCapacitor(true);
    }
  }, []);

  return isCapacitor;
};

export default useIsCapacitor;
