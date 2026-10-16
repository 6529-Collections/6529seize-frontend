import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemeCollaboratorPicker } from "@/components/waves/memes/collaborations/MemeCollaboratorPicker";
import { commonApiFetch } from "@/services/api/common-api";
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: { id: "A" } }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  default: ({
    disabled,
    onSelectionChange,
  }: {
    disabled: boolean;
    onSelectionChange: (value: unknown) => void;
  }) => (
    <button
      disabled={disabled}
      onClick={() => onSelectionChange({ profileId: "B", value: "artistB" })}
    >
      Search profile
    </button>
  ),
}));
beforeEach(() =>
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue({ id: "B", handle: "artistB", pfp: null })
);
it("rejects an artist who already has an invitation", async () => {
  const onChange = jest.fn();
  render(
    <MemeCollaboratorPicker
      collaborators={[]}
      excludedIds={["B"]}
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Add collaborators" }));
  fireEvent.click(screen.getByText("Search profile"));
  await screen.findByRole("alert");
  expect(onChange).not.toHaveBeenCalled();
});
it("selects a new artist while preserving the existing roster outside the picker", async () => {
  const onChange = jest.fn();
  render(
    <MemeCollaboratorPicker
      collaborators={[]}
      excludedIds={["C"]}
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Add collaborators" }));
  fireEvent.click(screen.getByText("Search profile"));
  await waitFor(() =>
    expect(onChange).toHaveBeenCalledWith([
      { id: "B", handle: "artistB", display: "artistB", pfp: null },
    ])
  );
});
it("counts existing invitations toward the maximum and disables selection while saving", () => {
  const { rerender } = render(
    <MemeCollaboratorPicker
      collaborators={[]}
      excludedIds={Array.from({ length: 20 }, (_, i) => String(i))}
      onChange={jest.fn()}
    />
  );
  expect(screen.getByText("Search profile")).toBeDisabled();
  rerender(
    <MemeCollaboratorPicker collaborators={[]} disabled onChange={jest.fn()} />
  );
  expect(screen.getByText("Search profile")).toBeDisabled();
});

it("starts collapsed and preserves selected collaborators when folded", () => {
  const onChange = jest.fn();
  const { rerender } = render(
    <MemeCollaboratorPicker collaborators={[]} onChange={onChange} />
  );
  const add = screen.getByRole("button", { name: "Add collaborators" });
  expect(add).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("button", { name: "Search profile" })
  ).not.toBeInTheDocument();
  fireEvent.click(add);
  expect(add).toHaveAttribute("aria-expanded", "true");
  rerender(
    <MemeCollaboratorPicker
      collaborators={[
        { id: "B", handle: "artistB", display: "artistB", pfp: null },
      ]}
      onChange={onChange}
    />
  );
  expect(screen.getByText("@artistB")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Collaborators (1)" }));
  expect(
    screen.getByRole("button", { name: "Collaborators (1)" })
  ).toHaveAttribute("aria-expanded", "false");
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Collaborators (1)" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Remove invitation for artistB" })
  );
  expect(onChange).toHaveBeenCalledWith([]);
});
