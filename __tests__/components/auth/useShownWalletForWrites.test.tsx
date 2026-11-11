import { render } from "@testing-library/react";
import { useEffect } from "react";
import { useShownWalletForWrites } from "@/components/auth/useShownWalletForWrites";
import { getAuthJwt } from "@/services/auth/auth.utils";
import {
  assertWriteMatchesDisplayedWallet,
  DisplayedProfileChangedError,
} from "@/services/auth/displayed-wallet-guard";

jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_STORAGE_KEYS: { activeAddress: "6529-wallet-active-address" },
  getAuthJwt: jest.fn(),
  getWalletAddress: jest.fn(() => null),
}));

const WALLET_X = "0x1111111111111111111111111111111111111111";
const WALLET_Y = "0x2222222222222222222222222222222222222222";

const encode = (value: object): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const tokenFor = (wallet: string): string =>
  `${encode({ alg: "HS256" })}.${encode({ sub: wallet })}.signature`;

/** Attempts a write with the stored session from a child's passive effect. */
const writeOutcome = (): string => {
  const token = tokenFor(WALLET_Y);
  jest.mocked(getAuthJwt).mockReturnValue(token);
  try {
    assertWriteMatchesDisplayedWallet({
      url: "https://api.test.6529.io/api/drops",
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      usesStoredSession: true,
    });
    return "sent";
  } catch (error) {
    return error instanceof DisplayedProfileChangedError ? "refused" : "error";
  }
};

function Shown({
  address,
  isSignedIn,
  onChildEffect,
}: {
  readonly address: string;
  readonly isSignedIn: boolean;
  readonly onChildEffect: (outcome: string) => void;
}) {
  useShownWalletForWrites(address, isSignedIn);
  return <Child address={address} onChildEffect={onChildEffect} />;
}

function Child({
  address,
  onChildEffect,
}: {
  readonly address: string;
  readonly onChildEffect: (outcome: string) => void;
}) {
  useEffect(() => {
    onChildEffect(writeOutcome());
  }, [address, onChildEffect]);
  return null;
}

describe("useShownWalletForWrites", () => {
  it("records the shown wallet before child effects of the same render write", () => {
    const outcomes: string[] = [];
    const onChildEffect = (outcome: string) => outcomes.push(outcome);
    const { rerender, unmount } = render(
      <Shown address={WALLET_Y} isSignedIn onChildEffect={onChildEffect} />
    );

    rerender(
      <Shown address={WALLET_X} isSignedIn onChildEffect={onChildEffect} />
    );
    unmount();

    // Y matched the session; the switch to X was recorded before the child ran.
    expect(outcomes).toEqual(["sent", "refused"]);
    expect(writeOutcome()).toBe("sent");
  });

  it("records nothing while the shown wallet is not signed in", () => {
    const outcomes: string[] = [];
    render(
      <Shown
        address={WALLET_X}
        isSignedIn={false}
        onChildEffect={(outcome) => outcomes.push(outcome)}
      />
    );

    expect(outcomes).toEqual(["sent"]);
  });
});
