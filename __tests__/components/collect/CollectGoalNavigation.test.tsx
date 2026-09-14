import CollectGoalNavigation from "@/components/collect/CollectGoalNavigation";
import type { CollectIntent } from "@/components/collect/collect.types";
import { fireEvent, render, screen, within } from "@testing-library/react";

it.each<CollectIntent>(["season", "full_set", "artist", "pebbles_set"])(
  "recognizes the %s deep link without resetting the selected goal",
  (intent) => {
    const onIntentChange = jest.fn();
    render(
      <CollectGoalNavigation
        intent={intent}
        collection="all"
        locale="en-US"
        onIntentChange={onIntentChange}
      />
    );

    const navigation = screen.getByRole("group", { name: "Collecting tools" });
    const completeSet = within(navigation).getByRole("button", {
      name: "Complete a set",
      pressed: true,
    });
    fireEvent.click(completeSet);
    expect(onIntentChange).not.toHaveBeenCalled();

    fireEvent.click(
      within(navigation).getByRole("button", { name: "Lowest listings" })
    );
    expect(onIntentChange).toHaveBeenCalledWith("lowest");
  }
);

it("opens the relevant set flow while preserving the current collection", () => {
  const onIntentChange = jest.fn();
  const { rerender } = render(
    <CollectGoalNavigation
      intent="lowest"
      collection="memes"
      locale="en-US"
      onIntentChange={onIntentChange}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Complete a set" }));
  expect(onIntentChange).toHaveBeenLastCalledWith("full_set");

  rerender(
    <CollectGoalNavigation
      intent="lowest"
      collection="pebbles"
      locale="en-US"
      onIntentChange={onIntentChange}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Complete a set" }));
  expect(onIntentChange).toHaveBeenLastCalledWith("pebbles_set");
});

it("follows changed URL intents and exposes TDH directly", () => {
  const onIntentChange = jest.fn();
  const { rerender } = render(
    <CollectGoalNavigation
      intent="lowest"
      collection="memes"
      locale="en-US"
      onIntentChange={onIntentChange}
    />
  );
  expect(
    screen.getByRole("button", { name: "Lowest listings", pressed: true })
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "TDH" }));
  expect(onIntentChange).toHaveBeenCalledWith("tdh");

  rerender(
    <CollectGoalNavigation
      intent="tdh"
      collection="memes"
      locale="en-US"
      onIntentChange={onIntentChange}
    />
  );
  expect(
    screen.getByRole("button", { name: "TDH", pressed: true })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Lowest listings", pressed: false })
  ).toBeVisible();
});
