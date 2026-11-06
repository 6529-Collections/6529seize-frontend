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

  it("uses the encrypted chat send icon at a fixed width on mobile and desktop", () => {
    render(
      <CreateDropSubmit
        submitting={false}
        canSubmit={false}
        isDropMode={false}
        onDrop={jest.fn()}
      />
    );

    const btn = screen.getByRole("button", { name: "Post" });
    expect(btn).toHaveClass("tw-size-10");
    expect(btn).toHaveClass(
      "tw-bg-primary-500",
      "tw-text-white",
      "disabled:tw-bg-iron-800",
      "disabled:tw-text-iron-500"
    );
    expect(btn).not.toHaveClass("tw-bg-iron-200", "disabled:tw-opacity-50");
    expect(btn).not.toHaveClass("lg:tw-w-[3.875rem]", "lg:tw-px-3.5");
    expect(btn.textContent).toBe("");
    // The shared `lg` preset adds `tw-px-5`, leaving this fixed-width button
    // with no content width and shrinking the mobile icon to 0px.
    expect(btn).not.toHaveClass("tw-px-5");

    const icon = btn.querySelector("svg");
    expect(icon).toHaveClass("tw-size-5", "tw-flex-shrink-0");
    expect(icon).not.toHaveClass("lg:tw-hidden");
    expect(icon).toHaveAttribute("fill", "none");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("preserves explicit Storm action labels", () => {
    render(
      <CreateDropSubmit
        submitting={false}
        canSubmit={true}
        isDropMode={false}
        label="Post storm"
        onDrop={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: "Post storm" })
    ).toHaveTextContent("Post storm");
  });
});
