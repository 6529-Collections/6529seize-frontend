import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCreateIdentitiesSearchItem from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItem";

const item = { pfp: "img.png", handle: "bob", display: "Bob" } as any;

test("calls onProfileSelect when clicked", async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();
  render(
    <GroupCreateIdentitiesSearchItem
      item={item}
      selected={false}
      onProfileSelect={onSelect}
    />
  );
  await user.click(screen.getByRole("button"));
  expect(onSelect).toHaveBeenCalledWith(item);
});

test("exposes its selected state", () => {
  render(
    <GroupCreateIdentitiesSearchItem
      item={item}
      selected
      onProfileSelect={() => {}}
    />
  );
  expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
});

test("keeps the search focused while selecting a result exactly once", async () => {
  const user = userEvent.setup();
  const onSelect = jest.fn();
  render(
    <>
      <input aria-label="Search people" />
      <GroupCreateIdentitiesSearchItem
        item={item}
        selected={false}
        onProfileSelect={onSelect}
      />
    </>
  );

  const search = screen.getByRole("textbox", { name: "Search people" });
  await user.click(search);
  await user.click(screen.getByRole("button"));

  expect(search).toHaveFocus();
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith(item);
});

test.each(["{Enter}", " "])(
  "selects a keyboard-focused result with %s",
  async (key) => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <GroupCreateIdentitiesSearchItem
        item={item}
        selected={false}
        onProfileSelect={onSelect}
      />
    );

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard(key);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(item);
  }
);

test("highlights the full interactive row on hover and keyboard focus", () => {
  render(
    <GroupCreateIdentitiesSearchItem
      item={item}
      selected={false}
      onProfileSelect={() => {}}
    />
  );

  expect(screen.getByRole("button")).toHaveClass(
    "tw-w-full",
    "desktop-hover:hover:tw-bg-iron-800",
    "focus-visible:tw-bg-iron-800"
  );
});
