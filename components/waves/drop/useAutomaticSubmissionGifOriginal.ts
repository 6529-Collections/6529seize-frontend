import { useIsMobileDeviceStatus } from "@/hooks/isMobileDevice";
import useDeviceInfo from "@/hooks/useDeviceInfo";

export function useAutomaticSubmissionGifOriginal(): boolean {
  const { isMobileDevice, isDeviceDetectionResolved } =
    useIsMobileDeviceStatus();
  const device = useDeviceInfo();

  // Wait for device detection before allowing a full-size download.
  return (
    isDeviceDetectionResolved &&
    !isMobileDevice &&
    !device.isMobileDevice &&
    !device.isApp &&
    !device.isAppleMobile &&
    !device.hasTouchScreen
  );
}
