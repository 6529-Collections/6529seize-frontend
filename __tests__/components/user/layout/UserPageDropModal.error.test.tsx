import UserPageDropModal from "@/components/user/layout/UserPageDropModal";
import { useDropModal } from "@/hooks/useDropModal";
import { render, waitFor } from "@testing-library/react";

jest.mock("@/hooks/useDropModal", () => ({ useDropModal: jest.fn() }));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { headerSpace: 0 } }),
}));
jest.mock("@/components/waves/drop/SingleWaveDrop", () => {
  throw new Error("chunk failed to load");
});

describe("UserPageDropModal when the single drop view fails to load", () => {
  it("closes the requested drop instead of leaving it half open", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const onDropClose = jest.fn();
    jest.mocked(useDropModal).mockReturnValue({
      activeDrop: undefined,
      drop: undefined,
      dropId: "artwork",
      isDropOpen: false,
      isLoading: true,
      onDropClose,
    });

    render(<UserPageDropModal />);

    await waitFor(() => expect(onDropClose).toHaveBeenCalled());
    consoleError.mockRestore();
  });
});
