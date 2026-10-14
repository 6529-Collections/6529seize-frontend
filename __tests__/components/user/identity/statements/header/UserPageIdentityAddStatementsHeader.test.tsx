import {
  fireEvent,
  act,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import UserPageIdentityAddStatementsHeader from "@/components/user/identity/statements/header/UserPageIdentityAddStatementsHeader";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

jest.mock(
  "@/components/user/identity/statements/add/UserPageIdentityStatementsAddButton",
  () => ({
    __esModule: true,
    default: () => <div data-testid="add-button" />,
  })
);

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

const mockedUseSeize = useSeizeConnectContext as jest.Mock;

const profile = { handle: "alice", wallets: [{ wallet: "0x1" }] } as any;

async function expectGuidanceDismissed(button: HTMLElement) {
  await waitFor(() => {
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
}

describe("UserPageIdentityAddStatementsHeader", () => {
  it("shows add button when viewing own profile", () => {
    mockedUseSeize.mockReturnValue({ address: "0x1" });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("add-button")).toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveTextContent(
      "alice's ID Statements"
    );
  });

  it("hides add button when not my profile", () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    render(
      <AuthContext.Provider value={{ activeProfileProxy: undefined } as any}>
        <UserPageIdentityAddStatementsHeader profile={profile} />
      </AuthContext.Provider>
    );
    expect(screen.queryByTestId("add-button")).toBeNull();
  });

  it("keeps all four guidance points in the heading tooltip", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    const user = userEvent.setup();
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await user.hover(
      screen.getByRole("button", { name: "About identity statements" })
    );
    const tooltip = await screen.findByRole("tooltip");
    expect(within(tooltip).getAllByRole("listitem")).toHaveLength(4);
    expect(tooltip).toHaveTextContent("All statements are optional.");
    expect(tooltip).toHaveTextContent(
      "All statements are fully and permanently public."
    );
    expect(tooltip).toHaveTextContent(
      "Social accounts are self-declared. 6529 does not connect to social media accounts or verify account ownership or posts."
    );
    expect(tooltip).toHaveTextContent(
      "The community will rate statement accuracy."
    );
  });

  it("opens from keyboard focus and dismisses with Escape", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    const user = userEvent.setup();
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    await user.tab();
    expect(
      screen.getByRole("button", { name: "About identity statements" })
    ).toHaveFocus();
    await screen.findByRole("tooltip");
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true")
    );
    await user.keyboard("{Escape}");
    await expectGuidanceDismissed(button);
  });

  it("supports a tap without hover and closes on an outside click", async () => {
    mockedUseSeize.mockReturnValue({ address: "0x2" });
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    fireEvent.click(
      screen.getByRole("button", { name: "About identity statements" })
    );
    await screen.findByRole("tooltip");
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true")
    );
    fireEvent.pointerDown(document.body);
    await expectGuidanceDismissed(button);
  });

  it("removes the tooltip on Escape without waiting for an animation to finish", async () => {
    jest.useFakeTimers();
    try {
      mockedUseSeize.mockReturnValue({ address: "0x2" });
      render(<UserPageIdentityAddStatementsHeader profile={profile} />);
      const button = screen.getByRole("button", {
        name: "About identity statements",
      });

      for (let cycle = 0; cycle < 3; cycle += 1) {
        fireEvent.click(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("tooltip")).toBeVisible();

        fireEvent.keyDown(window, { key: "Escape" });
        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        await act(async () => jest.advanceTimersByTime(100));
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it("opens and reopens from server-rendered markup in a fresh visitor session", async () => {
    mockedUseSeize.mockReturnValue({ address: undefined });
    const header = <UserPageIdentityAddStatementsHeader profile={profile} />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(header);
    document.body.appendChild(container);
    render(header, { container, hydrate: true });
    const user = userEvent.setup();
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await user.click(button);
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeVisible();
      expect(button).toHaveAttribute("aria-describedby", tooltip.id);
      await user.keyboard("{Escape}");
      await expectGuidanceDismissed(button);
    }
  });

  it("keeps guidance open when moving onto it and cancels a pending close on reopen", () => {
    jest.useFakeTimers();
    try {
      mockedUseSeize.mockReturnValue({ address: undefined });
      const { unmount } = render(
        <UserPageIdentityAddStatementsHeader profile={profile} />
      );
      const button = screen.getByRole("button", {
        name: "About identity statements",
      });
      fireEvent.mouseEnter(button);
      const tooltip = screen.getByRole("tooltip");
      fireEvent.mouseLeave(button);
      fireEvent.mouseEnter(tooltip);
      fireEvent.blur(button);
      act(() => jest.advanceTimersByTime(200));
      expect(tooltip).toBeVisible();
      fireEvent.mouseLeave(tooltip);
      fireEvent.keyDown(window, { key: "Escape" });
      fireEvent.click(button);
      act(() => jest.advanceTimersByTime(200));
      expect(screen.getByRole("tooltip")).toBeVisible();
      fireEvent.mouseLeave(button);
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("closes on page scroll and can open again", () => {
    mockedUseSeize.mockReturnValue({ address: undefined });
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    const bounds = jest
      .spyOn(button, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(200, 300, 32, 32));
    fireEvent.click(button);
    bounds.mockReturnValue(new DOMRect(200, 200, 32, 32));
    fireEvent.scroll(window);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("tooltip")).toBeVisible();
    bounds.mockRestore();
  });

  it("ignores a queued scroll-into-view event and unrelated scrollers after a click", () => {
    mockedUseSeize.mockReturnValue({ address: undefined });
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    fireEvent.click(button);
    fireEvent.scroll(document);
    fireEvent.scroll(screen.getByRole("heading"));
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("keeps focused guidance open after the pointer leaves and closes on blur", async () => {
    mockedUseSeize.mockReturnValue({ address: undefined });
    const user = userEvent.setup();
    render(<UserPageIdentityAddStatementsHeader profile={profile} />);
    const button = screen.getByRole("button", {
      name: "About identity statements",
    });
    await user.click(button);
    await user.unhover(button);
    expect(button).toHaveFocus();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("tooltip")).toBeVisible();
    await user.tab();
    await expectGuidanceDismissed(button);
  });

  it("positions the portal inside a narrow viewport and flips below a high trigger", () => {
    const width = jest.replaceProperty(window, "innerWidth", 390);
    const height = jest.replaceProperty(window, "innerHeight", 844);
    const bounds = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("role") === "tooltip"
          ? new DOMRect(0, 0, 320, 220)
          : new DOMRect(280, 100, 32, 32);
      });
    try {
      mockedUseSeize.mockReturnValue({ address: undefined });
      render(<UserPageIdentityAddStatementsHeader profile={profile} />);
      fireEvent.click(
        screen.getByRole("button", { name: "About identity statements" })
      );
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.parentElement).toBe(document.body);
      expect(tooltip.style.position).toBe("fixed");
      expect(tooltip.style.left).toBe("62px");
      expect(tooltip.style.top).toBe("140px");
      expect(tooltip.style.visibility).toBe("visible");
      fireEvent.scroll(within(tooltip).getByRole("list"));
      expect(tooltip).toBeVisible();
    } finally {
      bounds.mockRestore();
      width.restore();
      height.restore();
    }
  });
});
