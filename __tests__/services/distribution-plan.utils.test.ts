import { makeErrorToast } from "@/services/distribution-plan.utils";

const mockShowAppToast = jest.fn();

jest.mock("@/components/utils/toast/AppToast", () => ({
  showAppToast: (toast: unknown) => mockShowAppToast(toast),
}));

describe("makeErrorToast", () => {
  beforeEach(() => {
    mockShowAppToast.mockClear();
  });

  it("routes errors through the shared toast helper", () => {
    makeErrorToast("Something went wrong");

    expect(mockShowAppToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Couldn't complete this action.",
        description: "Please try again.",
      })
    );
  });
});
