import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CreateCurationDropContent from "@/components/waves/CreateCurationDropContent";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

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

jest.mock("react-redux", () => ({
  useSelector: jest.fn(() => null),
}));

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => ({
  __esModule: true,
  default: () => null,
}));

const wave = {
  id: "wave-1",
  wave: { type: "CHAT" },
  chat: { enabled: true },
  participation: {
    signature_required: false,
    terms: null,
  },
  metrics: {},
} as any;

describe("CreateCurationDropContent supported URLs", () => {
  it("toggles supported URLs inline in leaderboard variant without opening a new modal", async () => {
    const user = userEvent.setup();

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
          <CreateCurationDropContent
            activeDrop={null}
            onCancelReplyQuote={jest.fn()}
            wave={wave}
            dropId={null}
            isDropMode={true}
            submitDrop={jest.fn()}
            curationComposerVariant="leaderboard"
          />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );

    const toggleButton = screen.getByRole("button", {
      name: "View Supported URLs",
    });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(
      screen.getByRole("button", { name: "Hide Supported URLs" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("SuperRare artwork")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /supported urls/i })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hide Supported URLs" })
    );

    expect(
      screen.getByRole("button", { name: "View Supported URLs" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByText(
        "Submit one URL only. It must match one of these formats:"
      )
    ).not.toBeInTheDocument();
  });
});
