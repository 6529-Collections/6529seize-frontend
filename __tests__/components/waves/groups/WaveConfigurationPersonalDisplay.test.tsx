import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveConfigurationPersonalDisplay from "@/components/waves/groups/WaveConfigurationPersonalDisplay";

jest.mock(
  "@/components/waves/boosted-drops/BoostedDropsDisplayPreference",
  () => ({
    __esModule: true,
    default: () => <div>Boosted-display choices</div>,
  })
);

describe("WaveConfigurationPersonalDisplay", () => {
  it("renders the personal display control at an accessible heading", () => {
    render(<WaveConfigurationPersonalDisplay />);

    expect(
      screen.getByRole("heading", { name: "Your display" })
    ).toBeInTheDocument();
    expect(screen.getByText("Boosted-display choices")).toBeInTheDocument();
  });

  it("explains that the preference affects only the current viewer", async () => {
    const user = userEvent.setup();
    render(<WaveConfigurationPersonalDisplay />);

    const infoButton = screen.getByRole("button", {
      name: "About your display preference",
    });
    await user.hover(infoButton);

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This setting only changes how boosted drops appear to you. It does not affect what other people see."
    );
  });
});
