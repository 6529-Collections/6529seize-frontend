/** @jest-environment node */
import { readFileSync } from "node:fs";
import path from "node:path";
import { NATIVE_IOS_BOOTSTRAP_SCRIPT } from "@/components/eula/nativeIosBootstrap";
import { NATIVE_IOS_COOKIE } from "@/constants/constants";

type FakeRuntime = {
  Capacitor?: { getPlatform: () => string } | undefined;
  CapacitorCustomPlatform?: { name: string } | undefined;
  location: { reload: jest.Mock };
};

function runBootstrap({
  runtime,
  cookie = "",
  persistCookies = true,
}: {
  runtime: Omit<FakeRuntime, "location">;
  cookie?: string;
  persistCookies?: boolean;
}) {
  const cookies: string[] = cookie ? [cookie] : [];
  const fakeDocument = {
    get cookie() {
      return cookies.join("; ");
    },
    set cookie(value: string) {
      if (persistCookies) cookies.push(value.split(";")[0]!);
    },
  };
  const reload = jest.fn();
  const fakeRuntime: FakeRuntime = { ...runtime, location: { reload } };
  // The script reads only `globalThis` and `document`; bind both to fakes.
  new Function("globalThis", "document", NATIVE_IOS_BOOTSTRAP_SCRIPT)(
    fakeRuntime,
    fakeDocument
  );
  return { reload, cookies };
}

const marker = `${NATIVE_IOS_COOKIE}=true`;

it("marks a first iOS launch and reloads before the app JS runs", () => {
  const { reload, cookies } = runBootstrap({
    runtime: { Capacitor: { getPlatform: () => "ios" } },
  });
  expect(cookies).toEqual([marker]);
  expect(reload).toHaveBeenCalledTimes(1);
});

it("supports the custom-platform runtime used before Capacitor loads", () => {
  const { reload } = runBootstrap({
    runtime: { CapacitorCustomPlatform: { name: "ios" } },
  });
  expect(reload).toHaveBeenCalledTimes(1);
});

it("does nothing when the marker is already present", () => {
  const { reload, cookies } = runBootstrap({
    runtime: { Capacitor: { getPlatform: () => "ios" } },
    cookie: marker,
  });
  expect(cookies).toEqual([marker]);
  expect(reload).not.toHaveBeenCalled();
});

it("never reloads when the cookie cannot be stored", () => {
  const { reload } = runBootstrap({
    runtime: { Capacitor: { getPlatform: () => "ios" } },
    persistCookies: false,
  });
  expect(reload).not.toHaveBeenCalled();
});

it.each([
  ["Android", { Capacitor: { getPlatform: () => "android" } }],
  ["web", { Capacitor: { getPlatform: () => "web" } }],
  ["a page without Capacitor", {}],
])("leaves %s alone", (_label, runtime) => {
  const { reload, cookies } = runBootstrap({ runtime });
  expect(cookies).toEqual([]);
  expect(reload).not.toHaveBeenCalled();
});

it("runs as a synchronous inline head script, not a queued next/script", () => {
  // next/script's beforeInteractive queue waits for the Next runtime to
  // download, so a first launch would fetch all app JS and then discard it.
  const layout = readFileSync(
    path.join(process.cwd(), "app/layout.tsx"),
    "utf8"
  );
  expect(layout).toMatch(
    /<script\s+id="native-ios-platform-bootstrap"\s+dangerouslySetInnerHTML=\{\{ __html: NATIVE_IOS_BOOTSTRAP_SCRIPT \}\}/
  );
  expect(layout).not.toMatch(/<Script\s+id="native-ios-platform-bootstrap"/);
});
