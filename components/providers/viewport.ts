import { Capacitor } from "@capacitor/core";
import { Viewport } from "next";

export const getViewport = (): Viewport => {
  const isCapacitor = Capacitor.isNativePlatform();
  return isCapacitor
    ? {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
      }
    : {
        width: "device-width",
        initialScale: 1,
      };
};
