import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderPictureEditModal from "@/components/waves/header/picture/WaveHeaderPictureEditModal";
import type { ApiWave } from "@/generated/models/ApiWave";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiUpdateWaveHubRequest } from "@/generated/models/ApiUpdateWaveHubRequest";
import { updateWaveHub } from "@/services/api/wave-hub-api";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(
    (options: {
      mutationFn: (body: ApiUpdateWaveHubRequest) => Promise<unknown>;
      onSuccess: () => void;
      onSettled: () => void;
    }) => ({
      mutateAsync: async (body: ApiUpdateWaveHubRequest) => {
        await options.mutationFn(body);
        options.onSuccess();
        options.onSettled();
      },
    })
  ),
}));

jest.mock("@/services/api/wave-hub-api", () => ({
  updateWaveHub: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest
    .fn()
    .mockResolvedValue({ url: "https://example.com/wave.png" }),
}));

jest.mock(
  "@/components/waves/create-wave/overview/CreateWaveImageInput",
  () =>
    ({ setFile }: { setFile: (file: File) => void }) => (
      <div data-testid="image-input">
        <button
          type="button"
          onClick={() =>
            setFile(new File(["image"], "wave.png", { type: "image/png" }))
          }
        >
          Choose test image
        </button>
      </div>
    )
);

describe("WaveHeaderPictureEditModal", () => {
  it("uploads and saves a picture-only update inside the existing sheet", async () => {
    const user = userEvent.setup();
    const auth = createMockAuthContext({
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      setToast: jest.fn(),
    });
    const close = jest.fn();
    const query = { onWaveCreated: jest.fn() } as React.ContextType<
      typeof ReactQueryWrapperContext
    >;
    render(
      <AuthContext.Provider value={auth}>
        <ReactQueryWrapperContext.Provider value={query}>
          <div role="dialog" aria-label="Update wave picture">
            <WaveHeaderPictureEditModal
              isOpen
              embedded
              wave={{ id: "picture-wave" } as ApiWave}
              onClose={close}
            />
          </div>
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Choose test image" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(auth.requestAuth).toHaveBeenCalledTimes(1);
    expect(multiPartUpload).toHaveBeenCalledWith({
      file: expect.any(File),
      path: "wave",
    });
    expect(updateWaveHub).toHaveBeenCalledWith("picture-wave", {
      picture: "https://example.com/wave.png",
    });
    expect(query.onWaveCreated).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

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
