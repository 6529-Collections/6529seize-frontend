import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CreateDropSubmit } from "@/components/waves/CreateDropSubmit";

describe("CreateDropSubmit", () => {
  it("renders drop text and triggers callback", async () => {
    const onDrop = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateDropSubmit
        submitting={false}
        canSubmit={true}
        isDropMode={true}
        onDrop={onDrop}
      />
    );
    const btn = screen.getByRole("button", { name: "Drop" });
    expect(btn).toHaveTextContent("Drop");
    await user.click(btn);
    expect(onDrop).toHaveBeenCalled();
  });

  it("disables button and shows only the loader while submitting", () => {
    render(
      <CreateDropSubmit
        submitting={true}
        canSubmit={false}
        isDropMode={false}
        onDrop={jest.fn()}
      />
    );
    const btn = screen.getByRole("button", { name: "Post in progress" });
    expect(btn).toBeDisabled();
    expect(btn.querySelector('[role="status"]')).toBeInTheDocument();
    expect(btn).not.toHaveTextContent("Post");
  });

  it("keeps the mobile submit icon from collapsing inside the fixed-width button", () => {
    render(
      <CreateDropSubmit
        submitting={false}
        canSubmit={false}
        isDropMode={false}
        onDrop={jest.fn()}
      />
    );

    const btn = screen.getByRole("button", { name: "Post" });
    expect(btn).toHaveClass(
      "tw-min-h-11",
      "tw-w-10",
      "tw-px-0",
      "lg:tw-w-[3.875rem]",
      "lg:tw-px-3.5"
    );
    expect(btn).not.toHaveClass("tw-px-5");

    const icon = btn.querySelector("svg");
    expect(icon).toHaveClass("tw-size-5", "tw-flex-shrink-0", "lg:tw-hidden");
  });
});
