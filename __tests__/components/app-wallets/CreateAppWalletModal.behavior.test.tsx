import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateAppWalletModal } from "@/components/app-wallets/AppWalletModal";

const createAppWallet = jest.fn();
const importAppWallet = jest.fn();
jest.mock("@/components/app-wallets/AppWalletsContext", () => ({
  useAppWallets: () => ({
    createAppWallet: (...a: any[]) => createAppWallet(...a),
    importAppWallet: (...a: any[]) => importAppWallet(...a),
  }),
}));

const setToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => ({ setToast }) }));

beforeEach(() => {
  jest.clearAllMocks();
});

it("shows error for invalid wallet name", async () => {
  const onHide = jest.fn();
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={onHide} />);

  const input = screen.getByLabelText("Wallet Name");
  await user.type(input, "Bad#");

  await waitFor(() => {
    expect(
      screen.getByText(
        "Name can only contain alphanumeric characters and spaces"
      )
    ).toBeInTheDocument();
  });
});

it("shows error when password too short", async () => {
  createAppWallet.mockResolvedValue(true);
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={jest.fn()} />);
  await user.type(screen.getByLabelText("Wallet Name"), "MyWallet");
  await user.type(screen.getByLabelText("Wallet Password"), "123");
  await user.click(screen.getByRole("button", { name: "Create" }));
  expect(
    screen.getByText("Password must be at least 12 characters long")
  ).toBeInTheDocument();
});

it("calls onHide on successful creation", async () => {
  createAppWallet.mockResolvedValue(true);
  const onHide = jest.fn();
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={onHide} />);
  await user.type(screen.getByLabelText("Wallet Name"), "Wallet");
  await user.type(screen.getByLabelText("Wallet Password"), "StrongPass1!");
  await user.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() => expect(onHide).toHaveBeenCalledWith(true));
});

it("provides a keyboard-accessible password visibility control", async () => {
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={jest.fn()} />);

  const input = screen.getByLabelText("Wallet Password");
  expect(input).toHaveAttribute("type", "password");

  await user.click(screen.getByRole("button", { name: "Show password" }));

  expect(input).toHaveAttribute("type", "text");
  expect(
    screen.getByRole("button", { name: "Hide password" })
  ).toBeInTheDocument();
});

it("prevents dismissal while wallet creation is pending", async () => {
  let resolveCreation: (success: boolean) => void = () => {};
  createAppWallet.mockReturnValue(
    new Promise<boolean>((resolve) => {
      resolveCreation = resolve;
    })
  );
  const onHide = jest.fn();
  const user = userEvent.setup();
  render(<CreateAppWalletModal show onHide={onHide} />);

  await user.type(screen.getByLabelText("Wallet Name"), "Wallet");
  await user.type(screen.getByLabelText("Wallet Password"), "StrongPass1!");
  await user.click(screen.getByRole("button", { name: "Create" }));

  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  for (const closeButton of screen.getAllByRole("button", {
    name: "Close wallet dialog",
  })) {
    expect(closeButton).toBeDisabled();
  }
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onHide).not.toHaveBeenCalled();

  resolveCreation(true);
  await waitFor(() => expect(onHide).toHaveBeenCalledWith(true));
});
