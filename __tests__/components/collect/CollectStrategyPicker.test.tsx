import { fireEvent, render, screen, within } from "@testing-library/react";
import CollectStrategyPicker from "@/components/collect/CollectStrategyPicker";

test("exposes all five acquisition strategies directly with an explicit selected state", () => {
  const onChange = jest.fn();
  render(
    <CollectStrategyPicker value="buy" locale="en-US" onChange={onChange} />
  );
  const options = within(
    screen.getByRole("group", { name: "How would you like to collect?" })
  );
  expect(options.getAllByRole("button")).toHaveLength(5);
  expect(options.getByRole("button", { name: "Buy now" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  for (const [name, value] of [
    ["At WETH offer", "match_bid"],
    ["WETH + %", "improve_bid"],
    ["Ask − %", "discount_ask"],
    ["Blended", "blended"],
  ] as const) {
    fireEvent.click(options.getByRole("button", { name }));
    expect(onChange).toHaveBeenLastCalledWith(value);
  }
});
