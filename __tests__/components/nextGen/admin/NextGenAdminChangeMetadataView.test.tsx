import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import NextGenAdminChangeMetadataView from "@/components/nextGen/admin/NextGenAdminChangeMetadataView";

jest.mock("@/components/nextGen/NextGenContractWriteStatus", () => () => <div data-testid="status" />);

jest.mock("@/components/nextGen/admin/NextGenAdminShared", () => ({
  NextGenCollectionIdFormGroup: (props: any) => (
    <input
      data-testid="collection-id"
      value={props.collection_id}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ),
  NextGenAdminHeadingRow: (props: any) => <div>{props.title}</div>,
}));

const writeContract = jest.fn();
jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  useGlobalAdmin: () => ({ data: true }),
  useFunctionAdmin: () => ({ data: true }),
  useCollectionIndex: () => "1",
  useParsedCollectionIndex: (v: any) => v,
  useCollectionAdmin: () => ({ data: true }),
  getCollectionIdsForAddress: () => ["1"],
  useCoreContractWrite: () => ({
    params: { foo: "bar" },
    writeContract,
    reset: jest.fn(),
    isLoading: false,
    isSuccess: false,
    isError: false,
  }),
}));

jest.mock("wagmi", () => ({
  useReadContract: () => ({ data: undefined }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x1" }),
}));

test("shows validation errors", async () => {
  render(<NextGenAdminChangeMetadataView close={jest.fn()} />);
  await userEvent.click(screen.getByText("Submit"));
  expect(screen.getByText("Collection id is required")).toBeInTheDocument();
  expect(screen.getByText("Metadata view is required")).toBeInTheDocument();
});

test("calls writeContract with values", async () => {
  const user = userEvent.setup();
  render(<NextGenAdminChangeMetadataView close={jest.fn()} />);
  await user.type(screen.getByTestId("collection-id"), "5");
  await user.click(screen.getAllByRole('radio')[0]);
  await user.click(screen.getByText("Submit"));
  expect(writeContract).toHaveBeenCalledWith({ foo: "bar", args: ["5", true] });
});
