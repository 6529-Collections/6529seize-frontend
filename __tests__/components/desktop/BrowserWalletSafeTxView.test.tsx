import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrowserWalletSafeTxView from "@/components/desktop/BrowserWalletSafeTxView";
import { checkSafeTx } from "@/lib/desktop/wallet-safe-tx/check";
import { describeSafeTx } from "@/lib/desktop/wallet-safe-tx/describe";
import {
  buildSafeTxVectors,
  SAFE_TX_SIGNER,
} from "@/__tests__/fixtures/desktop-wallet-safe-tx/vectors";

const SAFE = "0x87BD1Be4FbDEf9251C318b4870542217AA2AdB68";
const readContract = jest.fn();
const publicClient = { readContract };

jest.mock("wagmi", () => ({
  usePublicClient: () => publicClient,
}));

function describeVector(name: string) {
  const vector = buildSafeTxVectors().find((item) => item.name === name)!;
  const parsed = JSON.parse(vector.payload) as {
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
  };
  const checked = checkSafeTx(parsed.domain, parsed.message);
  if (!checked.ok) throw new Error(name);
  return { ...describeSafeTx(checked), key: vector.payload };
}

const answers: Record<string, unknown> = {
  getOwners: [SAFE_TX_SIGNER],
  getThreshold: 1n,
  nonce: 7n,
  owner: SAFE,
  pendingOwner: SAFE,
};

const view = (description: ReturnType<typeof describeVector>) => (
  <BrowserWalletSafeTxView
    locale="en-US"
    signer={SAFE_TX_SIGNER}
    requestKey={description.key}
    description={description}
  >
    {(canSign) => (
      <button type="button" disabled={!canSign}>
        Sign
      </button>
    )}
  </BrowserWalletSafeTxView>
);

describe("BrowserWalletSafeTxView: a new request", () => {
  it("never inherits the previous request's checks or acknowledgement", async () => {
    readContract.mockImplementation(
      async ({ functionName }: { functionName: string }) =>
        answers[functionName]
    );
    const first = describeVector(
      "governance.freeze alone on the test registry"
    );
    const { rerender } = render(view(first));
    const box = await screen.findByRole("checkbox", {
      name: "I checked this action and want to approve it",
    });
    await screen.findByText(/Checked: the Safe owns the registry/);
    await userEvent.click(box);
    expect(screen.getByRole("button", { name: "Sign" })).toBeEnabled();

    // The next request's reads stay open: nothing carries over meanwhile.
    let release: () => void = () => undefined;
    readContract.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(undefined);
        })
    );
    const second = describeVector(
      "governance.transferOwnership alone on the test registry"
    );
    rerender(view(second));
    expect(screen.getByRole("button", { name: "Sign" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", {
        name: "I checked this action and want to approve it",
      })
    ).not.toBeChecked();
    expect(
      screen.getByText("Checking the Safe and the registry on chain…")
    ).toBeInTheDocument();

    await act(async () => release());
  });

  it("says pending owner when the call accepts ownership", async () => {
    readContract.mockImplementation(
      async ({ functionName }: { functionName: string }) =>
        answers[functionName]
    );
    render(
      view(
        describeVector("governance.acceptOwnership alone on the test registry")
      )
    );
    expect(
      await screen.findByText(/the Safe is the registry's pending owner/)
    ).toBeInTheDocument();
  });
});
