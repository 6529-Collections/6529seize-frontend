import { render, screen } from "@testing-library/react";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

jest.mock("next/navigation", () => ({
  usePathname: () => "/alice/xtdh/received",
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("UserPageXtdhReceived", () => {
  it("renders helper text and info icon", () => {
    render(<UserPageXtdhReceived profileId="simo" />);

    expect(screen.getByRole("heading", { name: "xTDH Collections" }))
      .toBeInTheDocument();
    expect(
      screen.getByText(/Collections where this identity accrues xTDH\./i),
    ).toBeInTheDocument();
  });
});
