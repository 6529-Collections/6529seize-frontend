import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CreateDropSubmit } from "@/components/waves/CreateDropSubmit";

jest.mock("@/components/utils/button/PrimaryButton", () => ({
  __esModule: true,
  default: ({
    onClicked,
    children,
    disabled,
    loading,
    ariaLabel,
    hideChildrenWhenLoading,
  }: any) => (
    <button
      onClick={onClicked}
      disabled={disabled}
      data-loading={loading}
      aria-label={ariaLabel}
    >
      {loading ? <span data-testid="loader" /> : null}
      {loading && hideChildrenWhenLoading ? null : children}
    </button>
  ),
}));

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
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(btn).not.toHaveTextContent("Post");
  });
});
