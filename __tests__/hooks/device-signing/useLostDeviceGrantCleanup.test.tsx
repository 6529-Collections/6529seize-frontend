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

const announce = (saved: boolean) =>
  globalThis.dispatchEvent(
    new CustomEvent("6529-device-grant-changed", {
      detail: { address: ADDRESS, saved },
    })
  );

const setup = () => {
  const queryClient = new QueryClient();
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  renderHook(() => useLostDeviceGrantCleanup(queryClient));
  return invalidate;
};

describe("useLostDeviceGrantCleanup", () => {
  beforeEach(() => {
    localStorage.clear();
    mockRevokeLost.mockReset().mockResolvedValue("none");
    mockShowToast.mockReset();
  });

  it("revokes the lost grant once a new one is saved, then says so", async () => {
    const invalidate = setup();
    mockRevokeLost.mockResolvedValue("revoked");

    announce(false);
    expect(mockRevokeLost).not.toHaveBeenCalled();

    announce(true);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledTimes(1));
    expect(mockRevokeLost).toHaveBeenCalledWith(ADDRESS);
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

  it("retries a recorded loss when the page loads", async () => {
    localStorage.setItem(`6529-device-key-loss:${ADDRESS}`, "{}");
    setup();
    await waitFor(() => expect(mockRevokeLost).toHaveBeenCalledWith(ADDRESS));
  });
});
