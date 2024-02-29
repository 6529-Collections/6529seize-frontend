import { useState, useEffect } from "react";

export default function useIsMobileDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent =
      typeof navigator === "undefined" ? "" : navigator.userAgent;
    const regex =
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;
    const mobile = regex.exec(userAgent) !== null;
    setIsMobile(mobile);
  }, []);

  return isMobile;
}
