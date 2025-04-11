import { useState, useEffect } from "react";

/**
 * Hook that provides comprehensive device and screen information.
 * Combines functionality of useIsMobileDevice, useIsMobileScreen, and useHasTouchScreen.
 * 
 * @returns Object containing device information:
 * - isMobileDevice: Whether the device is a mobile device (based on user agent)
 * - isMobileScreen: Whether the screen is mobile-sized (≤ 750px width)
 * - hasTouchScreen: Whether the device has a touch screen
 */
export default function useDeviceInfo() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
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

  // Check for mobile screen size
  useEffect(() => {
    function checkMobile() {
      const screenSize = window.innerWidth;
      setIsMobileScreen(screenSize <= 750);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return {
    isMobileDevice,
    isMobileScreen,
    hasTouchScreen
  };
}