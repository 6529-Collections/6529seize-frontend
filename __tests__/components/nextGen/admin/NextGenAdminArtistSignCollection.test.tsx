import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NextGenAdminArtistSignCollection from "../../../../components/nextGen/admin/NextGenAdminArtistSignCollection";

jest.mock("../../../../components/nextGen/nextgen_helpers", () => ({
  useCollectionIndex: jest.fn(() => ({ data: 1 })),
  useCollectionArtist: jest.fn(() => ({ data: [{ result: "0xabc" }] })),
  useParsedCollectionIndex: jest.fn(() => 1),
  isCollectionArtist: jest.fn(),
  useCoreContractWrite: jest.fn(),
}));

jest.mock("../../../../components/nextGen/admin/NextGenAdminShared", () => ({
  NextGenCollectionIdFormGroup: ({ onChange }: any) => (
    <input
      data-testid="collectionId"
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  NextGenAdminHeadingRow: () => <div data-testid="heading" />,
}));

jest.mock(
  "../../../../components/nextGen/NextGenContractWriteStatus",
  () => () => <div data-testid="status" />,
);

jest.mock("../../../../components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const {
  useSeizeConnectContext,
} = require("../../../../components/auth/SeizeConnectContext");
const {
  isCollectionArtist,
  useCoreContractWrite,
} = require("../../../../components/nextGen/nextgen_helpers");

function setup(isArtist: boolean) {
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: "0xabc" });
  (isCollectionArtist as jest.Mock).mockReturnValue(isArtist);
  (useCoreContractWrite as jest.Mock).mockReturnValue({
    reset: jest.fn(),
    writeContract: jest.fn(),
    params: {},
    isSuccess: false,
    isError: false,
    isLoading: false,
    data: null,
    error: null,
  });
  render(<NextGenAdminArtistSignCollection close={jest.fn()} />);
}

describe("NextGenAdminArtistSignCollection", () => {
  it("shows warning when not an artist", () => {
    setup(false);
    expect(
      screen.getByText(/only collection artists can use this section/i),
    ).toBeInTheDocument();
  });

  it("validates required fields on submit", () => {
    setup(true);
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.getByText("Collection id is required")).toBeInTheDocument();
    expect(screen.getByText("Signature is required")).toBeInTheDocument();
  });
});
