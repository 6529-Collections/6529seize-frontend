import {
  AppToastContent,
  showAppToast,
} from "@/components/utils/toast/AppToast";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "react-toastify";

jest.mock("react-toastify", () => ({
  Slide: jest.fn(),
  ToastContainer: ({ children }: { readonly children?: ReactNode }) => (
    <div>{children}</div>
  ),
  toast: jest.fn(() => "toast-id"),
}));

describe("AppToast", () => {
  beforeEach(() => {
    (toast as unknown as jest.Mock).mockClear();
  });

  it("renders structured content and actions", () => {
    render(
      <AppToastContent
        toast={{
          type: "error",
          title: "Transaction failed.",
          description: "Please try again.",
          details: "Gas estimate failed.",
          action: {
            label: "View transaction",
            href: "https://etherscan.io/tx/0xabc",
            external: true,
          },
        }}
      />
    );

    expect(screen.getByText("Transaction failed.")).toBeInTheDocument();
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
    expect(screen.getByText("Gas estimate failed.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View transaction" })
    ).toHaveAttribute("target", "_blank");
  });

  it("uses error auto-close timing and renders normalized legacy messages", () => {
    showAppToast({
      type: "error",
      message: "Failed to save profile: backend unavailable",
      toastId: "save-profile",
    });

    expect(toast).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        autoClose: 8000,
        closeOnClick: false,
        position: "top-right",
        theme: "dark",
        toastId: "save-profile",
        type: "error",
      })
    );

    const renderedToast = (toast as unknown as jest.Mock).mock.calls[0][0];
    render(renderedToast);

    expect(screen.getByText("Couldn't save profile.")).toBeInTheDocument();
    expect(screen.getByText("backend unavailable.")).toBeInTheDocument();
  });

  it("uses compact timing for success toasts", () => {
    showAppToast({ type: "success", message: "Saved" });

    expect(toast).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        autoClose: 3000,
        type: "success",
      })
    );
  });
});
