import { useState, useCallback, useLayoutEffect } from 'react';

interface DeviceInfo {
  readonly isMobileDevice: boolean;
  readonly hasTouchScreen: boolean;
}

/**
 * Hook that provides comprehensive device and screen information.
 * Combines functionality of useIsMobileDevice and useHasTouchScreen.
 * 
 * @returns Object containing device information:
 * - isMobileDevice: Whether the device is a mobile device (based on user agent)
 * - hasTouchScreen: Whether the device has a touch screen
 */
export default function useDeviceInfo(): DeviceInfo {
  const getInfo = useCallback((): DeviceInfo => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined')
      return { isMobileDevice: false, hasTouchScreen: false };

    const nav = navigator as Navigator & {
      msMaxTouchPoints?: number;
      userAgentData?: { mobile?: boolean };
    };

    const hasTouchScreen =
      (nav.maxTouchPoints ?? nav.msMaxTouchPoints ?? 0) > 0 ||
      'ontouchstart' in window ||
      window.matchMedia('(pointer: coarse)').matches;

    const ua = nav.userAgent;
    const uaDataMobile = nav.userAgentData?.mobile;
    const classicMobile = /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    );
    const iPadDesktopUA = ua.includes('Macintosh') && hasTouchScreen;
    const widthMobile = window.matchMedia('(max-width: 768px)').matches;

    const isMobileDevice =
      uaDataMobile ?? (classicMobile || iPadDesktopUA || widthMobile);

    return { isMobileDevice, hasTouchScreen };
  }, []);

  const [info, setInfo] = useState<DeviceInfo>(() => getInfo());

  useLayoutEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setInfo(getInfo());

    mq.addEventListener('change', update);
    window.addEventListener('resize', update);

    const onceTouch = () => {
      update();
      window.removeEventListener('touchstart', onceTouch);
    };
    window.addEventListener('touchstart', onceTouch, { passive: true });

    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('touchstart', onceTouch);
    };
  }, [getInfo]);

  return info;
}