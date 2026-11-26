import { render, screen } from "@testing-library/react";
import { useEnsAddress, useEnsName } from "wagmi";
import SettingsUpdatedBy from "@/components/drop-forge/automation/SettingsUpdatedBy";
import { useIdentity } from "@/hooks/useIdentity";

jest.mock("@/hooks/useIdentity");
jest.mock("wagmi", () => ({ useEnsAddress: jest.fn(), useEnsName: jest.fn() }));

const address = "0x7f3774eadae4beb01919dec7f32a72e417ab5de3";

beforeEach(() => {
  jest.mocked(useIdentity).mockReturnValue({ profile: null, isLoading: false });
  jest
    .mocked(useEnsName)
    .mockReturnValue({ data: null } as ReturnType<typeof useEnsName>);
  jest
    .mocked(useEnsAddress)
    .mockReturnValue({ data: undefined } as ReturnType<typeof useEnsAddress>);
});

it("shows only the linked profile handle when a profile is available", () => {
  jest.mocked(useIdentity).mockReturnValue({
    profile: { handle: "prxt0" } as NonNullable<
      ReturnType<typeof useIdentity>["profile"]
    >,
    isLoading: false,
  });
  render(<SettingsUpdatedBy address={address} />);
  expect(screen.getByRole("link", { name: "prxt0" })).toHaveAttribute(
    "href",
    "/prxt0"
  );
  expect(screen.getByText(/Last changed by/)).toHaveTextContent(
    "Last changed by prxt0"
  );
  expect(screen.queryByText(address)).not.toBeInTheDocument();
});

it("shows verified ENS and a shortened address when no profile handle exists", () => {
  jest
    .mocked(useEnsName)
    .mockReturnValue({ data: "wallet.eth" } as ReturnType<typeof useEnsName>);
  jest
    .mocked(useEnsAddress)
    .mockReturnValue({ data: address } as ReturnType<typeof useEnsAddress>);
  render(<SettingsUpdatedBy address={address} />);
  expect(screen.getByText("wallet.eth — 0x7f37...5de3")).toHaveAttribute(
    "title",
    address
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("keeps the full wallet when neither a profile nor ENS is available", () => {
  render(<SettingsUpdatedBy address={address} />);
  expect(screen.getByText(address)).toBeVisible();
});

it("does not label the updater with an ENS name that resolves to a different wallet", () => {
  jest
    .mocked(useEnsName)
    .mockReturnValue({ data: "other.eth" } as ReturnType<typeof useEnsName>);
  jest.mocked(useEnsAddress).mockReturnValue({
    data: "0x1111111111111111111111111111111111111111",
  } as ReturnType<typeof useEnsAddress>);
  render(<SettingsUpdatedBy address={address} />);
  expect(screen.getByText(address)).toBeVisible();
  expect(screen.queryByText(/other.eth/)).not.toBeInTheDocument();
});
