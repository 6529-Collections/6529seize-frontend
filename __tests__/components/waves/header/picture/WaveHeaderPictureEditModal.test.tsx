import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderPictureEditModal from "@/components/waves/header/picture/WaveHeaderPictureEditModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { render, screen } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock(
  "@/components/waves/create-wave/overview/CreateWaveImageInput",
  () => () => <div data-testid="image-input" />
);

describe("WaveHeaderPictureEditModal", () => {
  it("uses the shared mobile sheet and tablet modal surface", () => {
    render(
      <AuthContext.Provider
        value={createMockAuthContext({
          requestAuth: jest.fn(),
          setToast: jest.fn(),
        })}
      >
        <WaveHeaderPictureEditModal
          isOpen
          wave={{ id: "wave-1" } as ApiWave}
          onClose={jest.fn()}
        />
      </AuthContext.Provider>
    );

    const dialog = screen.getByRole("dialog", {
      name: "Update wave picture",
    });
    const panel = dialog.querySelector(".mobile-wrapper-dialog");
    const surface = dialog.querySelector(".tw-rounded-t-2xl");

    expect(dialog).toHaveClass("tw-z-[9999]");
    expect(panel?.parentElement).toHaveClass(
      "tw-w-screen",
      "md:tw-w-full",
      "md:tw-max-w-xl"
    );
    expect(surface).toHaveClass("tw-rounded-t-2xl", "md:tw-rounded-xl");
    expect(
      screen.getByText("Choose a new image up to 10 MB.")
    ).toBeInTheDocument();
    expect(screen.getByTestId("image-input").parentElement).toHaveClass(
      "tw-mt-5"
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const saveButton = screen.getByRole("button", { name: "Save" });

    expect(cancelButton.parentElement).toHaveClass(
      "tw-pt-5",
      "tw-flex-col",
      "md:tw-flex-row-reverse"
    );
    expect(cancelButton).toHaveClass(
      "tw-hidden",
      "md:tw-inline-flex",
      "md:tw-w-auto"
    );
    expect(cancelButton).toHaveClass("tw-min-h-11", "tw-border-white/10");
    expect(saveButton).toHaveClass("tw-min-h-11", "tw-border-primary-500");
  });
});
