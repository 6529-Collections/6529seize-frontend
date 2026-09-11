import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RankScheduleModeSelector from "@/components/waves/create-wave/overview/type/RankScheduleModeSelector";

describe("RankScheduleModeSelector", () => {
  it("renders both modes with announce winners selected by default", () => {
    render(
      <RankScheduleModeSelector ongoingRanking={false} onChange={jest.fn()} />
    );

    expect(
      screen.getByRole("radio", { name: "Announce Winners" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Perpetual Ranking" })
    ).not.toBeChecked();
    expect(
      screen.getByText(/winners are announced on a schedule/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/rankings update continuously/i)
    ).toBeInTheDocument();
  });

  it("reflects the perpetual selection", () => {
    render(
      <RankScheduleModeSelector ongoingRanking onChange={jest.fn()} />
    );

    expect(
      screen.getByRole("radio", { name: "Perpetual Ranking" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Announce Winners" })
    ).not.toBeChecked();
  });

  it("emits the mode change", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <RankScheduleModeSelector ongoingRanking={false} onChange={onChange} />
    );

    await user.click(screen.getByText("Perpetual Ranking"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not emit when re-selecting the active mode", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <RankScheduleModeSelector ongoingRanking={false} onChange={onChange} />
    );

    await user.click(screen.getByText("Announce Winners"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
