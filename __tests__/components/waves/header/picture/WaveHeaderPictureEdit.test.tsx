import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveHeaderPictureEdit from "@/components/waves/header/picture/WaveHeaderPictureEdit";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock(
  "@/components/waves/header/picture/WaveHeaderPictureEditModal",
  () =>
    ({ isOpen }: { readonly isOpen: boolean }) =>
      isOpen ? <div role="dialog">Picture editor</div> : null
);

describe("WaveHeaderPictureEdit", () => {
  it("keeps the edit action keyboard reachable and opens the dialog", async () => {
    const user = userEvent.setup();
    render(<WaveHeaderPictureEdit wave={{ id: "wave-1" } as ApiWave} />);

    const editButton = screen.getByRole("button", {
      name: "Edit wave picture",
    });
    expect(editButton).not.toHaveClass("tw-hidden");
    expect(editButton).toHaveClass(
      "focus-visible:tw-opacity-100",
      "focus-visible:tw-ring-2",
      "desktop-hover:group-hover:tw-opacity-100",
      "touch-only:tw-opacity-100"
    );

    await user.tab();
    expect(editButton).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toHaveTextContent("Picture editor");
  });
});
