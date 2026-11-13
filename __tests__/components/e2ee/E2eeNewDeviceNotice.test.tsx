import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { E2eeNewDeviceNotice } from "@/components/e2ee/devices/E2eeNewDeviceNotice";
import { writeKnownE2eeDevices } from "@/components/e2ee/e2eeLocalState";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import { formatE2eeDateTime } from "@/components/e2ee/e2eeFormat";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";
import type { E2eeDeviceInfo } from "@/lib/e2ee/types";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
  SELF_ID,
} from "./fakeE2eeEngine";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const GRANT_ID = `0x${"3".repeat(64)}`;

let mockAccount: string | null = ADDRESS;
jest.mock("@/hooks/device-signing/useSignedMessagesAccount", () => ({
  useSignedMessagesAccount: () => mockAccount,
}));

jest.mock("@/hooks/useDisplayTimeZone", () => ({
  useDisplayTimeZone: jest.fn(),
}));
const mockZone = useDisplayTimeZone as jest.MockedFunction<
  typeof useDisplayTimeZone
>;
const AUCKLAND_ZONE: DisplayTimeZone = {
  timeZone: "Pacific/Auckland",
  isLocal: false,
};

let mockGrants: ApiDeviceGrant[] | undefined;
let mockGrantsError = false;
const mockAcknowledgeGrant = jest.fn(async () => true);
jest.mock("@/hooks/device-signing/useDeviceGrants", () => ({
  useDeviceGrants: () => ({ data: mockGrants, isError: mockGrantsError }),
  useAcknowledgeDeviceGrant: () => ({
    acknowledge: mockAcknowledgeGrant,
    isAcknowledging: false,
  }),
}));

const grant = (overrides: Partial<ApiDeviceGrant> = {}): ApiDeviceGrant =>
  ({
    id: GRANT_ID,
    wallet: ADDRESS,
    key_type: "ed25519",
    device_key: `0x${"cc".repeat(32)}`,
    scopes: ["post", "edit", "delete", "react"],
    device_label: "6529 app on iPhone",
    domain: "6529.io",
    issued_at: Date.UTC(2026, 9, 11),
    expires_at: Date.UTC(2027, 3, 1),
    created_at: Date.UTC(2026, 9, 11),
    revoked_at: null,
    last_used_at: null,
    ...overrides,
  }) as ApiDeviceGrant;

const thisDevice = device({
  deviceKey: "0xthis",
  label: "Chrome on Windows",
  isThisDevice: true,
  createdAt: Date.UTC(2026, 9, 1),
});
// Set up for signed posts and encrypted DMs together, after this device.
const phone = device({
  deviceKey: "0xphone",
  label: "6529 app on iPhone",
  platform: "phone",
  createdAt: Date.UTC(2026, 9, 11),
  linkedAuthorProof: true,
  authorProofGrantId: GRANT_ID,
});
// Encrypted DMs only.
const laptop = device({
  deviceKey: "0xlaptop",
  label: "Firefox on macOS",
  createdAt: Date.UTC(2026, 9, 11),
  linkedAuthorProof: false,
});

let rerenderNotice: () => void = () => undefined;

function renderNotice(devices: readonly E2eeDeviceInfo[]) {
  const engine = createFakeE2eeEngine({
    thisDevice,
    devices: [thisDevice, ...devices],
  });
  // This browser already knew only itself: the others are new.
  writeKnownE2eeDevices(SELF_ID, [thisDevice.deviceKey]);
  const client = new QueryClient();
  const tree = () => (
    <QueryClientProvider client={client}>
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeNewDeviceNotice />
      </E2eeTestProvider>
    </QueryClientProvider>
  );
  const { rerender } = render(tree());
  rerenderNotice = () => rerender(tree());
  return engine;
}

