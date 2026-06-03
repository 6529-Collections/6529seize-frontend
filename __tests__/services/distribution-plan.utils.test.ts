import { makeErrorToast } from "@/services/distribution-plan.utils";
import { toast } from "react-toastify";

jest.mock("react-toastify", () => ({
  toast: jest.fn(),
  Slide: jest.fn(),
}));

describe("makeErrorToast", () => {
  beforeEach(() => {
    (toast as unknown as jest.Mock).mockClear();
  });

  it("shows error toasts for 8 seconds", () => {
    makeErrorToast("Something went wrong");

    expect(toast).toHaveBeenCalledWith(
      "Something went wrong",
      expect.objectContaining({
        type: "error",
        autoClose: 8000,
      })
    );
  });
});
