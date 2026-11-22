import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Address } from "viem";
import GovernanceConsole from "@/app/provenance/governance/_components/GovernanceConsole";
import { registryPins } from "@/lib/provenance-core/config/registries";

const SAFE = registryPins[1]!.safe;
const OWNERS: Address[] = [
  "0x56ec02E81f5Cd36E49cA5382A5f55a00A4906F94",
  "0xd4957eFe0D658A945D33e2D285D7ef103C3669de",
  "0xe98BA252eA2f4cF9a4F16De84930b9E7Ec205553",
];
const ZERO = "0x0000000000000000000000000000000000000000";

let connected: Address | undefined = OWNERS[0];
const walletCalls: { method: string; params?: unknown }[] = [];
const provider = {
  request: jest.fn(
    async ({ method, params }: { method: string; params?: unknown }) => {
      walletCalls.push({ method, params });
      if (method === "eth_chainId") return "0xaa36a7";
      if (method === "eth_signTypedData_v4") return "0xplaceholdersignature";
      throw new Error(method);
    }
  ),
};

jest.mock("wagmi", () => ({
  useAccount: () => ({ connector: { getProvider: async () => provider } }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: connected,
    seizeConnect: jest.fn(),
  }),
}));
// The chain, as the test Safe and Museum registry stand: owner is the Safe, nonce 19.
jest.mock("@/lib/provenance-core/client", () => ({
  makeClient: () => ({
    readContract: async ({ functionName }: { functionName: string }) => {
      switch (functionName) {
        case "owner":
          return SAFE;
        case "pendingOwner":
          return ZERO;
        case "getOwners":
          return OWNERS;
        case "nonce":
          return 19n;
        default:
          throw new Error(functionName);
      }
    },
  }),
}));
jest.mock("@/lib/provenance-core/safeInfo", () => ({
  readSafe: async () => ({
    address: SAFE,
    owners: OWNERS,
    threshold: 2,
    nonce: 19n,
    version: "1.4.1",
  }),
}));

// jsdom has no Response; the core reads only ok, status and text().
const fetchMock = jest.fn(async () => ({
  ok: true,
  status: 201,
  text: async () => "",
}));

beforeEach(() => {
  connected = OWNERS[0];
  walletCalls.length = 0;
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

async function buildFreeze() {
  const user = userEvent.setup();
  render(<GovernanceConsole />);
  expect(
    await screen.findByText("Matches the pinned Safe")
  ).toBeInTheDocument();
  expect(screen.getByText("2 of 3 signers, next nonce 19")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Call"), "freeze");
  await user.click(screen.getByRole("button", { name: "Add call" }));
  await user.click(
    screen.getByRole("button", { name: "Build Safe transactions" })
  );
  return { user, card: await screen.findByTestId("governance-safetx") };
}

describe("GovernanceConsole", () => {
  it("builds a freeze as its own high-impact SafeTx with its decoded call and warning", async () => {
    const { card } = await buildFreeze();
    const c = within(card);
    expect(c.getByText("High impact")).toBeInTheDocument();
    expect(c.getByText(/Freezing cannot be undone/)).toBeInTheDocument();
    expect(c.getByText("freeze")).toBeInTheDocument();
    expect(c.getByText("One call to the registry")).toBeInTheDocument();
    expect(c.getByText("Nonce 19")).toBeInTheDocument();
    expect(c.getByText(/^0x[0-9a-f]{64}$/)).toBeInTheDocument();
  });

  it("batches registrations and shows each call's named arguments", async () => {
    const user = userEvent.setup();
    render(<GovernanceConsole />);
    await screen.findByText("Matches the pinned Safe");
    for (const literal of ["TYPE_A", "TYPE_B"]) {
      await user.clear(screen.getByLabelText("Literal"));
      await user.type(screen.getByLabelText("Literal"), literal);
      await user.click(screen.getByRole("button", { name: "Add call" }));
    }
    await user.click(
      screen.getByRole("button", { name: "Build Safe transactions" })
    );
    const card = within(await screen.findByTestId("governance-safetx"));
    expect(card.getByText("Routine")).toBeInTheDocument();
    expect(
      card.getByText("2 calls in one batch through MultiSendCallOnly")
    ).toBeInTheDocument();
    expect(card.getAllByText("registerRecordType")).toHaveLength(2);
    expect(card.getByText("TYPE_B")).toBeInTheDocument();
  });

  it("shows why a form field is refused", async () => {
    const user = userEvent.setup();
    render(<GovernanceConsole />);
    await screen.findByText("Matches the pinned Safe");
    await user.type(screen.getByLabelText("Literal"), "HAS SPACE");
    await user.click(screen.getByRole("button", { name: "Add call" }));
    expect(screen.getByLabelText("Literal")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(screen.getByText(/Enter a valid literal/)).toBeInTheDocument();
  });

  it("signs, then posts to the service only after the signer confirms", async () => {
    const { user, card } = await buildFreeze();
    const c = within(card);
    await user.click(c.getByRole("button", { name: "Check and sign" }));
    expect(await c.findByText("Signed.")).toBeInTheDocument();
    expect(walletCalls.some((w) => w.method === "eth_signTypedData_v4")).toBe(
      true
    );

    const propose = c.getByRole("button", { name: "Propose" });
    expect(propose).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(c.getByRole("checkbox"));
    await user.click(propose);
    expect(await c.findByText(/Proposed\./)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      `https://safe-transaction-sepolia.safe.global/api/v1/safes/${SAFE}/multisig-transactions/`
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      nonce: "19",
      sender: OWNERS[0],
      signature: "0xplaceholdersignature",
    });
  });

  it("blocks signing for an account that is not a signer of the Safe", async () => {
    connected = "0x000000000000000000000000000000000000bEEF";
    const { user, card } = await buildFreeze();
    const c = within(card);
    await user.click(c.getByRole("button", { name: "Check and sign" }));
    expect(
      await c.findByText("You are not a signer of this Safe.")
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(walletCalls.some((w) => w.method === "eth_signTypedData_v4")).toBe(
        false
      )
    );
    expect(
      c.queryByRole("button", { name: "Propose" })
    ).not.toBeInTheDocument();
  });
});
