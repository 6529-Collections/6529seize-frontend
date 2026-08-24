import { CURRENT_EULA_VERSION } from "@/constants/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockConsent = jest.fn();
let mockConsentContext = {
  consent: mockConsent,
  isSaving: false,
  saveError: null as string | null,
};

jest.mock("@/components/eula/EULAConsentContext", () => ({
  useEULAConsent: () => mockConsentContext,
}));

const EULAModal = require("@/components/eula/EULAModal").default;

function scrollAgreementToBottom() {
  const scrollContainer = screen.getByLabelText(
    "End User License Agreement text"
  );
  Object.defineProperty(scrollContainer, "scrollHeight", {
    value: 200,
    configurable: true,
  });
  Object.defineProperty(scrollContainer, "clientHeight", {
    value: 100,
    configurable: true,
  });
  scrollContainer.scrollTop = 100;
  fireEvent.scroll(scrollContainer);
}

describe("EULAModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsentContext = {
      consent: mockConsent,
      isSaving: false,
      saveError: null,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is an accessible, labelled modal with initial focus in the agreement", async () => {
    render(<EULAModal />);

    const dialog = screen.getByRole("dialog", {
      name: "End User License Agreement",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText(`Last Updated: ${CURRENT_EULA_VERSION}`)
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByLabelText("End User License Agreement text")
      ).toHaveFocus()
    );
  });

  it("traps focus inside the modal", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Outside</button>
        <EULAModal />
      </>
    );
    const dialog = screen.getByRole("dialog");
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true)
    );

    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("makes the underlying application inert and restores it on unmount", () => {
    const { container, unmount } = render(<EULAModal />);

    expect(container.inert).toBe(true);
    expect(container).toHaveAttribute("aria-hidden", "true");
    unmount();
    expect(container.inert).toBe(false);
    expect(container).not.toHaveAttribute("aria-hidden");
  });

  it("does not dismiss from Escape or backdrop clicks", () => {
    render(<EULAModal />);
    const dialog = screen.getByRole("dialog");
    const backdrop = dialog.parentElement as HTMLElement;

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(backdrop);

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(mockConsent).not.toHaveBeenCalled();
  });

  it("disables Agree until the agreement has been scrolled to the bottom", () => {
    render(<EULAModal />);
    const button = screen.getByRole("button", { name: "Agree" });
    expect(button).toBeDisabled();

    scrollAgreementToBottom();

    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(mockConsent).toHaveBeenCalledTimes(1);
  });

  it("enables Agree when the complete agreement fits without scrolling", async () => {
    jest
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(200);
    jest
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockReturnValue(200);

    render(<EULAModal />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Agree" })).toBeEnabled()
    );
  });

  it("scrolls to the bottom from the named scroll control", () => {
    render(<EULAModal />);
    const scrollContainer = screen.getByLabelText(
      "End User License Agreement text"
    );
    scrollContainer.scrollTo = jest.fn();

    fireEvent.click(
      screen.getByRole("button", { name: "Scroll to end of agreement" })
    );

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
  });

  it("locks and restores body scrolling on mount and unmount", () => {
    const originalOverflow = document.body.style.overflow;
    const { unmount } = render(<EULAModal />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("shows a retryable save error without dismissing the agreement", () => {
    mockConsentContext = {
      consent: mockConsent,
      isSaving: false,
      saveError: "We couldn't save your acceptance. Please try again.",
    };

    render(<EULAModal />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't save your acceptance. Please try again."
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    scrollAgreementToBottom();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeEnabled();
  });

  it("states the narrow moderation controls and user remedies accurately", () => {
    render(<EULAModal />);

    expect(
      screen.getByText(/6529 has zero tolerance for objectionable content/)
    ).toBeVisible();
    expect(
      screen.getByText(/Profanity, criticism, satire, political opinions/)
    ).toBeVisible();
    expect(
      screen.getByText(/report content and block abusive users/)
    ).toBeVisible();
    expect(screen.getByText(/taken within 24 hours/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "support@6529.io" })
    ).toHaveAttribute("href", "mailto:support@6529.io");
    expect(
      screen.queryByText(/monitor material posted to the app/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/every message.*AI/i)).not.toBeInTheDocument();
  });
});
