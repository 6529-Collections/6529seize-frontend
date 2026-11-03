import UserPageTabTransition from "@/components/user/layout/UserPageTabTransition";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useUserPageNavigation } from "@/components/user/layout/UserPageNavigation";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";

jest.mock("@/components/user/layout/UserPageNavigation", () => ({
  useUserPageNavigation: jest.fn(() => null),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const usePathnameMock = usePathname as jest.Mock;

describe("UserPageTabTransition", () => {
  beforeEach(() => {
    jest.mocked(useUserPageNavigation).mockReturnValue(null);
  });

  it("keeps the status region mounted and restores interaction after loading", () => {
    usePathnameMock.mockReturnValue("/alice");
    const content = (
      <UserPageTabTransition>
        <button>Profile action</button>
      </UserPageTabTransition>
    );
    const { rerender } = render(content);
    const status = screen.getByRole("status");
    const action = screen.getByRole("button", { name: "Profile action" });
    expect(status).toBeEmptyDOMElement();
    expect(action.parentElement).not.toHaveAttribute("inert");

    jest.mocked(useUserPageNavigation).mockReturnValue({
      pendingTab: USER_PAGE_TAB_IDS.COLLECTED,
      navigate: jest.fn(),
    });
    rerender(
      <UserPageTabTransition>
        <button>Profile action</button>
      </UserPageTabTransition>
    );
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Loading profile section");
    expect(status.closest('[aria-busy="true"]')).toBeNull();
    expect(action.parentElement).toHaveAttribute("inert");

    jest.mocked(useUserPageNavigation).mockReturnValue(null);
    rerender(content);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(action.parentElement).not.toHaveAttribute("inert");
    action.focus();
    expect(action).toHaveFocus();
  });

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
