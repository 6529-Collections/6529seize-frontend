import { Capacitor } from "@capacitor/core";
import { triggerVoteSuccessHaptic } from "@/helpers/vote-haptics";

const mockImpact = jest.fn().mockResolvedValue(undefined);
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(), isPluginAvailable: jest.fn() },
  registerPlugin: () => ({
    impact: (...args: unknown[]) => mockImpact(...args),
  }),
}));

beforeEach(() => jest.clearAllMocks());

it.each([false, true])(
  "ignores unavailable native haptics (native %s)",
  (native) => {
    jest.mocked(Capacitor.isNativePlatform).mockReturnValue(native);
    jest.mocked(Capacitor.isPluginAvailable).mockReturnValue(false);
    triggerVoteSuccessHaptic();
    expect(mockImpact).not.toHaveBeenCalled();
  }
);

it("emits one light impact and treats plugin failures as best effort", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  jest.mocked(Capacitor.isPluginAvailable).mockReturnValue(true);
  mockImpact.mockRejectedValueOnce(new Error("Unavailable"));
  triggerVoteSuccessHaptic();
  await Promise.resolve();
  expect(mockImpact).toHaveBeenCalledTimes(1);
  expect(mockImpact).toHaveBeenCalledWith({ style: "LIGHT" });
});
