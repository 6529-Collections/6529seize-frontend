import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

it("calls seizeConnectFresh on click", async () => {
  const user = userEvent.setup();
  const seizeConnectFresh = jest.fn().mockResolvedValue(undefined);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ seizeConnectFresh });
  render(<HeaderUserConnect />);
  await user.click(screen.getByRole("button"));
  expect(seizeConnectFresh).toHaveBeenCalled();
});

it("reports fresh connect failures", async () => {
  const user = userEvent.setup();
  const setToast = jest.fn();
  const error = new Error("disconnect failed");
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const seizeConnectFresh = jest.fn().mockRejectedValue(error);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ seizeConnectFresh });

  render(
    <AuthContext.Provider value={{ setToast } as any}>
      <HeaderUserConnect />
    </AuthContext.Provider>
  );

  await user.click(screen.getByRole("button"));

  await waitFor(() => {
    expect(setToast).toHaveBeenCalledWith({
      message: "Failed to open wallet connection. Please try again.",
      type: "error",
    });
  });
  expect(consoleErrorSpy).toHaveBeenCalledWith(
    "Failed to open wallet connection. Please try again.",
    error
  );

  consoleErrorSpy.mockRestore();
});
