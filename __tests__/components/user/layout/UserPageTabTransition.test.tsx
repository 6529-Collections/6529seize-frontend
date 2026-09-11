import UserPageTabTransition from "@/components/user/layout/UserPageTabTransition";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const usePathnameMock = usePathname as jest.Mock;

describe("UserPageTabTransition", () => {
  it("uses a compositor-friendly reduced-motion-safe entrance", () => {
    usePathnameMock.mockReturnValue("/alice");

    render(
      <UserPageTabTransition>
        <div>Profile content</div>
      </UserPageTabTransition>
    );

    expect(screen.getByText("Profile content").parentElement).toHaveClass(
      "tw-transform-gpu",
      "motion-safe:tw-animate-in",
      "motion-safe:tw-fade-in",
      "motion-safe:tw-slide-in-from-right-1",
      "motion-reduce:tw-animate-none"
    );
  });

  it("remounts the animated content when the profile route changes", () => {
    usePathnameMock.mockReturnValue("/alice");
    const { rerender } = render(
      <UserPageTabTransition>
        <div>Profile content</div>
      </UserPageTabTransition>
    );
    const firstContainer = screen.getByText("Profile content").parentElement;

    usePathnameMock.mockReturnValue("/alice/collected");
    rerender(
      <UserPageTabTransition>
        <div>Profile content</div>
      </UserPageTabTransition>
    );

    expect(screen.getByText("Profile content").parentElement).not.toBe(
      firstContainer
    );
  });
});
