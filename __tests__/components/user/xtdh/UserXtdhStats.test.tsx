import { fireEvent, render, screen } from "@testing-library/react";
import { UserXtdhStats } from "@/components/user/xtdh/UserXtdhStats";

describe("UserXtdhStats owner shortcut", () => {
  it("describes its grant destination and keeps the existing handler", () => {
    const onOutboundClick = jest.fn();
    render(
      <UserXtdhStats
        generationRate={100}
        incomingRate={20}
        unusedRate={30}
        onOutboundClick={onOutboundClick}
      />
    );
    const shortcut = screen.getByRole("button", { name: "Outbound" });
    expect(shortcut).toHaveAccessibleDescription("Create New Grant");
    fireEvent.click(shortcut);
    expect(onOutboundClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the shortcut absent without owner access", () => {
    render(
      <UserXtdhStats generationRate={100} incomingRate={20} unusedRate={30} />
    );
    expect(
      screen.queryByRole("button", { name: "Outbound" })
    ).not.toBeInTheDocument();
  });
});
