import { render, screen } from "@testing-library/react";
import UserPageXtdhReceived from "@/components/xtdh/user/received";

describe("UserPageXtdhReceived", () => {
  it("renders hello world", () => {
    render(<UserPageXtdhReceived profileId="simo" />);

    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
