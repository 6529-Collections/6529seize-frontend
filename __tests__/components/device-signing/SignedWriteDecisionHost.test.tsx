import SignedWriteDecisionHost from "@/components/device-signing/SignedWriteDecisionHost";
import {
  requestSigningDecision,
  type SigningDecision,
} from "@/lib/device-signing/signing-decision";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPrewarm = jest.fn();
jest.mock("@/hooks/device-signing/useDeviceSigningPrewarm", () => ({
  useDeviceSigningPrewarm: () => mockPrewarm(),
}));

const mockRequestGrant = jest.fn();
let mockCanEnable = true;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestSignedMessagesGrant: mockCanEnable ? mockRequestGrant : undefined,
  }),
}));

const ask = (request: Parameters<typeof requestSigningDecision>[0]) => {
  let decision!: Promise<SigningDecision>;
  act(() => {
    decision = requestSigningDecision(request);
  });
  return decision;
};

describe("SignedWriteDecisionHost", () => {
  beforeEach(() => {
    mockPrewarm.mockClear();
    mockRequestGrant.mockReset();
    mockCanEnable = true;
  });

  it("warms the device key and shows nothing until a write needs a decision", () => {
    render(<SignedWriteDecisionHost />);
    expect(mockPrewarm).toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("asks before a post goes unsigned and resolves the user's choice", async () => {
    const user = userEvent.setup();
    render(<SignedWriteDecisionHost />);
    const decision = ask({ action: "post", reason: "timeout" });

    const dialog = await screen.findByRole("alertdialog", {
      name: "Couldn't sign this post",
    });
    expect(dialog).toHaveAccessibleDescription(
      /Nothing has been sent yet\. This browser couldn't finish signing it\./
    );
    expect(
      screen.queryByRole("button", { name: "Cancel" })
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus()
    );

    await user.click(screen.getByRole("button", { name: "Send unsigned" }));
    await expect(decision).resolves.toBe("unsigned");
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
  });

  it("keeps a post's prompt open on Escape and retries on Try again", async () => {
    const user = userEvent.setup();
    render(<SignedWriteDecisionHost />);
    const decision = ask({ action: "edit", reason: "rejected" });

    await screen.findByRole("alertdialog", { name: "Couldn't sign this edit" });
    expect(screen.getByRole("button", { name: "Save unsigned" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await expect(decision).resolves.toBe("retry");
  });

  it("offers Cancel for reactions and deletes, and Escape cancels", async () => {
    const user = userEvent.setup();
    render(<SignedWriteDecisionHost />);
    const reaction = ask({ action: "react", reason: "crypto-error" });

    await screen.findByRole("alertdialog", {
      name: "Couldn't sign this reaction",
    });
    expect(
      screen.getByRole("button", { name: "Do it unsigned" })
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await expect(reaction).resolves.toBe("cancel");

    const deletion = ask({ action: "delete", reason: "lock" });
    await screen.findByRole("alertdialog", {
      name: "Couldn't sign this deletion",
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(deletion).resolves.toBe("cancel");
  });

  it("shows prompts one at a time in order", async () => {
    const user = userEvent.setup();
    render(<SignedWriteDecisionHost />);
    const first = ask({ action: "post", reason: "timeout" });
    const second = ask({ action: "react", reason: "timeout" });

    await screen.findByRole("alertdialog", { name: "Couldn't sign this post" });
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await expect(first).resolves.toBe("retry");

    await screen.findByRole("alertdialog", {
      name: "Couldn't sign this reaction",
    });
    await user.click(screen.getByRole("button", { name: "Do it unsigned" }));
    await expect(second).resolves.toBe("unsigned");
  });

  it("offers to turn signed messages back on when the grant can no longer sign", async () => {
    const user = userEvent.setup();
    mockRequestGrant.mockResolvedValueOnce({ success: true });
    render(<SignedWriteDecisionHost />);
    const decision = ask({ action: "post", reason: "grant-unusable" });

    const dialog = await screen.findByRole("alertdialog", {
      name: "Couldn't sign this post",
    });
    expect(dialog).toHaveAccessibleDescription(/revoked or has expired/);
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Turn on signed messages" })
    );
    expect(mockRequestGrant).toHaveBeenCalledTimes(1);
    await expect(decision).resolves.toBe("retry");
  });

  it("keeps the choice open when turning signed messages on fails", async () => {
    const user = userEvent.setup();
    mockRequestGrant.mockResolvedValueOnce({ success: false });
    render(<SignedWriteDecisionHost />);
    const decision = ask({ action: "post", reason: "grant-unusable" });

    await user.click(
      await screen.findByRole("button", { name: "Turn on signed messages" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't turn on signed messages."
    );
    await user.click(screen.getByRole("button", { name: "Send unsigned" }));
    await expect(decision).resolves.toBe("unsigned");
  });

  it("offers only the unsigned choice when signed messages cannot be turned on here", async () => {
    mockCanEnable = false;
    render(<SignedWriteDecisionHost />);
    void ask({ action: "post", reason: "grant-unusable" });

    await screen.findByRole("alertdialog");
    expect(
      screen.queryByRole("button", { name: "Turn on signed messages" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send unsigned" })).toBeVisible();
    act(() => {
      screen.getByRole("button", { name: "Send unsigned" }).click();
    });
  });
});
