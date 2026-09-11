import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuthenticatedContent = jest.fn();
const mockUseCreateModalState = jest.fn();
const mockUseDeviceInfo = jest.fn();
const mockCreateDirectMessageModal = jest.fn(
  ({ isOpen }: { readonly isOpen: boolean }) =>
    isOpen ? <div data-testid="create-dm-modal" /> : null
);

jest.mock("@/hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => mockUseAuthenticatedContent(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));

jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => mockUseCreateModalState(),
}));

jest.mock("@/components/waves/create-dm/CreateDirectMessageModal", () => ({
  __esModule: true,
  default: (props: { readonly isOpen: boolean }) =>
    mockCreateDirectMessageModal(props),
}));

jest.mock("@/components/messages/MessagesDesktop", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="messages-desktop">{children}</div>
  ),
}));

jest.mock("@/components/messages/MessagesMobile", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="messages-mobile">{children}</div>
  ),
}));

jest.mock("@/components/common/ConnectWallet", () => ({
  __esModule: true,
  default: ({
    title,
    description,
    action,
  }: {
    readonly title?: string;
    readonly description?: string;
    readonly action?: React.ReactNode;
  }) => (
    <div data-testid="connect-wallet">
      <h1>{title ?? "This content is only available to connected wallets."}</h1>
      <p>{description ?? "Connect your wallet to continue."}</p>
      {action}
    </div>
  ),
}));

jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <button type="button">Create profile</button>,
}));

describe("MessagesLayout", () => {
  beforeEach(() => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-authenticated",
      connectedProfile: null,
    });
    mockUseCreateModalState.mockReturnValue({
      close: jest.fn(),
      isDirectMessageModalOpen: false,
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: false, isMobileDevice: false });
  });

  it("renders messages content only when ready", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      connectedProfile: null,
      contentState: "ready",
    });

    render(
      <MessagesLayout>
        <div data-testid="message-content">DM content</div>
      </MessagesLayout>
    );

    expect(screen.getByTestId("message-content")).toBeInTheDocument();
    expect(screen.getByTestId("messages-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("owns the desktop create-direct-message modal from the layout", () => {
    const close = jest.fn();
    const connectedProfile = { handle: "seize", primary_wallet: "0x1" };
    mockUseAuthenticatedContent.mockReturnValue({
      connectedProfile,
      contentState: "ready",
    });
    mockUseCreateModalState.mockReturnValue({
      close,
      isDirectMessageModalOpen: true,
    });

    render(
      <MessagesLayout>
        <div data-testid="message-content">DM content</div>
      </MessagesLayout>
    );

    expect(screen.getByTestId("create-dm-modal")).toBeInTheDocument();
    expect(mockCreateDirectMessageModal).toHaveBeenCalledTimes(1);
    expect(mockCreateDirectMessageModal).toHaveBeenCalledWith({
      isOpen: true,
      onClose: close,
      profile: connectedProfile,
    });
  });

  it("keeps messages content gated when profile setup is needed", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      connectedProfile: null,
      contentState: "needs-profile",
    });

    render(
      <MessagesLayout>
        <div data-testid="message-content">DM content</div>
      </MessagesLayout>
    );

    expect(screen.getByTestId("connect-wallet")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "You need to set up a profile to continue.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create a profile to access messages.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create profile" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("message-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("messages-desktop")).not.toBeInTheDocument();
  });
});
