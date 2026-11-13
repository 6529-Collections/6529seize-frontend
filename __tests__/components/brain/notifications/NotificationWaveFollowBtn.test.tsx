import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationWaveFollowBtn from "@/components/brain/notifications/wave-created/NotificationWaveFollowBtn";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { useWaveJoin } from "@/hooks/waves/useWaveJoin";

jest.mock("@/hooks/waves/useWaveJoin", () => ({
  useWaveJoin: jest.fn(),
}));

const useWaveJoinMock = useWaveJoin as jest.MockedFunction<typeof useWaveJoin>;

function mockHook(toggleResult: boolean) {
  const toggle = jest.fn().mockResolvedValue(toggleResult);
  useWaveJoinMock.mockReturnValue({
    isJoined: false,
    isPending: false,
    join: jest.fn(),
    leave: jest.fn(),
    toggle,
  });
  return toggle;
}

function makeWave(subscribed: boolean): ApiWaveOverview {
  return {
    id: "wave-1",
    context_profile_context: { subscribed },
  } as unknown as ApiWaveOverview;
}

describe("NotificationWaveFollowBtn", () => {
  beforeEach(() => useWaveJoinMock.mockReset());

  it("joins through useWaveJoin with the all-messages subscription", async () => {
    const toggle = mockHook(true);
    render(<NotificationWaveFollowBtn wave={makeWave(false)} />);

    expect(useWaveJoinMock).toHaveBeenCalledWith(
      { id: "wave-1", subscribed_actions: [] },
      { subscribeToAllDrops: true }
    );
    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Joined" })).toBeTruthy();
  });

  it("passes current membership so a joined wave toggles to leave", async () => {
    const toggle = mockHook(true);
    render(<NotificationWaveFollowBtn wave={makeWave(true)} />);

    expect(
      useWaveJoinMock.mock.calls[0]?.[0].subscribed_actions.length
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Joined" }));

    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Join" })).toBeTruthy();
  });

  it("keeps its label when sign-in is cancelled or the change fails", async () => {
    const toggle = mockHook(false);
    render(<NotificationWaveFollowBtn wave={makeWave(false)} />);

    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Join" })).toBeTruthy();
  });
});
