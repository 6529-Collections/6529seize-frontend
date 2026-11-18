import { ConnectedProfileDeviceBadge } from "@/components/device-signing/DeviceSecurityStatus";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { DEVICE_GRANTS_REFRESH_MS } from "@/hooks/device-signing/useDeviceGrants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

const wallet = "0x1111111111111111111111111111111111111111";
const profileId = "test-profile";
const now = Date.now();
const grant = {
  id: "local-grant",
  wallet,
  device_key: "local-public-key",
  expires_at: now + 30 * 86_400_000,
  revoked_at: null,
} satisfies Partial<ApiDeviceGrant>;

jest.mock("@/components/auth/Auth", () => ({ useAuth: () => ({}) }));
jest.mock("@/hooks/device-signing/useSignedMessagesAccount", () => ({
  useSignedMessagesAccount: () => null,
}));
jest.mock("@/hooks/device-signing/useMinuteClock", () => ({
  useMinuteClock: () => now,
}));
jest.mock("@/hooks/e2ee/useE2ee", () => ({ useE2ee: () => ({}) }));
jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: () => true }));
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => true,
}));
jest.mock("@/lib/device-signing/device-key-storage", () => ({
  deviceKeyStorage: {
    read: async () => ({ grant, publicKeyHex: grant.device_key }),
  },
}));
jest.mock("@/lib/e2ee/storage", () => ({
  getDefaultE2eeStorage: () => ({
    getDevice: async () => ({
      wallet,
      registered: true,
      provisioned: true,
      grant: { expires_at: grant.expires_at / 1000 },
    }),
  }),
}));
const mockFetchGrants = jest.fn();
jest.mock("@/services/api/device-grants-api", () => ({
  fetchDeviceGrants: () => mockFetchGrants(),
}));

it.each([
  ["absent", undefined, now, "Signed Posts: could not verify"],
  [
    "outdated",
    [grant],
    now - DEVICE_GRANTS_REFRESH_MS,
    "Signed Posts: could not verify",
  ],
  [
    "mismatched",
    [{ ...grant, device_key: "other-key" }],
    now,
    "Signed Posts: off",
  ],
  ["verified", [grant], now, "Signed Posts: on"],
] as const)(
  "shows the correct inactive badge with %s server evidence",
  async (_description, grants, updatedAt, status) => {
    const client = new QueryClient();
    if (grants)
      client.setQueryData([QueryKey.DEVICE_GRANTS, wallet], grants, {
        updatedAt,
      });
    const { container } = render(
      <QueryClientProvider client={client}>
        <ConnectedProfileDeviceBadge address={wallet} profileId={profileId} />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText(/^Signed Posts:/)).toHaveTextContent(status)
    );
    expect(container.querySelector("svg")).toHaveClass(
      status === "Signed Posts: on" ? "tw-text-green" : "tw-text-amber-300"
    );
    expect(mockFetchGrants).not.toHaveBeenCalled();
  }
);
