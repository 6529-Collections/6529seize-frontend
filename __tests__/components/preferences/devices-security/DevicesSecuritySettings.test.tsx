import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  classifyDevices,
  type EncryptedDeviceInput,
} from "@/components/preferences/devices-security/classifyDevices";
import DevicesSecuritySettings from "@/components/preferences/devices-security/DevicesSecuritySettings";
import type { SecurityDevicesState } from "@/components/preferences/devices-security/useSecurityDevices";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";

const NOW = Date.UTC(2026, 10, 9, 15, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WALLET = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

let mockState: SecurityDevicesState;
jest.mock(
  "@/components/preferences/devices-security/useSecurityDevices",
  () => ({
    ...jest.requireActual(
      "@/components/preferences/devices-security/useSecurityDevices"
    ),
    useSecurityDevices: () => mockState,
  })
);
jest.mock("@/components/preferences/devices-security/BackupCard", () => ({
  BackupCard: () => null,
}));
let mockAnnounced = new Set<string>();
jest.mock("@/components/e2ee/devices/E2eeNewDeviceNotice", () => ({
  E2eeNewDeviceNotice: () => null,
  useAnnouncedDeviceKeys: () => mockAnnounced,
}));
let mockDeviceSecurity = { proof: "on", canEnableEncryption: false };
jest.mock("@/components/device-signing/DeviceSecurityStatus", () => ({
  useDeviceSecurityState: () => mockDeviceSecurity,
}));

const grant = (id: string, patch: Partial<ApiDeviceGrant> = {}) =>
  ({
    id,
    wallet: WALLET,
    key_type: "ed25519",
    device_key: `0x${id.padStart(64, "0")}`,
    scopes: ["post"],
    device_label: "Brave on Windows",
    domain: "6529.io",
    issued_at: NOW - 10 * DAY,
    created_at: NOW - 10 * DAY,
    expires_at: NOW + 170 * DAY,
    revoked_at: null,
    last_used_at: null,
    ...patch,
  }) as ApiDeviceGrant;

const encrypted = (
  deviceKey: string,
  patch: Partial<EncryptedDeviceInput> = {}
): EncryptedDeviceInput => ({
  deviceKey,
  label: "Brave on Windows",
  platform: "web",
  createdAt: NOW - 10 * DAY,
  lastSeenAt: null,
  expiresAt: NOW + 170 * DAY,
  revokedAt: null,
  isThisDevice: false,
  verified: true,
  grantId: null,
  ...patch,
});

/** The owner's Nov 9 state: this browser set up again after a wipe. */
const ownerDevices = () =>
  classifyDevices({
    grants: [
      grant("this", { created_at: NOW - 2 * HOUR }),
      grant("earlier", { created_at: NOW - DAY, last_used_at: NOW - 3 * HOUR }),
      grant("revoked", {
        device_label: "Chrome on Windows",
        revoked_at: NOW - HOUR,
      }),
    ],
    encryptedDevices: [
      encrypted("e-this", {
        grantId: "this",
        isThisDevice: true,
        createdAt: NOW - 2 * HOUR,
      }),
      encrypted("e-earlier", { grantId: "earlier", createdAt: NOW - DAY }),
      encrypted("phone", {
        label: "6529 app on iPhone",
        platform: "phone",
        lastSeenAt: NOW - HOUR,
      }),
    ],
    ownSigningKeys: [],
    now: NOW,
  });

const state = (
  patch: Partial<SecurityDevicesState> = {}
): SecurityDevicesState => ({
  ...ownerDevices(),
  proxy: false,
  loading: false,
  failed: false,
  retry: jest.fn(),
  localKeysUnreadable: false,
  canRevoke: () => true,
  revokeBlocker: () => null,
  revoke: jest.fn(async () => undefined),
  canRename: () => true,
  rename: jest.fn(async () => undefined),
  signsRevocations: true,
  approvalFor: () => null,
  engine: null,
  ...patch,
});

describe("DevicesSecuritySettings", () => {
  beforeEach(() => {
    mockState = state();
    mockDeviceSecurity = { proof: "on", canEnableEncryption: false };
    mockAnnounced = new Set();
  });

  it("marks a device the new-device alert announces as New", () => {
    mockAnnounced = new Set(["phone"]);
    render(<DevicesSecuritySettings />);
    const others = screen.getByRole("list", { name: "Other devices · 1" });
    expect(within(others).getByText("New")).toBeVisible();
    const earlier = screen.getByRole("list", {
      name: "Earlier setups of this browser · 1",
    });
    expect(within(earlier).queryByText("New")).not.toBeInTheDocument();
  });

  it("pins this browser and groups the rest", () => {
    render(<DevicesSecuritySettings />);
    const thisDevice = screen.getByRole("region", { name: "Brave on Windows" });
    expect(within(thisDevice).getByText("This device")).toBeVisible();
    expect(within(thisDevice).getByText("Signed posts")).toBeVisible();
    expect(within(thisDevice).getByText("Encrypted DMs")).toBeVisible();
    expect(within(thisDevice).getByText("Active now")).toBeVisible();
    expect(within(thisDevice).getByText(/^Expires \w{3} \d{1,2}, 2027$/)).toBeVisible();
    expect(within(thisDevice).getByText(/^Wallet 0x[0-9a-fA-F]{4}…/)).toBeVisible();

    const others = screen.getByRole("list", { name: "Other devices · 1" });
    expect(within(others).getByText("6529 app on iPhone")).toBeVisible();
    expect(within(others).getByText("Signed posts off")).toBeVisible();

    const earlier = screen.getByRole("list", {
      name: "Earlier setups of this browser · 1",
    });
    expect(
      within(earlier).getAllByRole("button", { name: "Revoke Brave on Windows" })
    ).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Clean up…" })).toBeVisible();
  });

  it("keeps ended permissions collapsed in one line", () => {
    render(<DevicesSecuritySettings />);
    const history = screen.getByRole("button", {
      name: "Revoked or expired in the last 30 days · 1",
    });
    expect(history).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/^Chrome on Windows/)).toBeNull();
    fireEvent.click(history);
    expect(history).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/^Chrome on Windows/)).toBeVisible();
    expect(screen.getByText(/Revoked \w{3} \d{1,2}, 2026$/)).toBeVisible();
  });

  it("revokes another device after a confirmation that says what stops", async () => {
    render(<DevicesSecuritySettings />);
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke 6529 app on iPhone?",
    });
    expect(dialog).toHaveTextContent("It will stop receiving encrypted DMs.");
    expect(dialog).toHaveTextContent("Posts it already signed stay verifiable.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke device" }));
    await waitFor(() =>
      expect(mockState.revoke).toHaveBeenCalledWith(
        expect.objectContaining({ id: "phone" })
      )
    );
    expect(await screen.findByText("6529 app on iPhone revoked.")).toBeInTheDocument();
  });

  it("revokes this browser only through More and the stricter dialog", async () => {
    const user = userEvent.setup();
    render(<DevicesSecuritySettings />);
    const thisDevice = screen.getByRole("region", { name: "Brave on Windows" });
    expect(
      within(thisDevice).queryByRole("button", { name: /^Revoke / })
    ).toBeNull();
    await user.click(
      within(thisDevice).getByRole("button", {
        name: "More actions for this browser",
      })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Revoke this browser…" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke this browser?",
    });
    expect(dialog).toHaveTextContent(
      "Brave on Windows is the browser you’re using now."
    );
    expect(dialog).toHaveTextContent("the encrypted chats saved here are deleted");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Revoke this browser" })
    );
    await waitFor(() =>
      expect(mockState.revoke).toHaveBeenCalledWith(
        expect.objectContaining({ id: "this" })
      )
    );
  });

  it("shows why a revoke failed and keeps the dialog open", async () => {
    mockState = state({
      revoke: jest.fn(async () => {
        throw new Error("network");
      }),
    });
    render(<DevicesSecuritySettings />);
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke 6529 app on iPhone?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Revoke device" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Couldn’t revoke the device. Try again."
    );
  });

  describe("Clean up", () => {
    it("revokes the pre-selected earlier setups after one review", async () => {
      render(<DevicesSecuritySettings />);
      fireEvent.click(screen.getByRole("button", { name: "Clean up…" }));
      const dialog = await screen.findByRole("dialog", {
        name: "Clean up earlier setups",
      });
      const checkbox = within(dialog).getByRole("checkbox", {
        name: /^Brave on Windows · Signed posts, Encrypted DMs/,
      });
      expect(checkbox).toBeChecked();
      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole("button", { name: "Revoke 1 device" })
        );
      });
      expect(mockState.revoke).toHaveBeenCalledWith(
        expect.objectContaining({ id: "earlier" })
      );
      expect(await screen.findByText("1 device revoked.")).toBeInTheDocument();
    });

    it("lets the user keep a device and names failures", async () => {
      mockState = state({
        revoke: jest.fn(async () => {
          throw new Error("network");
        }),
      });
      render(<DevicesSecuritySettings />);
      fireEvent.click(screen.getByRole("button", { name: "Clean up…" }));
      const dialog = await screen.findByRole("dialog", {
        name: "Clean up earlier setups",
      });
      const checkbox = within(dialog).getByRole("checkbox");
      fireEvent.click(checkbox);
      expect(
        within(dialog).getByRole("button", { name: "Revoke 0 devices" })
      ).toBeDisabled();
      fireEvent.click(checkbox);
      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole("button", { name: "Revoke 1 device" })
        );
      });
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Couldn’t revoke Brave on Windows."
      );
    });
  });

  it("hides Revoke where it can't be confirmed yet", () => {
    mockState = state({ canRevoke: () => false });
    render(<DevicesSecuritySettings />);
    expect(screen.queryByRole("button", { name: /^Revoke / })).toBeNull();
    expect(screen.queryByRole("button", { name: "Clean up…" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "More actions for this browser" })
    ).toBeNull();
  });

  it("says when this browser's keys can't be read, and warns on every revoke", async () => {
    mockState = state({ localKeysUnreadable: true });
    render(<DevicesSecuritySettings />);
    expect(
      screen.getByText(/couldn’t read its own keys, so it can’t tell which device/)
    ).toHaveProperty("tagName", "OUTPUT");
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    expect(
      await screen.findByText(/this may be the permission this browser uses/)
    ).toBeVisible();
  });

  it("renames this device from its card", async () => {
    render(<DevicesSecuritySettings />);
    fireEvent.click(screen.getByRole("button", { name: "Rename" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Rename this device",
    });
    fireEvent.change(within(dialog).getByLabelText("Device name"), {
      target: { value: "Work laptop" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save name" }));
    await waitFor(() =>
      expect(mockState.rename).toHaveBeenCalledWith(
        expect.objectContaining({ id: "this" }),
        "Work laptop"
      )
    );
  });

  it("renames any other device from its More menu", async () => {
    const user = userEvent.setup();
    render(<DevicesSecuritySettings />);
    await user.click(
      screen.getByRole("button", { name: "More actions for 6529 app on iPhone" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Rename…" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Rename 6529 app on iPhone",
    });
    fireEvent.change(within(dialog).getByLabelText("Device name"), {
      target: { value: "My phone" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save name" }));
    await waitFor(() =>
      expect(mockState.rename).toHaveBeenCalledWith(
        expect.objectContaining({ id: "phone" }),
        "My phone"
      )
    );
  });

  it("says why Revoke is missing and offers the next step", () => {
    mockState = state({
      canRevoke: (device) => device.id !== "phone",
      revokeBlocker: (device) => (device.id === "phone" ? "elsewhere" : null),
    });
    render(<DevicesSecuritySettings />);
    const phoneRow = screen
      .getByText("6529 app on iPhone", { selector: "span" })
      .closest("li")!;
    expect(
      within(phoneRow).queryByRole("button", { name: /^Revoke / })
    ).toBeNull();
    expect(
      within(phoneRow).getByText(
        "Encrypted DMs are open in another 6529 tab. Use them here to revoke this device."
      )
    ).toBeVisible();
    expect(
      within(phoneRow).getByRole("button", { name: "Use here" })
    ).toBeVisible();
  });

  it("offers setup when this browser has no permissions, before any wallet request", () => {
    mockState = state({ thisDevice: null });
    mockDeviceSecurity = { proof: "off", canEnableEncryption: false };
    const setup = jest.fn();
    window.addEventListener("6529:device-setup", setup, { once: true });
    render(<DevicesSecuritySettings />);
    expect(
      screen.getByText(/This browser has no permissions yet/)
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Turn on signed posts" })
    );
    expect(setup).toHaveBeenCalledWith(
      expect.objectContaining({ detail: "posts" })
    );
  });

  it("hides the turn-on action while this browser has both permissions", () => {
    render(<DevicesSecuritySettings />);
    expect(screen.queryByRole("button", { name: /^Turn on/ })).toBeNull();
  });

  it("names both permissions when revoking a combined device", async () => {
    render(<DevicesSecuritySettings />);
    const earlier = screen.getByRole("list", {
      name: "Earlier setups of this browser · 1",
    });
    fireEvent.click(
      within(earlier).getByRole("button", { name: "Revoke Brave on Windows" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke Brave on Windows?",
    });
    expect(dialog).toHaveTextContent(
      "It will stop posting as you and stop receiving encrypted DMs."
    );
    // Signed here, so that device can verify it and delete its chats.
    expect(dialog).toHaveTextContent(
      "It deletes the encrypted chats saved on it once it confirms"
    );
  });

  it("says a combined device keeps its chats when this browser can't sign the revoke", async () => {
    mockState = state({ signsRevocations: false });
    render(<DevicesSecuritySettings />);
    const earlier = screen.getByRole("list", {
      name: "Earlier setups of this browser · 1",
    });
    fireEvent.click(
      within(earlier).getByRole("button", { name: "Revoke Brave on Windows" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Revoke Brave on Windows?",
    });
    expect(dialog).toHaveTextContent(
      "The encrypted chats saved on it stay there until they’re removed on that device"
    );
  });

  it("offers Add device on an own device this browser doesn't add to chats yet", async () => {
    const trustDevice = jest.fn(async () => undefined);
    mockState = state({
      engine: { trustDevice } as unknown as SecurityDevicesState["engine"],
      approvalFor: (device) =>
        device.id === "phone"
          ? {
              deviceKey: "phone",
              label: "6529 app on iPhone",
              platform: "phone",
              createdAt: NOW - 10 * DAY,
              lastSeenAt: NOW - HOUR,
              expiresAt: NOW + 170 * DAY,
              revokedAt: null,
              isThisDevice: false,
              verified: true,
              needsApproval: true,
              wallet: WALLET,
            }
          : null,
    });
    render(<DevicesSecuritySettings />);
    expect(screen.getAllByText("Not added on this device")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: /^Add device signed by wallet/ }));
    expect(trustDevice).toHaveBeenCalledWith("phone");
  });

  it("marks nothing as unknown once this browser's keys were read", async () => {
    render(<DevicesSecuritySettings />);
    expect(screen.queryByText(/couldn’t read its own keys/)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Revoke 6529 app on iPhone" })
    );
    await screen.findByRole("dialog", { name: "Revoke 6529 app on iPhone?" });
    expect(
      screen.queryByText(/this may be the permission this browser uses/)
    ).toBeNull();
  });

  it("shows loading, a recoverable error and the proxy state", () => {
    mockState = state({ loading: true });
    const { rerender } = render(<DevicesSecuritySettings />);
    expect(screen.getByLabelText("Loading devices")).toBeInTheDocument();

    const retry = jest.fn();
    mockState = state({ failed: true, retry });
    rerender(<DevicesSecuritySettings />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn’t load your devices."
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();

    mockState = state({ proxy: true });
    rerender(<DevicesSecuritySettings />);
    expect(
      screen.getByText("Switch to your own profile to manage devices and backup.")
    ).toBeVisible();
    expect(screen.queryByRole("region", { name: "Brave on Windows" })).toBeNull();
  });
});
