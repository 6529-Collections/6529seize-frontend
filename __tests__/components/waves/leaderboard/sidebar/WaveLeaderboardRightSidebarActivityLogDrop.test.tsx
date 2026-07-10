import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { WaveLeaderboardRightSidebarActivityLogDrop } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarActivityLogDrop";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "fr-FR",
}));

jest.mock("@/helpers/waves/wave-right-panel.helpers", () => ({
  waveRightPanelText: jest.fn(() => "View drop in chat"),
}));

function setup() {
  const onDropClick = jest.fn();
  render(
    <WaveLeaderboardRightSidebarActivityLogDrop onDropClick={onDropClick} />
  );
  return onDropClick;
}

describe("WaveLeaderboardRightSidebarActivityLogDrop", () => {
  it("resolves its accessible label with the active locale", () => {
    setup();

    expect(waveRightPanelText).toHaveBeenCalledWith(
      "waves.sidebar.rightPanel.activity.openDropAriaLabel",
      {},
      "fr-FR"
    );
    expect(
      screen.getByRole("button", { name: "View drop in chat" })
    ).toBeInTheDocument();
  });

  it("calls the activity log drop handler", () => {
    const onClick = setup();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
