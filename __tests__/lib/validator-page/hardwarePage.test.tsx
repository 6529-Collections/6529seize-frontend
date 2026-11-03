/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import ValidatorHardwareRoute, {
  metadata,
} from "@/app/validator/hardware/page";
import { createAccessCookieValue } from "@/lib/validator-page/accessGate";
import {
  MINIMUM,
  PARTS,
  QUESTIONS,
  SYSTEMS,
} from "@/lib/validator-page/content/hardwareText";

const PASSWORD = "test-only-password-4";
let accessCookie: string | undefined;

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "validator_access" && accessCookie !== undefined
        ? { name, value: accessCookie }
        : undefined,
  }),
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

  it("names the systems the rc.5 packages run on", () => {
    const mac = SYSTEMS.find((s) => s.key === "mac");
    const windows = SYSTEMS.find((s) => s.key === "windows");
    const linux = SYSTEMS.find((s) => s.key === "linux");
    expect(mac?.works).toContain("macOS 11");
    expect(windows?.works).toMatch(/Windows 10 .*Windows 11, 64-bit/);
    expect(windows?.note).toContain("Windows 11 runs it through emulation");
    expect(windows?.note).toContain("Windows 10 on ARM can't run it");
    expect(linux?.works).toMatch(/Ubuntu 22\.04, Debian 12/);
    expect(linux?.check).toContain("Raspberry Pi 4 or 5");
    expect(linux?.check).toContain("64-bit Raspberry Pi OS");
  });

  it("keeps commands, package names and library versions off the page", () => {
    expect(text).not.toMatch(/glibc|libc6|\bapt\b|\.deb\b|\.dmg\b|`|sudo /);
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
