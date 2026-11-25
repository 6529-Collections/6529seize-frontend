import { render, screen } from "@testing-library/react";
import { chainIdentityPointer } from "@/components/chain-waves/chainIdentityPointer";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { isChainIdentityEnabled } from "@/lib/chain-identity/config";
import { chainGateway } from "@/lib/chain-identity/gateway";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { identityOfWallet } from "@/lib/chain-waves/signing";
import { getIdentityFreezeAtMs } from "@/lib/identity-move/schedule";

jest.mock("@/lib/chain-identity/config", () => ({
  ...jest.requireActual("@/lib/chain-identity/config"),
  isChainIdentityEnabled: jest.fn(() => false),
}));
jest.mock("@/lib/identity-move/schedule", () => ({
  ...jest.requireActual("@/lib/identity-move/schedule"),
  getIdentityFreezeAtMs: jest.fn(() => null),
}));

const WALLET = `0x${"12".repeat(20)}` as const;
const HOUR = 60 * 60 * 1000;

/** The error a vote or an entry stops with for a wallet with no identity. */
const noIdentityError = async (): Promise<unknown> => {
  jest.spyOn(chainGateway, "getIdentityByWallet").mockResolvedValue(null);
  return identityOfWallet(WALLET).then(
    () => {
      throw new Error("expected no identity");
    },
    (error: unknown) => error
  );
};

/** The identity page: in this build or not, and how long since the freeze. */
const identityPage = (enabled: boolean, sinceFreezeMs: number | null) => {
  jest.mocked(isChainIdentityEnabled).mockReturnValue(enabled);
  jest
    .mocked(getIdentityFreezeAtMs)
    .mockReturnValue(
      sinceFreezeMs === null ? null : Date.now() - sinceFreezeMs
    );
};

describe("chainIdentityPointer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    identityPage(false, null);
  });

  it("links a wallet with no identity to the identity page once it takes changes", async () => {
    identityPage(true, 48 * HOUR);
    const { container } = render(
      <p>{chainIdentityPointer(DEFAULT_LOCALE, await noIdentityError())}</p>
    );
    expect(container).toHaveTextContent(
      "This wallet has no identity on the 6529 Network yet. Set one up on your identity page."
    );
    expect(
      screen.getByRole("link", { name: "your identity page" })
    ).toHaveAttribute("href", "/network/identity");
  });

  it("gives nothing while identities are still frozen, so the page can't help yet", async () => {
    identityPage(true, HOUR);
    expect(
      chainIdentityPointer(DEFAULT_LOCALE, await noIdentityError())
    ).toBeNull();
  });

  it("gives nothing with the identity flows on but no freeze set", async () => {
    identityPage(true, null);
    expect(
      chainIdentityPointer(DEFAULT_LOCALE, await noIdentityError())
    ).toBeNull();
  });

  it("gives nothing without the identity page, so the plain line stays", async () => {
    identityPage(false, 48 * HOUR);
    expect(
      chainIdentityPointer(DEFAULT_LOCALE, await noIdentityError())
    ).toBeNull();
  });

  it("gives nothing for any other failure", () => {
    identityPage(true, 48 * HOUR);
    expect(
      chainIdentityPointer(
        DEFAULT_LOCALE,
        new ChainOperationError(
          "rejected",
          "This wallet has no identity on the 6529 Network yet."
        )
      )
    ).toBeNull();
    expect(
      chainIdentityPointer(DEFAULT_LOCALE, new Error("network down"))
    ).toBeNull();
  });
});
