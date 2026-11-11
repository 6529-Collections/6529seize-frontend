import { DeviceSecurityNotice } from "@/components/device-signing/DeviceSecurityNotice";
import { E2eeNewDeviceNotice } from "@/components/e2ee/devices/E2eeNewDeviceNotice";
import type { ApiDeviceSecurityNotice } from "@/generated/models/ApiDeviceSecurityNotice";
import { useDeviceSecurityNotices } from "@/hooks/device-signing/useDeviceSecurityNotices";
import {
  acknowledgeDeviceGrant,
  acknowledgeEncryptedDmDevice,
  fetchDeviceSecurityNotices,
} from "@/services/api/device-grants-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

const mockAccount = {
  isAuthenticated: true,
  activeProfileProxy: null,
  connectedProfile: { id: "profile" },
};

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAccount,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xwallet" }),
}));
jest.mock("@/hooks/e2ee/useE2ee", () => ({
  useE2ee: () => ({
    engine: null,
    profileId: "profile",
    status: "ready",
    devices: [],
    thisDevice: { deviceKey: "0xOWN" },
  }),
}));
jest.mock("@/services/api/device-grants-api", () => ({
  acknowledgeDeviceGrant: jest.fn(),
  acknowledgeEncryptedDmDevice: jest.fn(),
  fetchDeviceSecurityNotices: jest.fn(),
}));

const combined: ApiDeviceSecurityNotice = {
  device_label: "6529 Desktop on Mac",
  signing_grant_id: "0xgrant",
  signing_device_key: "0xsigning",
  encrypted_dm_device_key: "0xmls",
};

function WaveNoticeConsumer() {
  const { notices, removeNotice } = useDeviceSecurityNotices(true);
  const notice = notices?.find((entry) => entry.signing_grant_id);
  return notice ? (
    <DeviceSecurityNotice notice={notice} onHandled={removeNotice} />
  ) : null;
}

function client() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe("device security notices", () => {
  beforeEach(() => jest.resetAllMocks());

  it("clears one combined authorization in both surfaces and in another client after a refresh", async () => {
    let serverNotices = [combined];
    jest
      .mocked(fetchDeviceSecurityNotices)
      .mockImplementation(async () => [...serverNotices]);
    jest.mocked(acknowledgeDeviceGrant).mockImplementation(async () => {
      serverNotices = [];
      return { id: "0xgrant", notice_acknowledged: true } as Awaited<
        ReturnType<typeof acknowledgeDeviceGrant>
      >;
    });
    const mobile = client();
    const browser = client();
    render(
      <>
        <QueryClientProvider client={mobile}>
          <section aria-label="Mobile Encrypted DMs">
            <E2eeNewDeviceNotice />
          </section>
          <section aria-label="Mobile Wave">
            <WaveNoticeConsumer />
          </section>
        </QueryClientProvider>
        <QueryClientProvider client={browser}>
          <section aria-label="Browser Wave">
            <WaveNoticeConsumer />
          </section>
        </QueryClientProvider>
      </>
    );
    const mobileDms = within(
      screen.getByRole("region", { name: "Mobile Encrypted DMs" })
    );
    const mobileWave = within(
      screen.getByRole("region", { name: "Mobile Wave" })
    );
    const browserWave = within(
      screen.getByRole("region", { name: "Browser Wave" })
    );
    const copy =
      "6529 Desktop on Mac was authorized to read your encrypted DMs and sign posts as you.";
    const noticeGroup = await mobileDms.findByRole("group", { name: copy });
    expect(within(noticeGroup).getByRole("alert")).toHaveTextContent(copy);
    expect(await mobileWave.findByText(copy)).toBeVisible();
    expect(await browserWave.findByText(copy)).toBeVisible();

    await act(async () => {
      fireEvent.click(mobileDms.getByRole("button", { name: /^This was me/u }));
    });
    expect(acknowledgeDeviceGrant).toHaveBeenCalledWith("0xgrant");
    expect(acknowledgeEncryptedDmDevice).not.toHaveBeenCalled();
    expect(mobileDms.queryByText(copy)).toBeNull();
    expect(mobileWave.queryByText(copy)).toBeNull();

    await act(async () => {
      await browser.refetchQueries();
    });
    await waitFor(() => expect(browserWave.queryByText(copy)).toBeNull());
  });

  it("keeps a standalone notice visible when revocation fails", async () => {
    const standalone: ApiDeviceSecurityNotice = {
      ...combined,
      signing_grant_id: null,
      signing_device_key: null,
    };
    const revokeEncryptedDevice = jest.fn().mockRejectedValue(new Error());
    const onHandled = jest.fn();
    render(
      <DeviceSecurityNotice
        notice={standalone}
        onHandled={onHandled}
        revokeEncryptedDevice={revokeEncryptedDevice}
      />
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Revoke access for 6529 Desktop on Mac",
      })
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Revoke access" })
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Couldn’t revoke the device. Try again."
    );
    expect(revokeEncryptedDevice).toHaveBeenCalledWith("0xmls");
    expect(onHandled).not.toHaveBeenCalled();
  });

  it("ignores this DM device and keeps a standalone notice visible after a failed acknowledgment", async () => {
    const standalone: ApiDeviceSecurityNotice = {
      device_label: "6529 Mobile",
      signing_grant_id: null,
      signing_device_key: null,
      encrypted_dm_device_key: "0xstandalone",
    };
    jest.mocked(fetchDeviceSecurityNotices).mockResolvedValue([
      standalone,
      {
        ...standalone,
        device_label: "This device",
        encrypted_dm_device_key: "0xown",
      },
    ]);
    jest.mocked(acknowledgeEncryptedDmDevice).mockRejectedValue(new Error());
    render(
      <QueryClientProvider client={client()}>
        <E2eeNewDeviceNotice />
      </QueryClientProvider>
    );
    const action = await screen.findByRole("button", { name: /^This was me/u });
    expect(screen.queryByText(/This device was authorized/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Revoke access for 6529 Mobile" })
    ).toHaveAccessibleDescription(
      "To revoke access, open Encrypted DMs on a device that can use them."
    );
    await act(async () => {
      fireEvent.click(action);
    });
    expect(acknowledgeEncryptedDmDevice).toHaveBeenCalledWith("0xstandalone");
    expect(acknowledgeDeviceGrant).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Couldn’t acknowledge this device. Try again.")
    ).toHaveRole("alert");
    expect(action).toBeEnabled();
  });
});
