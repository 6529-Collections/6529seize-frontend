import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
