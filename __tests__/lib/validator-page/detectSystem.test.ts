/** @jest-environment node */
import {
  detectFromClientHints,
  detectFromUserAgent,
} from "@/lib/validator-page/detectSystem";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0";
const CHROME_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const FIREFOX_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0";
const FIREFOX_PI =
  "Mozilla/5.0 (X11; Linux aarch64; rv:128.0) Gecko/20100101 Firefox/128.0";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

describe("detectFromUserAgent", () => {
  it.each([
    [CHROME_MAC, { system: "mac", cpu: null }],
    [EDGE_WINDOWS, { system: "windows", cpu: null }],
    // Chromium says x86_64 on every Linux computer; its hints decide.
    [CHROME_LINUX, { system: "linux", cpu: null }],
    [FIREFOX_LINUX, { system: "linux", cpu: "x64" }],
    [FIREFOX_PI, { system: "linux", cpu: "arm64" }],
    [ANDROID, { system: "other", cpu: null }],
    [IPHONE, { system: "other", cpu: null }],
    [null, { system: "other", cpu: null }],
  ])("reads %s", (userAgent, expected) => {
    expect(detectFromUserAgent(userAgent)).toEqual(expected);
  });
});

describe("detectFromClientHints", () => {
  const fallback = detectFromUserAgent(CHROME_LINUX);

  it("tells an ARM64 Linux computer from an x86-64 one", () => {
    expect(detectFromClientHints("Linux", "arm", "64", fallback)).toEqual({
      system: "linux",
      cpu: "arm64",
    });
    expect(detectFromClientHints("Linux", "x86", "64", fallback)).toEqual({
      system: "linux",
      cpu: "x64",
    });
    // A 32-bit system runs none of the files: no CPU, so both buttons show.
    expect(detectFromClientHints("Linux", "arm", "32", fallback)).toEqual({
      system: "linux",
      cpu: null,
    });
  });

  it("names Mac and Windows, and offers nothing special on phones", () => {
    expect(detectFromClientHints("macOS", "arm", "64", fallback).system).toBe(
      "mac"
    );
    expect(detectFromClientHints("Windows", "x86", "64", fallback).system).toBe(
      "windows"
    );
    expect(detectFromClientHints("Android", "arm", "64", fallback)).toEqual({
      system: "other",
      cpu: null,
    });
    expect(detectFromClientHints("", undefined, undefined, fallback)).toBe(
      fallback
    );
  });
});
