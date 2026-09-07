import { SubmissionActionButton } from "@/components/waves/memes/submission/ui/SubmissionActionButton";
import { SubmissionIdentityPanel } from "@/components/waves/memes/submission/ui/SubmissionIdentityPanel";
import type { MemesSubmissionIdentity } from "@/components/waves/memes/submission/hooks/useMemesSubmissionIdentity";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createIdentity = (
  overrides: Partial<MemesSubmissionIdentity> = {}
): MemesSubmissionIdentity => ({
  status: "eligible",
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
  render(
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
  return { onSubmit };
};

describe("Memes submission identity actions", () => {
  it("connects first and does not queue submission", async () => {
    const user = userEvent.setup();
    const identity = createIdentity({
      status: "disconnected",
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
    expect(screen.getByText(/0x1234…7890/)).toBeInTheDocument();
    expect(screen.getByText("Eligible to submit")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit Artwork" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the replacement profile and offers wallet switching when blocked", async () => {
    const user = userEvent.setup();
    const identity = createIdentity({
      status: "ineligible",
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
  });
});
