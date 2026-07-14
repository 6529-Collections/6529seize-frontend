import { WaveCompetitionBadges } from "@/components/waves/drops/WaveCompetitionBadges";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: { readonly children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("WaveCompetitionBadges", () => {
  it("renders separate circular participant and winner controls", () => {
    const onBadgeClick = jest.fn();

    render(
      <WaveCompetitionBadges
        isParticipant={true}
        isWinner={true}
        waveName="Cool Comp"
        onBadgeClick={onBadgeClick}
      />
    );

    const participant = screen.getByRole("button", {
      name: "View this participant’s competition entries in Cool Comp",
    });
    const winner = screen.getByRole("button", {
      name: "View this winner’s competition entries in Cool Comp",
    });

    expect(participant).toHaveClass("tw-rounded-full", "tw-size-6");
    expect(winner).toHaveClass("tw-rounded-full", "tw-size-6");

    fireEvent.click(participant);
    fireEvent.click(winner);

    expect(onBadgeClick).toHaveBeenNthCalledWith(1, "active");
    expect(onBadgeClick).toHaveBeenNthCalledWith(2, "winners");
  });

  it("omits badge kinds with no qualifying entries", () => {
    render(
      <WaveCompetitionBadges
        isParticipant={false}
        isWinner={true}
        waveName="Cool Comp"
        onBadgeClick={jest.fn()}
      />
    );

    expect(
      screen.queryByRole("button", { name: /participant’s competition/i })
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /winner’s competition entries/i })
    ).toBeInTheDocument();
  });
});
