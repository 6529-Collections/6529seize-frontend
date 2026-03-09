"use client";

import { useEffect, useState } from "react";

const MOBILE_DEVICE_REGEX =
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

const detectIsMobileDevice = (): boolean => {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return MOBILE_DEVICE_REGEX.test(userAgent);
};

export function useIsMobileDeviceStatus() {
  const [status, setStatus] = useState({
    isMobileDevice: false,
    isDeviceDetectionResolved: false,
  });

  useEffect(() => {
    setStatus({
      isMobileDevice: detectIsMobileDevice(),
      isDeviceDetectionResolved: true,
    });
  }, []);

  return status;
}

export default function useIsMobileDevice() {
  return useIsMobileDeviceStatus().isMobileDevice;
}
