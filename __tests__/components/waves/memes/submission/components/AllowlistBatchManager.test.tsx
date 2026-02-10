import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AllowlistBatchManager from "@/components/waves/memes/submission/components/AllowlistBatchManager";

describe("AllowlistBatchManager", () => {
  it("renders with no batches and allows adding one", async () => {
    const user = userEvent.setup();
    const onBatchesChange = jest.fn();
    render(<AllowlistBatchManager batches={[]} onBatchesChange={onBatchesChange} />);

    expect(screen.getByText(/No allowlist batches added/i)).toBeInTheDocument();
    
    const addButton = screen.getByText(/Add Batch/i);
    await user.click(addButton);
    
    expect(onBatchesChange).toHaveBeenCalledWith([
      expect.objectContaining({ contract: "", token_ids_raw: "" }),
    ]);
  });

  it("renders existing batches", () => {
    const batches = [
      { id: "batch-1", contract: "0x1", token_ids_raw: "1-10" },
      { id: "batch-2", contract: "0x2", token_ids_raw: "20,21" },
    ];
    render(<AllowlistBatchManager batches={batches} onBatchesChange={jest.fn()} />);

    expect(screen.getByDisplayValue("0x1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1-10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0x2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20,21")).toBeInTheDocument();
  });

  it("calls onBatchesChange when a batch is updated", async () => {
    const user = userEvent.setup();
    const onBatchesChange = jest.fn();
    const batches = [{ id: "batch-1", contract: "0x1", token_ids_raw: "1" }];
    render(<AllowlistBatchManager batches={batches} onBatchesChange={onBatchesChange} />);

    const contractInput = screen.getByDisplayValue("0x1");
    await user.type(contractInput, "2");
    await user.tab();

    expect(onBatchesChange).toHaveBeenCalledWith([{ id: "batch-1", contract: "0x12", token_ids_raw: "1" }]);
  });

  it("allows removing a batch", async () => {
    const user = userEvent.setup();
    const onBatchesChange = jest.fn();
    const batches = [
      { id: "batch-1", contract: "0x1", token_ids_raw: "1" },
      { id: "batch-2", contract: "0x2", token_ids_raw: "2" },
    ];
    render(<AllowlistBatchManager batches={batches} onBatchesChange={onBatchesChange} />);

    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    await user.click(removeButtons[0]);

    expect(onBatchesChange).toHaveBeenCalledWith([{ id: "batch-2", contract: "0x2", token_ids_raw: "2" }]);
  });
});
