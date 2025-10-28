import { render, screen, fireEvent } from "@testing-library/react";
import CommonProfileSearchItem from "@/components/utils/input/profile-search/CommonProfileSearchItem";

const profile = { handle: "alice", wallet: "0x1", display: "Alice", pfp: "img.png" } as any;

it("calls on select and shows checkmark when selected", () => {
  const onSelect = jest.fn();
  const { container } = render(
    <CommonProfileSearchItem
      profile={profile}
      selected="0x1"
      onProfileSelect={onSelect}
      id="profile-search-item-0x1"
    />,
  );

  expect(screen.getByAltText("Alice avatar")).toBeInTheDocument();
  const visualItem = container.querySelector<HTMLElement>("#profile-search-item-0x1-visual");
  expect(visualItem).not.toBeNull();
  expect(visualItem?.dataset.optionId).toBe("profile-search-item-0x1");
  expect(visualItem?.querySelector('[data-icon="check"]')).not.toBeNull();

  visualItem && fireEvent.click(visualItem);
  expect(onSelect).toHaveBeenCalledWith(profile);
});