describe("E2eeNewDeviceNotice", () => {
  beforeEach(() => {
    localStorage.clear();
    mockAccount = ADDRESS;
    mockGrants = [grant()];
    mockGrantsError = false;
    mockAcknowledgeGrant.mockClear();
    mockZone.mockReturnValue(LOCAL_DISPLAY_TIME_ZONE);
  });

  it("dates the alert in the display time zone", () => {
    mockZone.mockReturnValue(AUCKLAND_ZONE);
    // Oct 11, 12:00 UTC is already Oct 12 in Auckland.
    const late = { ...phone, createdAt: Date.UTC(2026, 9, 11, 12, 0) };
    renderNotice([late]);
    const setUp = formatE2eeDateTime("en-US", late.createdAt, AUCKLAND_ZONE);
    expect(setUp).toMatch(/^Oct 12, 2026/u);
    expect(
      screen.getByText(
        `It can now post as you and read your encrypted DMs. Set up on ${setUp}. If this wasn’t you, revoke it.`
      )
    ).toBeVisible();
  });

  it("waits for this account's grants before a combined device's It was me", async () => {
    mockGrants = undefined;
    renderNotice([phone]);
    expect(screen.getByRole("button", { name: "It was me" })).toBeDisabled();

    mockGrants = [grant()];
    rerenderNotice();
    const itWasMe = screen.getByRole("button", { name: "It was me" });
    expect(itWasMe).toBeEnabled();
    await act(async () => {
      fireEvent.click(itWasMe);
    });
    expect(mockAcknowledgeGrant).toHaveBeenCalledWith(GRANT_ID);
  });

  it("still tries the grant when the list couldn't load", async () => {
    mockGrants = undefined;
    mockGrantsError = true;
    renderNotice([phone]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "It was me" }));
    });
    expect(screen.queryByText(/^New device: /u)).toBeNull();
    expect(mockAcknowledgeGrant).toHaveBeenCalledWith(GRANT_ID);
  });

  it("doesn't acknowledge a grant that is no longer active", async () => {
    mockGrants = [grant({ revoked_at: Date.UTC(2026, 9, 12) })];
    renderNotice([phone]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "It was me" }));
    });
    expect(mockAcknowledgeGrant).not.toHaveBeenCalled();
  });

  it("raises one alert naming both permissions for a combined device", () => {
    renderNotice([phone]);

    expect(screen.getAllByText(/^New device: /u)).toHaveLength(1);
    expect(screen.getByText("New device: 6529 app on iPhone")).toBeVisible();
    expect(
      screen.getByText(
        /^It can now post as you and read your encrypted DMs\. Set up on .+\. If this wasn’t you, revoke it\.$/u
      )
    ).toBeVisible();
  });

  it("names encrypted DMs only for a device without signed posts", () => {
    mockGrants = [];
    renderNotice([laptop]);

    expect(
      screen.getByText(/^It can now read your encrypted DMs\. Set up on /u)
    ).toBeVisible();
    expect(screen.queryByText(/post as you/u)).toBeNull();
  });

  it("“It was me” answers the composer's alert for the same device too", async () => {
    renderNotice([phone]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "It was me" }));
    });

    expect(screen.queryByText(/^New device: /u)).toBeNull();
    expect(mockAcknowledgeGrant).toHaveBeenCalledWith(GRANT_ID);
  });

  it("acknowledges only on this browser for a device without signed posts", async () => {
    mockGrants = [];
    renderNotice([laptop]);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "It was me" }));
    });

    expect(screen.queryByText(/^New device: /u)).toBeNull();
    expect(mockAcknowledgeGrant).not.toHaveBeenCalled();
  });

  it("stays quiet for a device already confirmed above the composer", () => {
    mockGrants = [grant({ notice_acknowledged: true })];
    renderNotice([phone, laptop]);

    expect(screen.getAllByText(/^New device: /u)).toHaveLength(1);
    expect(screen.getByText("New device: Firefox on macOS")).toBeVisible();
  });

  it("revokes only after a confirmation that names both permissions", async () => {
    const engine = renderNotice([phone]);

    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    expect(engine.revokeDevice).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", {
        name: "Revoke access to signed posts and encrypted DMs for 6529 app on iPhone?",
      })
    ).toBeVisible();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Revoke device" }));
    });

    expect(engine.revokeDevice).toHaveBeenCalledWith("0xphone");
    expect(mockAcknowledgeGrant).not.toHaveBeenCalled();
  });
});
