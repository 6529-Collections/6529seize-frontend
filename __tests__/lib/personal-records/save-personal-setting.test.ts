import type { PersonalRecordsMode } from "@/lib/personal-records/personal-records-mode";

let mockEnabled = true;
jest.mock("@/lib/personal-records/personal-records-flag", () => ({
  isPersonalRecordsEnabled: () => mockEnabled,
}));
const mockGetMode = jest.fn<Promise<PersonalRecordsMode>, unknown[]>();
jest.mock("@/lib/personal-records/personal-records-mode", () => ({
  getPersonalRecordsMode: (...args: unknown[]) => mockGetMode(...args),
}));

const mockSubmit = jest.fn();
jest.mock("@/lib/personal-records/personal-records-submit", () => ({
  // The change may come as a builder, run in the owner's queue.
  submitPersonalChange: async (change: unknown, ...rest: unknown[]) =>
    mockSubmit(typeof change === "function" ? await change() : change, ...rest),
}));

const mockOpenDeviceSetup = jest.fn();
jest.mock("@/components/device-signing/deviceSetup", () => ({
  openDeviceSetup: (...args: unknown[]) => mockOpenDeviceSetup(...args),
}));

import { PersonalRecordsError } from "@/lib/personal-records/personal-records-errors";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";

const CHANGE = {
  follows: [],
  items: [{ t: "mute", k: `0x${"0a".repeat(32)}`, b: {} }],
};

const modeOf = (
  mode: PersonalRecordsMode["mode"],
  overrides: Partial<PersonalRecordsMode> = {}
): PersonalRecordsMode => ({
  mode,
  frozen: false,
  owner: `0x${"01".repeat(32)}`,
  siteReader: null,
  providerKeys: [{ id: "test-key", publicKey: `0x${"02".repeat(32)}` }],
  ...overrides,
});

/** An error as common-api throws it in structured mode. */
const apiError = (status: number, code: string) =>
  Object.assign(new Error(code), {
    status,
    response: { status, body: { error: code, code } },
  });

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const write = (overrides: Record<string, unknown> = {}) => ({
  legacy: jest.fn().mockResolvedValue("legacy-result"),
  change: jest.fn().mockResolvedValue(CHANGE),
  recordsResult: jest.fn().mockReturnValue("records-result"),
  ...overrides,
});

let warn: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockEnabled = true;
  mockSubmit.mockResolvedValue({ status: "saved" });
  warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  warn.mockRestore();
});

describe("while settings are paused", () => {
  it.each(["legacy", "shadow", "primary"] as const)(
    "%s mode sends nothing and says so",
    async (name) => {
      mockGetMode.mockResolvedValue(modeOf(name, { frozen: true }));
      const w = write();
      await expect(savePersonalSetting(w)).rejects.toMatchObject({
        reason: "paused",
        message: "Settings are paused for a few minutes. Try again shortly.",
      });
      expect(w.legacy).not.toHaveBeenCalled();
      expect(mockSubmit).not.toHaveBeenCalled();
    }
  );

  it("asks again before refusing, since a cached pause may be over", async () => {
    mockGetMode
      .mockResolvedValueOnce(modeOf("legacy", { frozen: true }))
      .mockResolvedValueOnce(modeOf("legacy"));
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockGetMode).toHaveBeenLastCalledWith({ fresh: true });
  });
});

