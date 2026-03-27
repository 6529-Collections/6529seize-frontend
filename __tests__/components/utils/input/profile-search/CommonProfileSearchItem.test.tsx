import { fireEvent, render, screen } from "@testing-library/react";
import CommonProfileSearchItem from "@/components/utils/input/profile-search/CommonProfileSearchItem";

const profile = {
  handle: "alice",
  wallet: "0x1",
  display: "Alice",
  pfp: "img.png",
} as any;

it("renders an interactive option and calls on select", () => {
  const onSelect = jest.fn();

  render(
    <ul role="listbox">
      <CommonProfileSearchItem
        profile={profile}
        isSelected={true}
        onProfileSelect={onSelect}
        id="profile-search-item-0x1"
      />
    </ul>
  );

  expect(screen.getByAltText(/Alice avatar/i)).toBeInTheDocument();

  const option = screen.getByRole("option");
  expect(option).toHaveAttribute("id", "profile-search-item-0x1");
  expect(option).toHaveAttribute("aria-selected", "true");
  expect(option.querySelector('[data-icon="check"]')).not.toBeNull();

  fireEvent.click(screen.getByRole("button"));

  expect(onSelect).toHaveBeenCalledWith(profile);
});
