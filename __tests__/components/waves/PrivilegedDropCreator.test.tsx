import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ChatRestriction, useDropPrivileges } from "@/hooks/useDropPriviledges";
import {
  useWaveEligibility,
  WaveEligibilityProvider,
} from "@/contexts/wave/WaveEligibilityContext";

const mockInvalidateQueries = jest.fn(() => Promise.resolve());

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));
jest.mock("@/hooks/useDropPriviledges", () => ({
  useDropPrivileges: jest.fn(),
  ChatRestriction: { SLOW_MODE: "SLOW_MODE" },
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => ({}) }));
const mockUseSeizeConnectContext = jest.fn(() => ({
  address: undefined,
  hasValidWalletAuth: false,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockUseSeizeConnectContext(),
}));
jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <button type="button">Create profile</button>,
}));
jest.mock("@/components/waves/DropPlaceholder", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="placeholder" data-type={props.type}>
      {props.action}
    </div>
  ),
}));
jest.mock("@/components/waves/CreateDrop", () => ({
  __esModule: true,
  default: () => <div data-testid="create" />,
}));

const mockPriv = useDropPrivileges as jest.Mock;
const wave: any = {
  id: "wave-1",
  chat: { authenticated_user_eligible: true, enabled: true },
  participation: { authenticated_user_eligible: true },
  metrics: {},
};

const renderPrivilegedDropCreator = (
  props: Partial<React.ComponentProps<typeof PrivilegedDropCreator>> = {}
) =>
  render(
    <WaveEligibilityProvider>
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.CHAT}
        {...props}
      />
    </WaveEligibilityProvider>
  );

const EligibilityProbe = ({
  waveId,
  onEligibility,
}: {
  readonly waveId: string;
  readonly onEligibility: (eligibility: any) => void;
}) => {
  const { getEligibility } = useWaveEligibility();

  React.useEffect(() => {
    onEligibility(getEligibility(waveId));
  }, [getEligibility, onEligibility, waveId]);

  return null;
};

describe("PrivilegedDropCreator", () => {
  beforeEach(() => {
    mockPriv.mockReset();
    mockInvalidateQueries.mockClear();
    mockUseSeizeConnectContext.mockReturnValue({
      address: undefined,
      hasValidWalletAuth: false,
    });
  });

  it("shows both placeholder when both restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: "SUB",
      chatRestriction: "CHAT",
    });
    renderPrivilegedDropCreator({ fixedDropMode: DropMode.BOTH });
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "both"
    );
  });

  it("shows chat placeholder when chat restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: "CHAT",
    });
    renderPrivilegedDropCreator();
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "chat"
    );
  });

  it("shows submission placeholder when submission restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: "SUB",
      chatRestriction: null,
    });
    renderPrivilegedDropCreator({ fixedDropMode: DropMode.PARTICIPATION });
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "submission"
    );
  });

  it("renders CreateDrop when allowed", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: null,
    });
    renderPrivilegedDropCreator({ fixedDropMode: DropMode.BOTH });
    expect(screen.getByTestId("create")).toBeInTheDocument();
  });

  it("passes needs profile state for connected wallets without a profile", () => {
    mockUseSeizeConnectContext.mockReturnValue({
      address: "0xabc",
      hasValidWalletAuth: true,
    });
    mockPriv.mockReturnValue({
      submissionRestriction: "SUB",
      chatRestriction: "CHAT",
    });

    renderPrivilegedDropCreator({ fixedDropMode: DropMode.BOTH });

    expect(mockPriv).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoggedIn: false,
        needsProfile: true,
      })
    );
    expect(
      screen.getByRole("button", { name: "Create profile" })
    ).toBeInTheDocument();
  });

  it("keeps chat composer visible during slow mode cooldown", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: ChatRestriction.SLOW_MODE,
    });
    renderPrivilegedDropCreator();
    expect(screen.getByTestId("create")).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
  });

  it("writes slow mode chat restriction to wave eligibility context", async () => {
    const onEligibility = jest.fn();
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: ChatRestriction.SLOW_MODE,
    });

    render(
      <WaveEligibilityProvider>
        <PrivilegedDropCreator
          activeDrop={null}
          onCancelReplyQuote={() => {}}
          onDropAddedToQueue={() => {}}
          wave={wave}
          dropId={null}
          fixedDropMode={DropMode.CHAT}
        />
        <EligibilityProbe waveId={wave.id} onEligibility={onEligibility} />
      </WaveEligibilityProvider>
    );

    await waitFor(() =>
      expect(onEligibility).toHaveBeenLastCalledWith(
        expect.objectContaining({
          authenticated_user_chat_restriction: ChatRestriction.SLOW_MODE,
        })
      )
    );
  });

  it("invalidates the wave when the slow mode expiry callback fires", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: null,
    });
    renderPrivilegedDropCreator();

    const privilegesInput = mockPriv.mock.calls[0][0];
    privilegesInput.onSlowModeCooldownExpired();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
    });
  });
});
