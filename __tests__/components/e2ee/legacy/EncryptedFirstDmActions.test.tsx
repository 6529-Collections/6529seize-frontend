import { fireEvent, render, screen } from "@testing-library/react";
import {
  clearE2eeComposePrefill,
  peekE2eeComposePrefill,
} from "@/components/e2ee/e2eeComposePrefill";
import { EncryptedFirstDmActions } from "@/components/e2ee/legacy/EncryptedFirstDmActions";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { CommunityMemberMinimal } from "@/entities/IProfile";

const mockPush = jest.fn();
let mockNow = Date.parse("2026-11-02T10:00:00Z");
let mockAuth: { activeProfileProxy: object | null } = {
  activeProfileProxy: null,
};

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/e2ee/useE2eeNow", () => ({
  useE2eeNow: () => mockNow,
}));

const alice = {
  profile_id: "alice-id",
  handle: "alice",
  primary_wallet: "0xABC",
  wallet: "0xdef",
  pfp: null,
} as CommunityMemberMinimal;
const walletOnly = {
  profile_id: null,
  handle: null,
  primary_wallet: null,
  wallet: "0x123",
  pfp: null,
} as CommunityMemberMinimal;
const unencrypted = <button type="submit">Send unencrypted instead</button>;

describe("EncryptedFirstDmActions", () => {
  beforeEach(() => {
    (isE2eeEnabled as jest.Mock).mockReturnValue(true);
    mockNow = Date.parse("2026-11-02T10:00:00Z");
    mockAuth = { activeProfileProxy: null };
    mockPush.mockClear();
    clearE2eeComposePrefill();
  });

  it("keeps only the existing button when encrypted chats are off", () => {
    (isE2eeEnabled as jest.Mock).mockReturnValue(false);
    render(
      <EncryptedFirstDmActions
        selected={[alice]}
        unencryptedButton={unencrypted}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Start encrypted chat" })
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Send unencrypted instead" })
    ).toBeInTheDocument();
  });

  it("makes the encrypted chat the default and the unencrypted DM an explicit, warned choice", () => {
    const onEncrypted = jest.fn();
    render(
      <EncryptedFirstDmActions
        selected={[alice]}
        unencryptedButton={unencrypted}
        onEncrypted={onEncrypted}
      />
    );
    expect(
      screen.getByText(
        "An unencrypted DM isn’t end-to-end encrypted, and 6529 deletes it from its servers on Dec 1, 2026, unless we’re legally required to keep it."
      )
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Start encrypted chat" })
    );
    expect(peekE2eeComposePrefill()).toEqual({
      people: [
        { profileId: "alice-id", handle: "alice", pfp: null, wallet: "0xabc" },
      ],
      source: "dm",
    });
    expect(onEncrypted).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/messages/encrypted/new");
  });

  it("offers only the encrypted chat from the deletion date", () => {
    mockNow = Date.parse("2026-12-01T00:00:00Z");
    render(
      <EncryptedFirstDmActions
        selected={[alice]}
        unencryptedButton={unencrypted}
      />
    );
    expect(
      screen.getByRole("button", { name: "Start encrypted chat" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send unencrypted instead" })
    ).toBeNull();
  });

  it("disables the encrypted choice until someone with a profile is selected", () => {
    render(
      <EncryptedFirstDmActions
        selected={[walletOnly]}
        unencryptedButton={unencrypted}
      />
    );
    expect(
      screen.getByRole("button", { name: "Start encrypted chat" })
    ).toBeDisabled();
  });

  it("hides the encrypted choice from proxies", () => {
    mockAuth = { activeProfileProxy: {} };
    render(
      <EncryptedFirstDmActions
        selected={[alice]}
        unencryptedButton={unencrypted}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Start encrypted chat" })
    ).toBeNull();
  });
});
