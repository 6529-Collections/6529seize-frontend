import { render, screen } from "@testing-library/react";
import UserPageRepNewRep from "@/components/user/rep/new-rep/UserPageRepNewRep";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("@/components/user/rep/new-rep/UserPageRepNewRepSearch", () => ({
  __esModule: true,
  default: () => <div data-testid="search" />,
}));

describe("UserPageRepNewRep", () => {
  const profile = { id: "1" } as ApiIdentity;

  it("renders search component", () => {
    render(<UserPageRepNewRep profile={profile} overview={null} />);
    expect(screen.getByTestId("search")).toBeInTheDocument();
  });
});
