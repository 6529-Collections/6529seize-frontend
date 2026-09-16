import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { beginVersionReload } from "@/components/version-update/versionReload";
import { preserveWaveScrollPositionForReload } from "@/helpers/waves/wave-visible-serial.helpers";

jest.mock("@/components/version-update/versionReload", () => ({
  beginVersionReload: jest.fn(),
}));
jest.mock("@/helpers/waves/wave-visible-serial.helpers", () => ({
  preserveWaveScrollPositionForReload: jest.fn(),
}));

it("removes only the preview flag and preserves the route before starting reload feedback", () => {
  globalThis.history.replaceState(
    { retained: true },
    "",
    "/waves?wave=abc&showNewVersionToast=true#drop"
  );
  jest.mocked(preserveWaveScrollPositionForReload).mockImplementation(() => {
    expect(location.search).toBe("?wave=abc");
    expect(beginVersionReload).not.toHaveBeenCalled();
  });
  refreshAppVersion();
  expect(location.pathname).toBe("/waves");
  expect(location.hash).toBe("#drop");
  expect(history.state).toEqual({ retained: true });
  expect(preserveWaveScrollPositionForReload).toHaveBeenCalledTimes(1);
  expect(beginVersionReload).toHaveBeenCalledWith(expect.any(Function));
});
