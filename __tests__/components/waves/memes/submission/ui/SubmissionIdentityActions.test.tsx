import { SubmissionActionButton } from "@/components/waves/memes/submission/ui/SubmissionActionButton";
import { SubmissionIdentityPanel } from "@/components/waves/memes/submission/ui/SubmissionIdentityPanel";
import type { MemesSubmissionIdentity } from "@/components/waves/memes/submission/hooks/useMemesSubmissionIdentity";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createIdentity = (
  overrides: Partial<MemesSubmissionIdentity> = {}
): MemesSubmissionIdentity => ({
  status: "eligible",
  profileStatus: "eligible",
  profile: {
    id: "profile-a",
    handle: "alice",
    display: "Alice",
    pfp: null,
  } as any,
  address: "0x1234567890123456789012345678901234567890",
  walletName: "MetaMask",
  canSubmit: true,
  connectWallet: jest.fn(async () => undefined),
  verifyProfile: jest.fn(async () => undefined),
  retryEligibility: jest.fn(async () => undefined),
  ...overrides,
});

const renderAction = ({
  identity,
  onSubmit = jest.fn(),
  isSubmitting = false,
  submissionPhase = "idle",
  uploadProgress = 0,
}: {
  identity: MemesSubmissionIdentity;
  onSubmit?: jest.Mock;
  isSubmitting?: boolean;
  submissionPhase?:
    | "idle"
    | "uploading"
    | "signing"
    | "processing"
    | "success"
    | "error";
  uploadProgress?: number;
}) => {
  const view = render(
    <>
      <SubmissionIdentityPanel identity={identity} />
      <SubmissionActionButton
        identity={identity}
        isFormValid={true}
        isSubmitting={isSubmitting}
        submissionPhase={submissionPhase}
        uploadProgress={uploadProgress}
        submitLabel="Submit Artwork"
        onSubmit={onSubmit}
      />
    </>
  );
  return { onSubmit, ...view };
};

describe("Memes submission identity actions", () => {
  it("connects first and does not queue submission", async () => {
    const user = userEvent.setup();
    const identity = createIdentity({
      status: "disconnected",
      profileStatus: "disconnected",
      profile: null,
      address: null,
      walletName: null,
      canSubmit: false,
    });
    const { onSubmit } = renderAction({ identity });

    expect(
      screen.getByText(/connect a wallet to confirm the profile/i)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Connect Wallet" }));

    expect(identity.connectWallet).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the signer profile and submits only when eligible", async () => {
    const user = userEvent.setup();
    const identity = createIdentity();
    const { onSubmit } = renderAction({ identity });

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.queryByText(/0x1234|MetaMask/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Wallet connected" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Eligible to submit")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit Artwork" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the replacement profile and offers wallet switching when blocked", async () => {
    const user = userEvent.setup();
    const identity = createIdentity({
      status: "ineligible",
      profileStatus: "ineligible",
      profile: {
        id: "profile-b",
        handle: "bob",
        display: "Bob",
        pfp: null,
      } as any,
      address: "0x9876543210987654321098765432109876543210",
      canSubmit: false,
    });
    const { onSubmit } = renderAction({ identity });

    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/not eligible/i);
    await user.click(screen.getByRole("button", { name: "Switch Wallet" }));
    expect(identity.connectWallet).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps the authenticated profile and eligibility visible before connecting", async () => {
    const user = userEvent.setup();
    const identity = createIdentity({
      status: "disconnected",
      address: null,
      walletName: null,
      canSubmit: false,
    });
    const { onSubmit } = renderAction({ identity });

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.queryByText("Eligible to submit")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/connect a wallet to confirm/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit Artwork" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Connect Wallet" }));
    expect(identity.connectWallet).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(["hover", "focus", "click"] as const)(
    "explains the connection indicator on %s and dismisses with Escape",
    async (interaction) => {
      const user = userEvent.setup();
      renderAction({
        identity: createIdentity({
          status: "disconnected",
          address: null,
          canSubmit: false,
        }),
      });
      const indicator = screen.getByRole("button", {
        name: "Connect a wallet to submit",
      });
      if (interaction === "hover") await user.hover(indicator);
      if (interaction === "focus") await user.tab();
      if (interaction === "click") await user.click(indicator);
      expect(await screen.findByRole("tooltip")).toHaveTextContent(
        "Connect a wallet to submit"
      );
      await user.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
      );
    }
  );

  it("keeps the action disabled with a clear signing label", () => {
    const identity = createIdentity();
    renderAction({
      identity,
      isSubmitting: true,
      submissionPhase: "signing",
    });

    const button = screen.getByRole("button", {
      name: "Check Wallet to Sign…",
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(
      screen
        .getAllByRole("status")
        .some((status) => status.textContent === "Check Wallet to Sign…")
    ).toBe(true);
  });

  it("renders an unnamed profile safely and keeps its avatar decorative", () => {
    const identity = createIdentity({
      profile: {
        id: "profile-a",
        handle: null,
        display: "",
        pfp: "https://example.com/avatar.png",
      } as any,
    });

    const { container } = renderAction({ identity });

    expect(screen.getByText("Unknown profile")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});
