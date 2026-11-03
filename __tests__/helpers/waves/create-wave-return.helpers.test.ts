import { getWaveCreationReturnPath } from "@/helpers/waves/create-wave-return.helpers";

describe("wave creation profile return paths", () => {
  it.each(["/waves/create", "/waves/00000000-0000-4000-8000-000000000529"])(
    "keeps the requested creation context %s",
    (path) => {
      expect(
        getWaveCreationReturnPath(`?returnTo=${encodeURIComponent(path)}`)
      ).toBe(path);
    }
  );
  it.each([
    "//example.com",
    "https://example.com/waves/create",
    "/waves/create?redirect=evil",
    "/waves/../admin",
    "/profile",
    "",
  ])("rejects arbitrary return paths %s", (path) => {
    expect(
      getWaveCreationReturnPath(`?returnTo=${encodeURIComponent(path)}`)
    ).toBeNull();
  });
});
