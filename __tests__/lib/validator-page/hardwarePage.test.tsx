/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import ValidatorHardwareRoute, {
  metadata,
} from "@/app/validator/hardware/page";
import { createAccessCookieValue } from "@/lib/validator-page/accessGate";
import {
  parseReleaseFeed,
  type ReleaseFeedSnapshot,
} from "@/lib/validator-page/releaseFeed";
import {
  KEEP_ON_MINUTES,
  keepOnUntilUtc,
  MINIMUM,
  PARTS,
  QUESTIONS,
  SYSTEMS,
} from "@/lib/validator-page/content/hardwareText";
import { SECONDARY_BUTTON } from "@/components/validator-page/validatorStyles";
import { TEST_RELEASE_ENTRY } from "./fixtures";

const PASSWORD = "test-only-password-4";
const NO_RELEASE: ReleaseFeedSnapshot = {
  state: "missing",
  feed: null,
  signature: null,
  releases: [],
  support: { minSupported: null, deadline: null, deadlineReason: null },
};
let mockSnapshot = NO_RELEASE;
let accessCookie: string | undefined;

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "validator_access" && accessCookie !== undefined
        ? { name, value: accessCookie }
        : undefined,
  }),
}));

jest.mock("@/lib/validator-page/releaseFeed", () => ({
  ...jest.requireActual("@/lib/validator-page/releaseFeed"),
  getReleaseFeedSnapshot: async () => mockSnapshot,
}));

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));

async function renderRoute(): Promise<string> {
  return renderToStaticMarkup(await ValidatorHardwareRoute());
}

describe("/validator/hardware", () => {
  beforeEach(() => {
    process.env["VALIDATOR_PAGE_PASSWORD"] = PASSWORD;
    delete process.env["VALIDATOR_PAGE_PUBLIC"];
    accessCookie = undefined;
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  it("shows the password form, and nothing of the page, without a cookie", async () => {
    const html = await renderRoute();
    expect(html).toContain('id="validator-password"');
    expect(html).toContain('name="next" value="/validator/hardware"');
    expect(html).not.toContain("Your Mac or PC is enough");
  });

  it("refuses a cookie made with another password", async () => {
    accessCookie = createAccessCookieValue("another-password");
    const html = await renderRoute();
    expect(html).toContain('id="validator-password"');
    expect(html).not.toContain("Your Mac or PC is enough");
  });

  it("shows the page with a valid cookie, marked in the section menu", async () => {
    accessCookie = createAccessCookieValue(PASSWORD);
    const html = await renderRoute();
    expect(html).not.toContain('id="validator-password"');
    expect(html).toContain("Your Mac or PC is enough");
    expect(html).toMatch(
      /<a(?=[^>]*aria-current="page")(?=[^>]*href="\/validator\/hardware")[^>]*>/
    );
  });

  it("offers each system's file with the same button as every download", async () => {
    accessCookie = createAccessCookieValue(PASSWORD);
    mockSnapshot = {
      ...NO_RELEASE,
      state: "ok",
      releases: parseReleaseFeed({ releases: [TEST_RELEASE_ENTRY] }),
    };
    const html = await renderRoute();
    for (const [label, file] of [
      ["Download for Mac", "6529-Validator-0.1.0.dmg"],
      ["Download for Windows", "6529-Validator-Setup-0.1.0-x64.exe"],
      ["Linux, x86-64", "6529-validator_0.1.0_amd64.deb"],
      ["Linux, ARM64", "6529-validator_0.1.0_arm64.deb"],
      ["AppImage, x86-64", "6529-Validator-0.1.0-x86_64.AppImage"],
    ]) {
      expect(html).toContain(
        `href="/validator/download/0.1.0-test.2/${file}" class="${SECONDARY_BUTTON}" aria-label="${label}, ${file}"`
      );
    }
    mockSnapshot = NO_RELEASE;
    const empty = await renderRoute();
    expect(empty).toContain(`href="/validator" class="${SECONDARY_BUTTON}"`);
  });

  it("stays out of search engines", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });
});

describe("the hardware page's facts, as of 0.1.0-rc.5", () => {
  const text = [
    ...MINIMUM.flatMap((item) => [item.label, item.value, item.detail]),
    ...SYSTEMS.flatMap((s) => [s.works, s.check, s.note]),
    ...PARTS.flatMap((part) => [part.answer, part.why]),
    ...QUESTIONS.flatMap((q) => [q.question, q.answer]),
  ].join("\n");

  // The cookies below unlock the page only while a password is configured.
  beforeAll(() => {
    process.env["VALIDATOR_PAGE_PASSWORD"] = PASSWORD;
  });

  afterAll(() => {
    delete process.env["VALIDATOR_PAGE_PASSWORD"];
  });

  it("names the systems the rc.5 packages run on", () => {
    const mac = SYSTEMS.find((s) => s.key === "mac");
    const windows = SYSTEMS.find((s) => s.key === "windows");
    const linux = SYSTEMS.find((s) => s.key === "linux");
    expect(mac?.works).toContain("macOS 11");
    expect(windows?.works).toMatch(/Windows 10 .*Windows 11, 64-bit/);
    expect(windows?.note).toContain("Windows 11 runs it through emulation");
    expect(windows?.note).toContain("Windows 10 on ARM can't run it");
    expect(linux?.works).toMatch(/Ubuntu 22\.04, Debian 12/);
    // Neither .deb installs on Fedora; only the AppImage does, on x86-64.
    expect(linux?.works).toContain("Fedora 36 or newer on Intel or AMD.");
    expect(text).not.toMatch(/Fedora[^.]*ARM/);
    expect(linux?.check).toContain("Raspberry Pi 4 or 5");
    expect(linux?.check).toContain("64-bit Raspberry Pi OS");
  });

  it("keeps commands, package names and library versions off the page", () => {
    expect(text).not.toMatch(/glibc|libc6|\bapt\b|\.deb\b|\.dmg\b|`|sudo /);
  });

  it("makes no claim about ETH, staking, pay or who signs", async () => {
    accessCookie = createAccessCookieValue(PASSWORD);
    const html = await renderRoute();
    for (const page of [text, html]) {
      expect(page).not.toMatch(
        /staked|staking|need ETH|no ETH|nobody is paid|only signer/i
      );
    }
    expect(QUESTIONS.map((q) => q.question)).toContain(
      "Do I need my own Ethereum node?"
    );
  });

  it("has no random wait before the vote, and its time on comes from rc.6 (D161)", async () => {
    // 6ba7861f, docs/install/windows.md: on from about 00:15 to 00:30 UTC.
    expect(KEEP_ON_MINUTES).toBe(15);
    accessCookie = createAccessCookieValue(PASSWORD);
    const html = await renderRoute();
    for (const page of [text, html]) {
      expect(page).not.toMatch(/random|two hours|three hours|3 hours|03:15/i);
    }
    expect(html).toContain(`${KEEP_ON_MINUTES} minutes a day`);
    expect(html).toContain(
      `Keep it on: 00:15 to about ${keepOnUntilUtc()} UTC`
    );
  });

  it("covers every part a holder asks about", () => {
    expect(PARTS.map((part) => part.key)).toEqual([
      "cpu",
      "gpu",
      "memory",
      "storage",
      "internet",
      "power",
      "first-start",
    ]);
  });
});
