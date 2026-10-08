import { runInNewContext } from "node:vm";
import { SMALL_WEB_STARTUP_SCRIPT } from "@/components/layout/smallWebStartup";

interface Device {
  readonly ua?: string;
  readonly width?: number;
  readonly touch?: number;
  readonly coarse?: boolean;
  readonly fine?: boolean;
  readonly hover?: boolean;
  readonly mobileHint?: boolean;
  readonly savedMouse?: boolean;
  readonly native?: boolean;
  readonly blockedStorage?: boolean;
}

function bootstrap(device: Device) {
  const setAttribute = jest.fn();
  const matches: Record<string, boolean> = {
    "(any-pointer: coarse)": device.coarse ?? false,
    "(any-pointer: fine)": device.fine ?? false,
    "(pointer: fine)": device.fine ?? false,
    "(any-hover: hover)": device.hover ?? false,
    "(hover: hover)": device.hover ?? false,
  };
  runInNewContext(SMALL_WEB_STARTUP_SCRIPT, {
    innerWidth: device.width ?? 390,
    navigator: {
      userAgent: device.ua ?? "Mozilla/5.0",
      userAgentData: { mobile: device.mobileHint },
      maxTouchPoints: device.touch ?? 0,
    },
    matchMedia: (query: string) => ({ matches: matches[query] ?? false }),
    localStorage: {
      getItem: () => {
        if (device.blockedStorage) throw new Error("Storage blocked");
        return device.savedMouse ? "1" : null;
      },
    },
    document: {
      documentElement: {
        hasAttribute: () => device.native ?? false,
        setAttribute,
      },
    },
  });
  return setAttribute;
}

it.each<Device>([
  { ua: "iPhone", touch: 5 },
  { ua: "Android Mobile", touch: 5 },
  { mobileHint: true, fine: true, hover: true },
  { ua: "iPhone", fine: true, hover: true, savedMouse: true },
  { ua: "Macintosh", touch: 5, width: 900 },
  { coarse: true, width: 900 },
  { coarse: true, blockedStorage: true },
  { ua: "Android Mobile", width: 1023 },
])("prepares mobile web before React loads: %j", (device) => {
  expect(bootstrap(device)).toHaveBeenCalledWith(
    "data-small-web-startup",
    "true"
  );
});

it.each<Device>([
  {},
  { ua: "Windows", touch: 10, fine: true, hover: true },
  { ua: "Windows", coarse: true, savedMouse: true },
  { ua: "Macintosh", touch: 5, fine: true, hover: true },
  { ua: "Android", mobileHint: false, touch: 5, fine: true },
  { ua: "iPhone", width: 1024 },
  { ua: "iPhone", native: true },
])("preserves desktop and native layout choices: %j", (device) => {
  expect(bootstrap(device)).not.toHaveBeenCalled();
});

it("keeps the server content available when browser detection fails", () => {
  const setAttribute = jest.fn();
  runInNewContext(SMALL_WEB_STARTUP_SCRIPT, {
    innerWidth: 390,
    document: { documentElement: { hasAttribute: () => false, setAttribute } },
  });
  expect(setAttribute).not.toHaveBeenCalled();
});
