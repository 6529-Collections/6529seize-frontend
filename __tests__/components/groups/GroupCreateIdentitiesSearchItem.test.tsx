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
