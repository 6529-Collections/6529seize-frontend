import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { E2eeRouteGate } from "@/components/e2ee/gate/E2eeRouteGate";
import type { ApiE2eeDevice } from "@/lib/e2ee/api-types";
import {
  contextFor,
  createFakeE2eeEngine,
  device,
  E2eeTestProvider,
} from "./fakeE2eeEngine";

const mockGetMe = jest.fn();

jest.mock("@/lib/e2ee/api", () => ({
  createE2eeApiClient: () => ({ getMe: mockGetMe }),
}));

jest.mock("@/components/e2ee/e2eeDeviceLabel", () => ({
  getE2eeDeviceLabel: () => "Chrome on Windows",
}));

const DAY = 86_400_000;
const ENROLL_BUTTON = "Turn on encrypted messages (one signature)";
const WARNING_TITLE = "This browser seems to delete its data when it closes";
const SOFT_WARNING =
  "This browser didn’t confirm that it will keep this site’s data. It may delete your encrypted history to free up space or when its data is cleared.";

function serverDevice(
  daysAgo: number,
  overrides: Partial<ApiE2eeDevice> = {}
): ApiE2eeDevice {
  const createdAt = Date.now() - daysAgo * DAY;
  return {
    device_key: `0x${String(daysAgo).padStart(64, "0")}`,
    profile_id: "profile-self",
    grant: {
      wallet: `0x${"1".repeat(40)}`,
      device_key: `0x${String(daysAgo).padStart(64, "0")}`,
      ciphersuite: 79,
      issued_at: Math.floor(createdAt / 1000),
      expires_at: Math.floor(createdAt / 1000) + 180 * 86_400,
      origin: "6529.io",
    },
    grant_id: `0x${"2".repeat(64)}`,
    wallet_signature: `0x${"3".repeat(130)}`,
    verified_via: "eoa",
    label: "Chrome on Windows",
    platform: "web",
    created_at: createdAt,
    last_seen_at: createdAt,
    revoked_at: null,
    revocation: null,
    ...overrides,
  };
}

const me = (devices: ApiE2eeDevice[]) => ({
  profile_id: "profile-self",
  devices,
  key_packages: [],
  max_devices: 10,
  attachments_enabled: true,
});

interface StorageMock {
  readonly persist: jest.Mock;
  readonly persisted: jest.Mock;
}

