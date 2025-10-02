import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CreateDropDropModeToggle } from "@/components/waves/CreateDropDropModeToggle";
import { ChatRestriction, DropPrivileges } from "@/hooks/useDropPriviledges";

function setup(props: Partial<{isDropMode:boolean; privileges:DropPrivileges}> = {}) {
  const onDropModeChange = jest.fn();
  const privileges: DropPrivileges = props.privileges ?? { chatRestriction: null, submissionRestriction: null };
  render(
    <CreateDropDropModeToggle
      isDropMode={props.isDropMode ?? false}
      onDropModeChange={onDropModeChange}
      privileges={privileges}
    />
  );
  return { onDropModeChange };
}

test("allows toggling when enabled", async () => {
  const user = userEvent.setup();
  const { onDropModeChange } = setup();
  const btn = screen.getByRole("button");
  expect(btn).not.toBeDisabled();
  await user.click(btn);
  expect(onDropModeChange).toHaveBeenCalledWith(true);
});

test("disables button when restricted", async () => {
  const user = userEvent.setup();
  const { onDropModeChange } = setup({
    isDropMode: true,
    privileges: { chatRestriction: ChatRestriction.NOT_LOGGED_IN, submissionRestriction: null },
  });
  const btn = screen.getByRole("button");
  expect(btn).toBeDisabled();
  await user.click(btn);
  expect(onDropModeChange).not.toHaveBeenCalled();
});
