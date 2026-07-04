import MessagesLayout from "@/components/messages/layout/MessagesLayout";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuthenticatedContent = jest.fn();
const mockUseDeviceInfo = jest.fn();

jest.mock("@/hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => mockUseAuthenticatedContent(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
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
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: false, isMobileDevice: false });
  });

  it("renders messages content only when ready", () => {
    mockUseAuthenticatedContent.mockReturnValue({ contentState: "ready" });

    render(
      <MessagesLayout>
        <div data-testid="message-content">DM content</div>
      </MessagesLayout>
    );

    expect(screen.getByTestId("message-content")).toBeInTheDocument();
    expect(screen.getByTestId("messages-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("keeps messages content gated when profile setup is needed", () => {
    mockUseAuthenticatedContent.mockReturnValue({
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
