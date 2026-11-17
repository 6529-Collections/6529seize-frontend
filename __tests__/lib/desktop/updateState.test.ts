import {
  desktopUpdateTone,
  formatDesktopUpdateTime,
  parseDesktopUpdateState,
} from "@/lib/desktop/updateState";

const U4 = {
  id: "U4",
  state: "available",
  label: "Update available",
  headline: "0.1.0-rc.4 is available.",
  running: "0.1.0-rc.3",
  version: "0.1.0-rc.4",
  urgent: false,
  check: true,
  auto: false,
  canInstall: true,
  cannotInstallWhy: null,
  checkedAt: 1_800_000_000,
  note: "Automatic updates are off (Settings).",
};

describe("parseDesktopUpdateState", () => {
  it("reads the state the app reports", () => {
    expect(parseDesktopUpdateState(U4)).toEqual({
      id: "U4",
      state: "available",
      label: "Update available",
      headline: "0.1.0-rc.4 is available.",
      running: "0.1.0-rc.3",
      version: "0.1.0-rc.4",
      check: true,
      auto: false,
      canInstall: true,
      cannotInstallWhy: null,
      checkedAt: 1_800_000_000,
      note: "Automatic updates are off (Settings).",
    });
  });

  it("reads absent optional fields as null", () => {
    expect(
      parseDesktopUpdateState({
        id: "U2",
        state: "not_checked",
        label: null,
        headline: "Not checked yet.",
        check: true,
        auto: true,
        canInstall: true,
      })
    ).toMatchObject({
      label: null,
      running: null,
      version: null,
      checkedAt: null,
      note: null,
    });
  });

  it.each([
    ["not an object", null],
    ["an unknown id", { ...U4, id: "U15" }],
    ["no headline", { ...U4, headline: "" }],
    ["a headline with a line break", { ...U4, headline: "a\nb" }],
    ["a headline with a control character", { ...U4, headline: "a\u0007" }],
    ["a headline that is too long", { ...U4, headline: "a".repeat(401) }],
    ["a missing switch", { ...U4, auto: undefined }],
    ["a switch that is not a boolean", { ...U4, check: "yes" }],
    ["no state name", { ...U4, state: 4 }],
  ])("refuses %s", (_label, value) => {
    expect(parseDesktopUpdateState(value)).toBeNull();
  });

  it("drops a version or time that does not look like one", () => {
    expect(
      parseDesktopUpdateState({
        ...U4,
        version: "<b>1</b>",
        checkedAt: -5,
        label: "x".repeat(41),
      })
    ).toMatchObject({ version: null, checkedAt: null, label: null });
  });
});

describe("desktopUpdateTone", () => {
  it("follows the release standard's colours", () => {
    expect(desktopUpdateTone("U5")).toBe("alert");
    expect(desktopUpdateTone("U12")).toBe("alert");
    expect(desktopUpdateTone("U11")).toBe("warning");
    expect(desktopUpdateTone("U14")).toBe("warning");
    for (const id of ["U1", "U3", "U4", "U6", "U8", "U10"] as const) {
      expect(desktopUpdateTone(id)).toBe("quiet");
    }
  });
});

describe("formatDesktopUpdateTime", () => {
  it("writes the date and time in UTC", () => {
    expect(formatDesktopUpdateTime(1_800_000_000)).toBe("2027-01-15 08:00 UTC");
  });
});
