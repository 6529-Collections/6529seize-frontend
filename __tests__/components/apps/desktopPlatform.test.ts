import { getDesktopPlatform } from "@/components/apps/desktopPlatform";

describe("desktop download OS detection", () => {
  it.each([
    [{ userAgentData: { platform: "Windows" } }, "windows"],
    [{ platform: "Win32" }, "windows"],
    [{ platform: "Win64" }, "windows"],
    [{ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, "windows"],
    [{ userAgentData: { platform: "macOS" } }, "mac"],
    [{ platform: "MacIntel", maxTouchPoints: 0 }, "mac"],
    [{ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }, "mac"],
    [{ platform: "Linux x86_64" }, "linux"],
    [{ userAgentData: { platform: "Linux", mobile: false } }, "linux"],
    [{ platform: "MacIntel", maxTouchPoints: 5 }, null],
    [
      { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
      null,
    ],
    [
      {
        userAgent: "Mozilla/5.0 (Linux; Android 14)",
        platform: "Linux armv8l",
      },
      null,
    ],
    [
      { userAgent: "Mozilla/5.0 (X11; CrOS x86_64)", platform: "Linux x86_64" },
      null,
    ],
    [{ userAgentData: { platform: "Windows", mobile: true } }, null],
    [{ platform: "Darwin" }, null],
    [{ platform: "Unknown" }, null],
    [{}, null],
  ] as const)("detects %j as %s", (hints, expected) => {
    expect(getDesktopPlatform(hints)).toBe(expected);
  });
});
