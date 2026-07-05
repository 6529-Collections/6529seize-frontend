import WaveDropActionsCopyText from "@/components/waves/drops/WaveDropActionsCopyText";
import { buildDropClipboardText } from "@/helpers/waves/drop-clipboard.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const writeText = jest.fn().mockResolvedValue(undefined);

const createDrop = (overrides: Record<string, unknown> = {}): any => ({
  id: "d1",
  serial_no: 5,
  drop_type: ApiDropType.Chat,
  author: { handle: "alice" },
  created_at: 1735689600000,
  wave: { id: "w1", name: "Test Wave" },
  parts: [
    {
      part_id: 1,
      content: "gm **frens**",
      quoted_drop: null,
      media: [],
    },
  ],
  metadata: [],
  reply_to: null,
  ...overrides,
});

describe("WaveDropActionsCopyText", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("copies the drop clipboard text and notifies the menu", async () => {
    const onCopy = jest.fn();
    const drop = createDrop();

    render(<WaveDropActionsCopyText drop={drop} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

    expect(writeText).toHaveBeenCalledWith(buildDropClipboardText(drop));
    await waitFor(() => expect(onCopy).toHaveBeenCalled());
  });

  it("closes the menu without crashing when the clipboard API is unavailable", async () => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const onCopy = jest.fn();

    render(<WaveDropActionsCopyText drop={createDrop()} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy text" }));

    await waitFor(() => expect(onCopy).toHaveBeenCalled());
  });

  it("is disabled for temporary drops and copies nothing", () => {
    const onCopy = jest.fn();

    render(
      <WaveDropActionsCopyText
        drop={createDrop({ id: "temp-123" })}
        onCopy={onCopy}
      />
    );

    const button = screen.getByRole("button", { name: "Copy text" });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