describe("with the build flag off", () => {
  it("sends today's request and never reads the mode", async () => {
    mockEnabled = false;
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockGetMode).not.toHaveBeenCalled();
    expect(w.change).not.toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});

describe("legacy mode", () => {
  it("sends today's request only", async () => {
    mockGetMode.mockResolvedValue(modeOf("legacy"));
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    await settle();
    expect(w.change).not.toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("writes as today when the mode can't be read", async () => {
    mockGetMode.mockRejectedValue(new Error("network"));
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("reads the mode again after a 409 and writes the records once in primary", async () => {
    mockGetMode
      .mockResolvedValueOnce(modeOf("legacy"))
      .mockResolvedValueOnce(modeOf("primary"));
    const w = write({
      legacy: jest
        .fn()
        .mockRejectedValue(apiError(409, "PERSONAL_RECORDS_REQUIRED")),
    });
    await expect(savePersonalSetting(w)).resolves.toBe("records-result");
    expect(mockGetMode).toHaveBeenLastCalledWith({ fresh: true });
    expect(w.legacy).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps today's error when the mode did not change", async () => {
    mockGetMode.mockResolvedValue(modeOf("legacy"));
    const failure = new Error("Profile not found");
    const w = write({ legacy: jest.fn().mockRejectedValue(failure) });
    await expect(savePersonalSetting(w)).rejects.toBe(failure);
    expect(w.legacy).toHaveBeenCalledTimes(1);
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});

describe("shadow mode", () => {
  it("sends today's request, then the records", async () => {
    const mode = modeOf("shadow");
    mockGetMode.mockResolvedValue(mode);
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    await settle();
    expect(mockSubmit).toHaveBeenCalledWith(CHANGE, mode, { companion: true });
    expect(w.legacy.mock.invocationCallOrder[0]).toBeLessThan(
      mockSubmit.mock.invocationCallOrder[0]!
    );
    expect(w.recordsResult).not.toHaveBeenCalled();
  });

  it("sends a create's companion without `new`, since today's request made it", async () => {
    const mode = modeOf("shadow");
    mockGetMode.mockResolvedValue(mode);
    const members = [`0x${"0b".repeat(32)}`];
    const w = write({
      change: jest.fn().mockResolvedValue({
        follows: [],
        items: [{ t: "alias", k: "crew", b: { members, new: true } }],
      }),
    });
    await savePersonalSetting(w);
    await settle();
    expect(mockSubmit).toHaveBeenCalledWith(
      { follows: [], items: [{ t: "alias", k: "crew", b: { members } }] },
      mode,
      { companion: true }
    );
  });

  it("keeps `new` in primary mode, where the records are the write", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    const change = {
      follows: [],
      items: [{ t: "alias", k: "crew", b: { members: ["x"], new: true } }],
    };
    await savePersonalSetting(
      write({ change: jest.fn().mockResolvedValue(change) })
    );
    expect(mockSubmit.mock.calls[0]![0]).toEqual(change);
  });

  it("logs records that were not saved and never shows them", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    mockSubmit.mockResolvedValue({
      status: "not-saved",
      reason: "refused",
      message: "That profile does not exist.",
      code: "TARGET_NOT_FOUND",
    });
    await expect(savePersonalSetting(write())).resolves.toBe("legacy-result");
    await settle();
    expect(warn).toHaveBeenCalledWith(
      "Personal settings: shadow records were not saved",
      "refused",
      "TARGET_NOT_FOUND"
    );
    expect(mockOpenDeviceSetup).not.toHaveBeenCalled();
  });

  it("swallows a failed submit", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    mockSubmit.mockRejectedValue(apiError(503, "ANCHOR_UNAVAILABLE"));
    await expect(savePersonalSetting(write())).resolves.toBe("legacy-result");
    await settle();
    expect(warn).toHaveBeenCalled();
  });

  it("does not offer signing on no-grant", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    mockSubmit.mockResolvedValue({ status: "no-grant" });
    await expect(savePersonalSetting(write())).resolves.toBe("legacy-result");
    await settle();
    expect(mockOpenDeviceSetup).not.toHaveBeenCalled();
  });

  it("sends no records when today's request fails", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    const w = write({ legacy: jest.fn().mockRejectedValue(new Error("no")) });
    await expect(savePersonalSetting(w)).rejects.toThrow("no");
    await settle();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("reads the snapshot before today's request", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    const snapshot = jest.fn().mockResolvedValue("before");
    const w = write({ snapshot });
    await savePersonalSetting(w);
    await settle();
    expect(snapshot.mock.invocationCallOrder[0]).toBeLessThan(
      w.legacy.mock.invocationCallOrder[0]!
    );
    expect(w.change).toHaveBeenCalledWith("before");
  });

  it("skips the records, not today's request, when the snapshot fails", async () => {
    mockGetMode.mockResolvedValue(modeOf("shadow"));
    const w = write({ snapshot: jest.fn().mockRejectedValue(new Error("x")) });
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    await settle();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});

describe("primary mode", () => {
  it("sends the records only", async () => {
    const mode = modeOf("primary");
    mockGetMode.mockResolvedValue(mode);
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("records-result");
    expect(w.legacy).not.toHaveBeenCalled();
    expect(mockSubmit).toHaveBeenCalledWith(CHANGE, mode, { companion: false });
  });

  it("passes the snapshot to the change", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    const w = write({ snapshot: jest.fn().mockResolvedValue(true) });
    await savePersonalSetting(w);
    expect(w.change).toHaveBeenCalledWith(true);
  });

  it("throws the refusal's readable message and code", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({
      status: "not-saved",
      reason: "refused",
      message: "You can't follow a profile you have blocked.",
      code: "BLOCKED",
    });
    const error = await savePersonalSetting(write()).catch(
      (caught: unknown) => caught
    );
    expect(error).toBeInstanceOf(PersonalRecordsError);
    expect(error).toMatchObject({
      message: "You can't follow a profile you have blocked.",
      code: "BLOCKED",
      reason: "refused",
    });
  });

  it("offers to turn on signing when the device has no grant", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({ status: "no-grant" });
    const w = write();
    await expect(savePersonalSetting(w)).rejects.toMatchObject({
      reason: "no-grant",
    });
    expect(mockOpenDeviceSetup).toHaveBeenCalledWith("posts");
    expect(w.legacy).not.toHaveBeenCalled();
  });

  it("keeps today's route without a grant when the write allows it", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({ status: "no-grant" });
    const w = write({ legacyWithoutGrant: true });
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockOpenDeviceSetup).not.toHaveBeenCalled();
  });

  it("keeps today's route for a wallet without a principal when the write allows it", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({
      status: "not-saved",
      reason: "no-principal",
      message: "x",
    });
    const w = write({ legacyWithoutGrant: true });
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
  });

  it("reads the mode again after 409 PERSONAL_RECORDS_OFF and follows it once", async () => {
    mockGetMode
      .mockResolvedValueOnce(modeOf("primary"))
      .mockResolvedValueOnce(modeOf("legacy"));
    mockSubmit.mockRejectedValue(apiError(409, "PERSONAL_RECORDS_OFF"));
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockGetMode).toHaveBeenLastCalledWith({ fresh: true });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(w.legacy).toHaveBeenCalledTimes(1);
  });

  it("retries only once", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    const off = apiError(409, "PERSONAL_RECORDS_OFF");
    mockSubmit.mockRejectedValue(off);
    const w = write();
    await expect(savePersonalSetting(w)).rejects.toBe(off);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockGetMode).toHaveBeenCalledTimes(2);
    expect(w.legacy).not.toHaveBeenCalled();
  });

  it("reads the mode again after 409 PERSONAL_RECORDS_SHADOW and sends today's request", async () => {
    mockGetMode
      .mockResolvedValueOnce(modeOf("primary"))
      .mockResolvedValueOnce(modeOf("shadow"));
    mockSubmit
      .mockRejectedValueOnce(apiError(409, "PERSONAL_RECORDS_SHADOW"))
      .mockResolvedValue({ status: "saved" });
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(mockGetMode).toHaveBeenLastCalledWith({ fresh: true });
    expect(w.legacy).toHaveBeenCalledTimes(1);
    await settle();
    // Shadow now: the records go again, as today's request's companion.
    expect(mockSubmit).toHaveBeenLastCalledWith(CHANGE, expect.anything(), {
      companion: true,
    });
  });

  it("calls nothing saved that the API took in shadow, and sends today's request", async () => {
    mockGetMode
      .mockResolvedValueOnce(modeOf("primary"))
      .mockResolvedValueOnce(modeOf("shadow"));
    mockSubmit
      .mockResolvedValueOnce({ status: "mode-changed" })
      .mockResolvedValue({ status: "saved" });
    const w = write();
    await expect(savePersonalSetting(w)).resolves.toBe("legacy-result");
    expect(w.recordsResult).not.toHaveBeenCalled();
    expect(w.legacy).toHaveBeenCalledTimes(1);
  });

  it("says so when the mode changed but still reads primary", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({ status: "mode-changed" });
    const w = write();
    await expect(savePersonalSetting(w)).rejects.toMatchObject({
      reason: "mode-changed",
      message: "The setting wasn't saved. Try again.",
    });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(w.legacy).not.toHaveBeenCalled();
  });

  it("tells a proxy plainly, without offering to turn on signing", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({
      status: "not-saved",
      reason: "proxy",
      message: "Proxies can't change settings.",
    });
    await expect(savePersonalSetting(write())).rejects.toMatchObject({
      reason: "proxy",
      message: "Proxies can't change settings.",
    });
    expect(mockOpenDeviceSetup).not.toHaveBeenCalled();
  });

  it("passes the pause through", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    const paused = apiError(503, "PERSONAL_SETTINGS_PAUSED");
    mockSubmit.mockRejectedValue(paused);
    await expect(savePersonalSetting(write())).rejects.toBe(paused);
    expect(mockGetMode).toHaveBeenCalledTimes(1);
  });
});
