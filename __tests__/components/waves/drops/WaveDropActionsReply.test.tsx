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

    render(
      <AuthContext.Provider
        value={
          {
            setToast,
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

  it("blocks reply when chat eligibility is false without slow mode", async () => {
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
        authenticated_user_chat_restriction: ChatRestriction.NO_PERMISSION,
      }),
    });

    const btn = await screen.findByRole("button", { name: "Reply to drop" });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onReply).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: "You are not eligible to chat in this wave",
      type: "error",
    });
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
