import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  clearE2eeComposePrefill,
  peekE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import { PlaintextDmEncryptionNotice } from "@/components/e2ee/plaintext/PlaintextDmEncryptionNotice";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";

const mockPush = jest.fn();
const mockSetToast = jest.fn();
let mockAuth: {
  connectedProfile: { id: string } | null;
  activeProfileProxy: object | null;
  setToast: jest.Mock;
} = {
  connectedProfile: { id: "profile-self" },
  activeProfileProxy: null,
  setToast: mockSetToast,
};
let mockIsApp = false;

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const isE2eeEnabledMock = isE2eeEnabled as jest.Mock;
const fetchMock = commonApiFetch as jest.Mock;

const dmWave = {
  id: "dm-wave",
  name: "alice",
  chat: { scope: { group: { id: "dm-group", is_direct_message: true } } },
  contributors_overview: [],
} as unknown as ApiWave;

const publicWave = {
  ...dmWave,
  chat: { scope: { group: { id: "g", is_direct_message: false } } },
} as unknown as ApiWave;

describe("PlaintextDmEncryptionNotice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearE2eeComposePrefill();
    isE2eeEnabledMock.mockReturnValue(true);
    mockIsApp = false;
    mockAuth = {
      connectedProfile: { id: "profile-self" },
      activeProfileProxy: null,
      setToast: mockSetToast,
    };
  });

  it("renders nothing when encrypted messages are off", () => {
    isE2eeEnabledMock.mockReturnValue(false);
    const { container } = render(<PlaintextDmEncryptionNotice wave={dmWave} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for non-DM waves and proxies", () => {
    const { container, rerender } = render(
      <PlaintextDmEncryptionNotice wave={publicWave} />
    );
    expect(container).toBeEmptyDOMElement();
    mockAuth = { ...mockAuth, activeProfileProxy: { id: "proxy" } };
    rerender(<PlaintextDmEncryptionNotice wave={dmWave} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("labels the DM and starts an encrypted chat with the same people", async () => {
    fetchMock.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint === "groups/dm-group") {
        return Promise.resolve({ group: { identity_group_id: "ig-1" } });
      }
      if (endpoint === "groups/dm-group/identity_groups/ig-1") {
        return Promise.resolve(["0xSELF", "0xALICE"]);
      }
      if (endpoint === "identities/0xself") {
        return Promise.resolve({
          id: "profile-self",
          handle: "me",
          pfp: null,
          primary_wallet: "0xself",
        });
      }
      if (endpoint === "identities/0xalice") {
        return Promise.resolve({
          id: "profile-alice",
          handle: "alice",
          pfp: null,
          primary_wallet: "0xALICE",
        });
      }
      return Promise.reject(new Error(`unexpected ${endpoint}`));
    });
    render(<PlaintextDmEncryptionNotice wave={dmWave} />);
    expect(screen.getByText("Not end-to-end encrypted")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Start encrypted chat" })
    );

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/new")
    );
    expect(peekE2eeComposePrefill()).toEqual({
      source: "dm",
      people: [
        {
          profileId: "profile-alice",
          handle: "alice",
          pfp: null,
          wallet: "0xalice",
        },
      ],
    });
  });

  it("offers a one-tap icon in the app header only inside the app", () => {
    const { container, rerender } = render(
      <PlaintextDmEncryptionNotice wave={dmWave} variant="icon" appOnly />
    );
    expect(container).toBeEmptyDOMElement();
    mockIsApp = true;
    rerender(
      <PlaintextDmEncryptionNotice wave={dmWave} variant="icon" appOnly />
    );
    expect(
      screen.getByRole("button", {
        name: "Not end-to-end encrypted. Start an encrypted chat with the same people",
      })
    ).toBeInTheDocument();
  });

  it("uses the icon in compact headers and nothing for other waves", () => {
    const { container, rerender } = render(
      <PlaintextDmEncryptionNotice wave={publicWave} compact />
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<PlaintextDmEncryptionNotice wave={dmWave} compact />);
    expect(
      screen.getByRole("button", {
        name: "Not end-to-end encrypted. Start an encrypted chat with the same people",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Start encrypted chat" })
    ).not.toBeInTheDocument();
  });
});
