import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";

const mockRevokeLost = jest.fn();
jest.mock("@/lib/device-signing/replace-lost-grant", () => ({
  revokeLostDeviceGrant: (...args: unknown[]) => mockRevokeLost(...args),
}));

const mockShowToast = jest.fn();
jest.mock("@/components/utils/toast/AppToast", () => ({
  showAppToast: (...args: unknown[]) => mockShowToast(...args),
}));

import { useLostDeviceGrantCleanup } from "@/hooks/device-signing/useLostDeviceGrantCleanup";

const ADDRESS = "0xabcdef0000000000000000000000000000000001";
const PROFILE = "profile-1";

const announce = (saved: boolean) =>
  globalThis.dispatchEvent(
    new CustomEvent("6529-device-grant-changed", {
      detail: { address: ADDRESS, saved },
    })
  );

const setup = () => {
  const queryClient = new QueryClient();
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  renderHook(() => useLostDeviceGrantCleanup(queryClient, ADDRESS, PROFILE));
  return invalidate;
};

describe("useLostDeviceGrantCleanup", () => {
  beforeEach(() => {
    localStorage.clear();
    mockRevokeLost.mockReset().mockResolvedValue("none");
    mockShowToast.mockReset();
  });

  it("revokes the lost grant once a new one is saved, then says so", async () => {
    mockRevokeLost.mockResolvedValue("revoked");
    const invalidate = setup();

    // The attempt on sign-in already finds the pending cleanup.
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledTimes(1));
    expect(mockRevokeLost).toHaveBeenCalledWith({
      wallet: ADDRESS,
      profileId: PROFILE,
    });
    mockRevokeLost.mockClear();

    announce(false);
    expect(mockRevokeLost).not.toHaveBeenCalled();
    announce(true);
    await waitFor(() => expect(mockRevokeLost).toHaveBeenCalledTimes(1));
    expect(mockShowToast).toHaveBeenCalledWith({
      type: "success",
      message:
        "Signed Posts are on again. This browser's earlier permission was removed.",
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("refreshes the list without a toast when the revoke failed", async () => {
    const invalidate = setup();
    mockRevokeLost.mockResolvedValue("failed");

    announce(true);
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it("stays quiet when there was nothing to revoke", async () => {
    const invalidate = setup();

    announce(true);
    await waitFor(() => expect(mockRevokeLost).toHaveBeenCalled());
    await Promise.resolve();
    expect(mockShowToast).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("cleans up only for the signed-in account, until A signs back in", async () => {
    const queryClient = new QueryClient();
    const OTHER = "0xabcdef0000000000000000000000000000000002";
    const { rerender } = renderHook(
      ({
        wallet,
        profileId,
      }: {
        wallet: string | null;
        profileId: string | null;
      }) => useLostDeviceGrantCleanup(queryClient, wallet, profileId),
      {
        initialProps: { wallet: OTHER, profileId: "profile-2" } as {
          wallet: string | null;
          profileId: string | null;
        },
      }
    );
    await waitFor(() => expect(mockRevokeLost).toHaveBeenCalledTimes(1));
    expect(mockRevokeLost).toHaveBeenCalledWith({
      wallet: OTHER,
      profileId: "profile-2",
    });

    // A grant saved for A's wallet while B is signed in is not B's to handle.
    announce(true);
    await Promise.resolve();
    expect(mockRevokeLost).toHaveBeenCalledTimes(1);

    rerender({ wallet: null, profileId: null });
    expect(mockRevokeLost).toHaveBeenCalledTimes(1);

    rerender({ wallet: ADDRESS, profileId: PROFILE });
    await waitFor(() =>
      expect(mockRevokeLost).toHaveBeenLastCalledWith({
        wallet: ADDRESS,
        profileId: PROFILE,
      })
    );
    expect(mockRevokeLost).toHaveBeenCalledTimes(2);
  });
});
