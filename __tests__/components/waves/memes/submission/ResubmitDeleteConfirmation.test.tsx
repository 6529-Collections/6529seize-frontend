import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResubmitDeleteConfirmation } from "@/components/waves/memes/submission/ResubmitDeleteConfirmation";

const originalDrop = {
  id: "original",
  title: "Original card",
  metadata: [],
} as never;
const replacementDrop = { title: "New card", metadata: [] };

const renderConfirmation = (
  action?: "delete" | "withdraw" | "pending" | undefined
) => {
  const onDeleteOriginal = jest.fn();
  const onKeepBoth = jest.fn();
  render(
    <ResubmitDeleteConfirmation
      originalDrop={originalDrop}
      replacementDrop={replacementDrop}
      action={action}
      isDeleting={false}
      error={null}
      onDeleteOriginal={onDeleteOriginal}
      onKeepBoth={onKeepBoth}
    />
  );
  return { onDeleteOriginal, onKeepBoth };
};

describe("ResubmitDeleteConfirmation", () => {
  it("offers to delete the original on 6529.io", async () => {
    const { onDeleteOriginal } = renderConfirmation();
    expect(
      screen.getByRole("heading", { name: "Delete the original submission?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Original card")).toBeInTheDocument();
    expect(screen.getByText("New card")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Delete Original" })
    );
    expect(onDeleteOriginal).toHaveBeenCalled();
  });

  it("offers to withdraw the original on the 6529 Network", async () => {
    const { onDeleteOriginal } = renderConfirmation("withdraw");
    expect(
      screen.getByRole("heading", {
        name: "Withdraw the original submission?",
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Withdraw Original" })
    );
    expect(onDeleteOriginal).toHaveBeenCalled();
  });

  it("offers nothing for the original while the new version isn't final", async () => {
    const { onDeleteOriginal, onKeepBoth } = renderConfirmation("pending");
    expect(
      screen.getByRole("heading", { name: "Your new version isn't final yet" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/It was sent to the 6529 Network and may still land/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /original/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/is live/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onKeepBoth).toHaveBeenCalled();
    expect(onDeleteOriginal).not.toHaveBeenCalled();
  });
});