function mockStorage(kept: boolean): StorageMock {
  const storage: StorageMock = {
    persist: jest.fn(() => Promise.resolve(kept)),
    persisted: jest.fn(() => Promise.resolve(kept)),
  };
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

const renderEnrollment = (
  engineOverrides: Parameters<typeof createFakeE2eeEngine>[0] = {}
) => {
  const engine = createFakeE2eeEngine({
    status: "needs-enrollment",
    ...engineOverrides,
  });
  render(
    <E2eeTestProvider value={contextFor(engine)}>
      <E2eeRouteGate>{() => <p>ready content</p>}</E2eeRouteGate>
    </E2eeTestProvider>
  );
  return engine;
};

describe("enrollment on a browser that may not keep its data", () => {
  const originalStorage = Object.getOwnPropertyDescriptor(navigator, "storage");

  beforeEach(() => {
    mockGetMe.mockReset();
  });

  afterEach(() => {
    if (originalStorage) {
      Object.defineProperty(navigator, "storage", originalStorage);
    } else {
      delete (navigator as { storage?: unknown }).storage;
    }
  });

  it("warns before the signature when earlier visits left devices behind", async () => {
    mockStorage(true);
    mockGetMe.mockResolvedValue(
      me([
        serverDevice(2),
        serverDevice(9),
        serverDevice(1, { label: "Firefox on Windows" }),
      ])
    );
    renderEnrollment();

    const heading = await screen.findByRole("heading", {
      name: WARNING_TITLE,
    });
    const notice = screen.getByRole("region", { name: WARNING_TITLE });
    expect(notice).toContainElement(heading);
    expect(
      screen.getByText(
        "Each time, it needs a new signature and a new device slot, and loses its encrypted history."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Chrome or Brave: Settings → Privacy and security/u)
    ).toHaveTextContent(
      "Add localhost under “Allowed to save data on your device”."
    );
    expect(screen.getByText(/^Edge: Settings/u)).toBeInTheDocument();
    expect(
      screen.getByText(/^Firefox: Settings → Privacy & Security/u)
    ).toHaveTextContent("Manage Exceptions. Enter localhost, choose Allow");
    expect(
      screen.getByText(/turn on encrypted backup in Devices/u)
    ).toBeInTheDocument();
    // Announced politely (it arrives after the card), never as an alert.
    expect(notice.closest("[aria-live='polite']")).not.toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    // Shown above the signature button, with the card's own copy unchanged.
    const button = screen.getByRole("button", { name: ENROLL_BUTTON });
    expect(
      notice.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Turn on encrypted messages" })
    ).toBeInTheDocument();
    expect(mockGetMe).toHaveBeenCalledTimes(1);
  });

  it("shows no warning on a browser that keeps its data", async () => {
    mockStorage(true);
    mockGetMe.mockResolvedValue(
      me([
        // Used today: a browser that keeps its data.
        serverDevice(20, { last_seen_at: Date.now() - 60_000 }),
        // Only one abandoned device of this browser.
        serverDevice(5),
        // Old devices of this browser are outside the window.
        serverDevice(40),
      ])
    );
    const engine = renderEnrollment();
    await waitFor(() => expect(mockGetMe).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: ENROLL_BUTTON }));
    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole("heading", { name: WARNING_TITLE })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(SOFT_WARNING)).not.toBeInTheDocument();
  });

  it("does not check a browser that still has its encrypted-messages state", async () => {
    mockGetMe.mockResolvedValue(me([serverDevice(2), serverDevice(9)]));
    renderEnrollment({
      thisDevice: device({ deviceKey: "0xself", isThisDevice: true }),
    });
    expect(
      screen.getByRole("button", { name: ENROLL_BUTTON })
    ).toBeInTheDocument();
    await Promise.resolve();
    expect(mockGetMe).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: WARNING_TITLE })
    ).not.toBeInTheDocument();
  });

  it("asks to keep the data only inside the click, then warns softly if refused", async () => {
    const storage = mockStorage(false);
    mockGetMe.mockResolvedValue(me([]));
    const engine = renderEnrollment();
    await waitFor(() => expect(mockGetMe).toHaveBeenCalledTimes(1));
    expect(storage.persist).not.toHaveBeenCalled();
    expect(storage.persisted).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: ENROLL_BUTTON }));
    // Called synchronously within the click handler, before the wallet prompt.
    expect(storage.persist).toHaveBeenCalledTimes(1);
    expect(engine.enroll).toHaveBeenCalledTimes(1);

    const soft = await screen.findByText(SOFT_WARNING);
    expect(storage.persisted).toHaveBeenCalledTimes(1);
    expect(soft.closest("[aria-live='polite']")).not.toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays quiet when the browser agrees to keep the data", async () => {
    const storage = mockStorage(true);
    mockGetMe.mockResolvedValue(me([]));
    const engine = renderEnrollment();
    fireEvent.click(screen.getByRole("button", { name: ENROLL_BUTTON }));
    await waitFor(() => expect(storage.persisted).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(SOFT_WARNING)).not.toBeInTheDocument();
  });

  it("still enrolls on browsers without the Storage API", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: undefined,
    });
    mockGetMe.mockRejectedValue(new Error("offline"));
    const engine = renderEnrollment();
    fireEvent.click(screen.getByRole("button", { name: ENROLL_BUTTON }));
    await waitFor(() => expect(engine.enroll).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(SOFT_WARNING)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: WARNING_TITLE })
    ).not.toBeInTheDocument();
  });
});

describe("device limit with inactive devices", () => {
  it("marks devices that don't count toward the limit", () => {
    const engine = createFakeE2eeEngine({
      status: "device-limit",
      devices: [
        device({ deviceKey: "0x1", label: "Chrome on Windows" }),
        device({ deviceKey: "0x2", label: "Chrome on Mac", inactive: true }),
        device({
          deviceKey: "0x3",
          label: "Firefox on Linux",
          inactive: true,
          revokedAt: Date.UTC(2026, 9, 20),
        }),
      ],
    });
    render(
      <E2eeTestProvider value={contextFor(engine)}>
        <E2eeRouteGate>{() => <p>ready content</p>}</E2eeRouteGate>
      </E2eeTestProvider>
    );
    const badges = screen.getAllByText(
      "Inactive: doesn’t count toward your limit"
    );
    expect(badges).toHaveLength(1);
    expect(badges[0]?.closest("li")).toHaveTextContent("Chrome on Mac");
  });
});
