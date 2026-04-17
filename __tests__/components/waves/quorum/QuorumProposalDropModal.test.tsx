import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import QuorumProposalDropModal from "@/components/waves/quorum/QuorumProposalDropModal";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isSafeWallet: false,
    address: null,
  })),
}));

jest.mock("@/hooks/drops/useDropSignature", () => ({
  useDropSignature: jest.fn(() => ({
    signDrop: jest.fn(async () => ({ success: true, signature: "0xabc" })),
  })),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => ({
  __esModule: true,
  default: () => null,
}));

const wave = {
  id: "wave-1",
  name: "QUORUM",
  participation: {
    signature_required: false,
    terms: null,
    authenticated_user_eligible: true,
  },
  voting: {
    authenticated_user_eligible: true,
    credit_type: "REP",
    period: {},
    forbid_negative_votes: false,
  },
  chat: {
    authenticated_user_eligible: true,
  },
  description_drop: { id: "description" },
  metrics: {},
  wave: {},
} as any;

const renderModal = (submitDrop = jest.fn()) => {
  render(
    <AuthContext.Provider
      value={
        {
          requestAuth: async () => ({ success: true }),
          setToast: jest.fn(),
          connectedProfile: null,
        } as any
      }
    >
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn(async () => {}) } as any}
      >
        <QuorumProposalDropModal
          isOpen
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={wave}
          dropId={null}
          submitDrop={submitDrop}
          onClose={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
};

describe("QuorumProposalDropModal", () => {
  it("builds markdown and submits one participatory drop part", async () => {
    const user = userEvent.setup();
    const submitDrop = jest.fn();
    renderModal(submitDrop);

    await user.type(screen.getByLabelText("Summary"), "Coordinate proposals.");
    for (let i = 0; i < 4; i += 1) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }

    expect(screen.getByText(/Coordinate proposals./)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit Proposal" }));

    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    const submitBody = submitDrop.mock.calls[0][0];
    expect(submitBody.drop.title).toBeNull();
    expect(submitBody.drop.drop_type).toBe("PARTICIPATORY");
    expect(submitBody.drop.parts).toHaveLength(1);
    expect(submitBody.drop.parts[0].content).toContain(
      "# Untitled QUORUM Proposal"
    );
    expect(submitBody.drop.parts[0].content).toContain("Coordinate proposals.");
  });

  it("keeps submit disabled until the draft has content", async () => {
    const user = userEvent.setup();
    renderModal();

    for (let i = 0; i < 4; i += 1) {
      await user.click(screen.getByRole("button", { name: "Next" }));
    }

    expect(
      screen.getByRole("button", { name: "Submit Proposal" })
    ).toBeDisabled();
  });
});
