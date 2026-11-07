/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });

import { logVersionPoll } from "@/lib/version/versionPollLog.server";

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name] ?? null,
});

const SHA = "0123456789abcdef0123456789abcdef01234567";

describe("logVersionPoll", () => {
  let write: jest.SpyInstance;

  beforeEach(() => {
    write = jest.spyOn(process.stdout, "write").mockReturnValue(true);
  });

  afterEach(() => {
    write.mockRestore();
  });

  it("logs every hidden poll with the tab's build, staleness and age", () => {
    const line = logVersionPoll(
      headers({
        "x-6529-client-version": SHA,
        "x-6529-client-hidden": "1",
        "x-6529-client-age-min": "245",
        "x-6529-client-releases-behind": "3",
      }),
      true,
      () => false
    );

    expect(line).toBe(
      "version_poll v=0123456789ab stale=1 behind=3 age_min=245 hidden=1 rate=1"
    );
    expect(write).toHaveBeenCalledWith(`${line}\n`);
  });

  it("samples one visible poll in four and says so", () => {
    const sample = jest.fn((rate: number) => rate === 4);
    const line = logVersionPoll(
      headers({ "x-6529-client-version": SHA, "x-6529-client-hidden": "0" }),
      false,
      sample
    );
    expect(sample).toHaveBeenCalledWith(4);
    expect(line).toBe(
      "version_poll v=0123456789ab stale=0 behind=0 age_min=0 hidden=0 rate=4"
    );

    expect(
      logVersionPoll(
        headers({ "x-6529-client-version": SHA }),
        false,
        () => false
      )
    ).toBeNull();
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("keeps untrusted header values to a fixed shape", () => {
    const line = logVersionPoll(
      headers({
        "x-6529-client-version": "<script> user@example.com",
        "x-6529-client-hidden": "1",
        "x-6529-client-age-min": "-5",
        "x-6529-client-releases-behind": "999999",
      }),
      false
    );
    expect(line).toBe(
      "version_poll v=other stale=0 behind=999 age_min=0 hidden=1 rate=1"
    );
  });

  it("logs nothing without request headers", () => {
    expect(logVersionPoll(undefined, false)).toBeNull();
    expect(write).not.toHaveBeenCalled();
  });
});
