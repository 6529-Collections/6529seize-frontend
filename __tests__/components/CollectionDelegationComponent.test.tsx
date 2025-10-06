import CollectionDelegationComponent from "@/components/delegation/CollectionDelegation";
import { DelegationCenterSection } from "@/enums";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("wagmi", () => ({
  useReadContract: jest.fn(() => ({})),
  useReadContracts: jest.fn(() => ({ data: undefined, refetch: jest.fn() })),
  useWriteContract: jest.fn(() => ({
    writeContract: jest.fn(),
    reset: jest.fn(),
    data: undefined,
    error: undefined,
  })),
  useEnsName: jest.fn(() => ({ data: undefined })),
  useWaitForTransactionReceipt: jest.fn(() => ({ isLoading: false })),
  useChainId: jest.fn(() => 1),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x0", isConnected: true }),
}));

describe("CollectionDelegationComponent", () => {
  const collection = {
    title: "Test Collection",
    display: "Test",
    contract: "0x1",
    preview: "",
  };
  const setSection = jest.fn();

  it("renders collection title and back button works", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    expect(screen.getByText("Test Collection")).toBeInTheDocument();

    const back = screen.getAllByText(/Back to Delegation Center/i)[0];
    fireEvent.click(back);
    expect(setSection).toHaveBeenCalledWith(DelegationCenterSection.CENTER);
  });

  it("shows fetching messages initially", () => {
    render(
      <CollectionDelegationComponent
        collection={collection}
        setSection={setSection}
      />
    );
    expect(
      screen.getAllByText(/Fetching outgoing delegations/i)[0]
    ).toBeInTheDocument();
  });
});
