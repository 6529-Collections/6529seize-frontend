import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveDropActionsReply from "@/components/waves/drops/WaveDropActionsReply";
import {
  useWaveEligibility,
  WaveEligibilityProvider,
} from "@/contexts/wave/WaveEligibilityContext";
import { ChatRestriction } from "@/hooks/useDropPriviledges";

let mockChat: Record<string, unknown>;
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0xabc",
    hasValidWalletAuth: true,
    connectionState: "connected",
  }),
}));
jest.mock("@/components/auth/auth-session-scope", () => ({
  isAuthSessionForProfile: () => true,
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: () => "0xabc",
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: { chat: mockChat } }),
}));
jest.mock(
  "@/hooks/content-moderation/usePublicProfileModerationStatus",
  () => ({
    usePublicProfileModerationStatus: () => ({
      isLoading: false,
      isSuspended: false,
    }),
  })
);

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("WaveDropActionsReply", () => {
  const baseDrop: any = {
    id: "1",
    wave: { id: "wave-1", authenticated_user_eligible_to_chat: true },
  };

  const makeEligibility = (overrides: any = {}) => ({
    authenticated_user_eligible_to_chat: true,
    authenticated_user_eligible_to_vote: true,
    authenticated_user_eligible_to_participate: true,
    authenticated_user_admin: false,
    ...overrides,
  });

  const EligibilitySeed = ({
    waveId,
    eligibility,
    children,
  }: {
    readonly waveId: string;
    readonly eligibility?: any;
    readonly children: React.ReactNode;
  }) => {
    const { updateEligibility } = useWaveEligibility();
    const [isSeeded, setIsSeeded] = React.useState(!eligibility);

    React.useEffect(() => {
      if (!eligibility) {
        return;
      }

      updateEligibility(waveId, eligibility);
      setIsSeeded(true);
    }, [eligibility, updateEligibility, waveId]);

    return isSeeded ? <>{children}</> : null;
  };

  const renderReply = ({
    drop = baseDrop,
    eligibility,
  }: {
    readonly drop?: any;
    readonly eligibility?: any;
  } = {}) => {
    const onReply = jest.fn();
    const setToast = jest.fn();
    mockChat = {
      enabled: true,
      authenticated_user_eligible:
        eligibility?.authenticated_user_eligible_to_chat ??
        drop.wave.authenticated_user_eligible_to_chat,
      replies: {
        authenticated_user_eligible:
          eligibility?.authenticated_user_eligible_to_reply ??
          drop.wave.authenticated_user_eligible_to_reply,
      },
      ...(eligibility?.authenticated_user_chat_restriction ===
      ChatRestriction.SLOW_MODE
        ? { slow_mode_cooldown_ms: 1000, next_drop_allowed: Date.now() + 60000 }
        : {}),
    };

    render(
      <AuthContext.Provider
        value={
          {
            setToast,
            connectedProfile: { id: "profile-1", handle: "alice" },
            isAuthenticated: true,
            isDirectProfileSession: true,
            activeProfileProxy: null,
            fetchingProfile: false,
          } as any
        }
      >
        <WaveEligibilityProvider>
          <EligibilitySeed waveId={drop.wave.id} eligibility={eligibility}>
            <WaveDropActionsReply
              drop={drop}
              activePartIndex={0}
              onReply={onReply}
            />
          </EligibilitySeed>
        </WaveEligibilityProvider>
      </AuthContext.Provider>
    );

    return { onReply, setToast };
  };

  it("enables reply when allowed", async () => {
    const user = userEvent.setup();
    const { onReply } = renderReply();

    const btn = screen.getByRole("button", { name: "Reply to drop" });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onReply).toHaveBeenCalled();
  });

  it("opens reply when slow mode is the only chat block", async () => {
    const user = userEvent.setup();
    const drop = {
      ...baseDrop,
      wave: {
        ...baseDrop.wave,
        authenticated_user_eligible_to_chat: false,
      },
    };
    const { onReply, setToast } = renderReply({
      drop,
      eligibility: makeEligibility({
        authenticated_user_eligible_to_chat: false,
        authenticated_user_chat_restriction: ChatRestriction.SLOW_MODE,
      }),
    });

    const btn = await screen.findByRole("button", { name: "Reply to drop" });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(setToast).not.toHaveBeenCalled();
  });

  it("blocks reply when chat eligibility is false without slow mode", () => {
    const drop = {
      ...baseDrop,
      wave: {
        ...baseDrop.wave,
        authenticated_user_eligible_to_chat: false,
      },
    };
    const { onReply, setToast } = renderReply({
      drop,
      eligibility: makeEligibility({
        authenticated_user_eligible_to_chat: false,
        authenticated_user_chat_restriction: ChatRestriction.NO_PERMISSION,
      }),
    });

    // The requested permission rule removes an action that cannot open a reply.
    expect(
      screen.queryByRole("button", { name: "Reply to drop" })
    ).not.toBeInTheDocument();
    expect(onReply).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
  });

  it("lets people outside the chat group reply when replies are open", async () => {
    const user = userEvent.setup();
    const drop = {
      ...baseDrop,
      wave: {
        ...baseDrop.wave,
        authenticated_user_eligible_to_chat: false,
        authenticated_user_eligible_to_reply: true,
      },
    };
    const { onReply, setToast } = renderReply({
      drop,
      eligibility: makeEligibility({
        authenticated_user_eligible_to_chat: false,
        authenticated_user_eligible_to_reply: true,
        authenticated_user_chat_restriction: ChatRestriction.NO_PERMISSION,
      }),
    });

    const btn = await screen.findByRole("button", { name: "Reply to drop" });
    await user.click(btn);
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(setToast).not.toHaveBeenCalled();
  });

  it("falls back to the drop's reply eligibility before the wave loads", async () => {
    const user = userEvent.setup();
    const drop = {
      ...baseDrop,
      wave: {
        ...baseDrop.wave,
        authenticated_user_eligible_to_chat: false,
        authenticated_user_eligible_to_reply: true,
      },
    };
    const { onReply } = renderReply({ drop });

    await user.click(screen.getByRole("button", { name: "Reply to drop" }));
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it("disables reply for temporary drop during slow mode", async () => {
    const user = userEvent.setup();
    const drop = {
      ...baseDrop,
      id: "temp-123",
      wave: {
        ...baseDrop.wave,
        authenticated_user_eligible_to_chat: false,
      },
    };
    const { onReply } = renderReply({
      drop,
      eligibility: makeEligibility({
        authenticated_user_eligible_to_chat: false,
        authenticated_user_chat_restriction: ChatRestriction.SLOW_MODE,
      }),
    });

    const btn = await screen.findByRole("button", { name: "Reply to drop" });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onReply).not.toHaveBeenCalled();
  });
});
