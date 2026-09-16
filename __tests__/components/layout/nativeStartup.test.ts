import { runInNewContext } from "node:vm";
import { NATIVE_STARTUP_SCRIPT } from "@/components/layout/nativeStartup";

function bootstrap(runtime: Record<string, unknown>) {
  const setAttribute = jest.fn();
  runInNewContext(NATIVE_STARTUP_SCRIPT, {
    ...runtime,
    document: { documentElement: { setAttribute } },
  });
  return setAttribute;
}

it.each(["ios", "android"])(
  "marks %s before application JS loads",
  (platform) => {
    expect(
      bootstrap({ Capacitor: { getPlatform: () => platform } })
    ).toHaveBeenCalledWith("data-native-runtime", platform);
    expect(
      bootstrap({ CapacitorCustomPlatform: { name: platform } })
    ).toHaveBeenCalledWith("data-native-runtime", platform);
  }
);

it("recognizes native bridges before the Capacitor package initializes", () => {
  expect(bootstrap({ androidBridge: {} })).toHaveBeenCalledWith(
    "data-native-runtime",
    "android"
  );
  expect(
    bootstrap({ webkit: { messageHandlers: { bridge: {} } } })
  ).toHaveBeenCalledWith("data-native-runtime", "ios");
});

it.each([
  {},
  { Capacitor: { getPlatform: () => "web" } },
  { CapacitorCustomPlatform: { name: "electron" } },
  { navigator: { userAgent: "iPhone", standalone: true } },
  { webkit: { messageHandlers: {} } },
  {
    Capacitor: {
      getPlatform: () => {
        throw new Error("unavailable");
      },
    },
  },
])("leaves browsers and failed detection visible: %j", (runtime) => {
  expect(bootstrap(runtime)).not.toHaveBeenCalled();
});

it("does not read cookies or require storage, including on a fresh launch", () => {
  const setAttribute = jest.fn();
  runInNewContext(NATIVE_STARTUP_SCRIPT, {
    androidBridge: {},
    document: {
      documentElement: { setAttribute },
      get cookie() {
        throw new Error("Storage is unavailable");
      },
    },
  });
  expect(setAttribute).toHaveBeenCalledWith("data-native-runtime", "android");
});
