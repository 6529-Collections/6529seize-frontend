import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeDropTraits from "@/components/memes/drops/MemeDropTraits";

jest.mock(
  "@/components/memes/drops/MemeDropTrait",
  () => (props: any) =>
    (
      <div
        data-testid="trait"
        data-label={props.label}
        data-value={props.value}></div>
    )
);

describe("MemeDropTraits", () => {
  const drop = {
    metadata: [
      { data_key: "artist", data_value: "bob" },
      { data_key: "memeName", data_value: "cool" },
      { data_key: "other", data_value: "val" },
    ],
  } as any;

  it("toggles showing all traits", async () => {
    const user = userEvent.setup();
    render(<MemeDropTraits drop={drop} />);
    expect(screen.getAllByTestId("trait")).toHaveLength(2);
    const btn = screen.getByRole("button");
    await user.click(btn);
    expect(screen.getAllByTestId("trait")).toHaveLength(3);
    expect(screen.getByText("Show less")).toBeInTheDocument();
    await user.click(screen.getByText("Show less"));
    expect(screen.getAllByTestId("trait")).toHaveLength(2);
  });
});
