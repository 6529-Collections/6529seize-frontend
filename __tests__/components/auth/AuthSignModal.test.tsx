import { formatSessionUpgradeTimeLeft } from "@/components/auth/authSessionUpgrade";
import type { SupportedLocale } from "@/i18n/locales";
import { AuthSignModal } from "@/components/auth/AuthSignModal";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
const mockAddress = "0x1111111111111111111111111111111111111111";
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));
const makeProps = (): ComponentProps<typeof AuthSignModal> => ({
  enableWalletAuthentication: true,
  isConnectionShareUpgradePrompt: false,
  isDisconnectedWebSessionUpgradePrompt: false,
  isSessionUpgradePrompt: false,
  isSigningPending: false,
  isSignRequestInProgress: false,
  onCancelSignRequest: jest.fn(),
  onConfirmSignRequest: jest.fn(),
  onSessionUpgradeLearnMore: jest.fn(),
  sessionUpgradeCanDismiss: true,
  sessionUpgradeHasDeadline: false,
  sessionUpgradeTimeLeftMs: 0,
  shouldShowSignModal: true,
});
const escapeDialog = () =>
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true })
  );
describe("AuthSignModal onboarding", () => {
  it("explains the address signature and waits for an explicit signing action", async () => {
    const props = makeProps();
    render(<AuthSignModal {...props} />);
    expect(
      screen.getByRole("dialog", { name: "Sign in to 6529" })
    ).toHaveAccessibleDescription(
      "Sign a message to confirm this address is yours."
    );
    expect(screen.getByText(mockAddress)).toBeInTheDocument();
    expect(screen.getByText("No transaction or gas fees.")).toBeInTheDocument();
    expect(screen.queryByText(/JWT/)).not.toBeInTheDocument();
    expect(props.onConfirmSignRequest).not.toHaveBeenCalled();
    const button = screen.getByRole("button", { name: "Sign message" });
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(props.onConfirmSignRequest).toHaveBeenCalledTimes(1);
  });
  it("announces wallet confirmation and prevents duplicate signing or cancellation", () => {
    const props = makeProps();
    render(
      <AuthSignModal {...props} isSigningPending isSignRequestInProgress />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Check your wallet");
    const button = screen.getByRole("button", { name: /Check your wallet/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
    fireEvent.click(button);
    escapeDialog();
    expect(
      screen.queryByRole("button", { name: "Cancel sign-in" })
    ).not.toBeInTheDocument();
    expect(props.onCancelSignRequest).not.toHaveBeenCalled();
    expect(props.onConfirmSignRequest).not.toHaveBeenCalled();
  });
  it("uses the existing cancellation callback for the close control", async () => {
    const props = makeProps();
    render(<AuthSignModal {...props} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Cancel sign-in" })
    );
    expect(props.onCancelSignRequest).toHaveBeenCalledTimes(1);
  });
  it("uses the existing cancellation callback for Escape before signing", () => {
    const props = makeProps();
    render(<AuthSignModal {...props} />);
    escapeDialog();
    expect(props.onCancelSignRequest).toHaveBeenCalledTimes(1);
  });
  it("preserves mandatory session-upgrade dismissal restrictions", () => {
    const props = makeProps();
    render(
      <AuthSignModal
        {...props}
        isSessionUpgradePrompt
        sessionUpgradeCanDismiss={false}
      />
    );
    escapeDialog();
    expect(props.onCancelSignRequest).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
  });
  it("returns focus to the triggering control after dismissal", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const props = makeProps();
    const { rerender } = render(<AuthSignModal {...props} />);
    rerender(<AuthSignModal {...props} shouldShowSignModal={false} />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});

describe("session upgrade time-left locale", () => {
  it.each<[SupportedLocale, string]>([
    ["en-US", "1,234 days"],
    ["de-DE", "1.234 days"],
    ["fr-FR", "1 234 days"],
  ])(
    "formats the count for %s while preserving message fallback",
    (locale, expected) => {
      expect(
        formatSessionUpgradeTimeLeft(1234 * 24 * 60 * 60 * 1000, locale)
      ).toBe(expected);
    }
  );
});
