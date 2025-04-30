import { useState, useEffect } from "react";

/**
 * Hook that provides comprehensive device and screen information.
 * Combines functionality of useIsMobileDevice and useHasTouchScreen.
 * 
 * @returns Object containing device information:
 * - isMobileDevice: Whether the device is a mobile device (based on user agent)
 * - hasTouchScreen: Whether the device has a touch screen
 */
export default function useDeviceInfo() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [hasTouchScreen, setHasTouchScreen] = useState(false);

  // Check for mobile device
  useEffect(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const regex = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;
    const mobile = regex.exec(userAgent) !== null;
    setIsMobileDevice(mobile);
  }, []);

  // Check for touch screen
  useEffect(() => {
    setHasTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return {
    isMobileDevice,
    hasTouchScreen
  };
}