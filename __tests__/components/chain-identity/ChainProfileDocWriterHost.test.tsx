import { render } from "@testing-library/react";
import { WagmiContext, type Config } from "wagmi";
import ChainProfileDocWriterHost from "@/components/chain-identity/ChainProfileDocWriterHost";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { ChainOperationError } from "@/lib/chain-identity/operation";
import { chainProfileDocWriter } from "@/lib/chain-identity/profileDocWriter";
import {
  getProfileDocWriter,
  registerProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

jest.mock("@/hooks/useIdentityMovePhase", () => ({
  useChainIdentityActive: jest.fn(),
}));
jest.mock("@/lib/chain-identity/profileDocWriter", () => ({
  chainProfileDocWriter: jest.fn(),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const config = {} as Config;
const writer = {
  availableSigners: jest.fn(async () => ["wallet"] as const),
  replaceProfileDoc: jest.fn(async () => ({ txId: "0x01" })),
};

const host = () =>
  render(
    <WagmiContext.Provider value={config}>
      <ChainProfileDocWriterHost />
    </WagmiContext.Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  (chainProfileDocWriter as jest.Mock).mockReturnValue(writer);
});

it("registers the chain writer for the site builder once identities have moved", async () => {
  (useChainIdentityActive as jest.Mock).mockReturnValue(true);
  const { unmount } = host();
  const registered = getProfileDocWriter();
  expect(registered).not.toBeNull();
  await expect(registered!.availableSigners()).resolves.toEqual(["wallet"]);
  const edit = (current: ReadonlyMap<string, string> | null) =>
    new Map(current ?? []);
  await expect(registered!.replaceProfileDoc(edit, "wallet")).resolves.toEqual({
    txId: "0x01",
  });
  expect(chainProfileDocWriter).toHaveBeenCalledWith(config, expect.any(Function));
  // The chain's refusals reach the site builder in the page's words.
  const describe = (chainProfileDocWriter as jest.Mock).mock.calls[0][1] as (
    error: unknown
  ) => string | null;
  expect(
    describe(
      new ChainOperationError("failed", "refused: STALE_VERSION.", "STALE_VERSION")
    )
  ).toBe("This changed since the page loaded. Reload and try again.");
  expect(writer.replaceProfileDoc).toHaveBeenCalledWith(edit, "wallet");
  unmount();
  expect(getProfileDocWriter()).toBeNull();
});

it("leaves another writer registered after it in place", () => {
  (useChainIdentityActive as jest.Mock).mockReturnValue(true);
  const { unmount } = host();
  registerProfileDocWriter(writer);
  unmount();
  expect(getProfileDocWriter()).toBe(writer);
  registerProfileDocWriter(null);
});

it("registers nothing before identities move", () => {
  (useChainIdentityActive as jest.Mock).mockReturnValue(false);
  host();
  expect(getProfileDocWriter()).toBeNull();
});
