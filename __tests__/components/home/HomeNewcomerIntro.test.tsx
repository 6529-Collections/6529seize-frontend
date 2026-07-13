import HomeNewcomerIntro from "@/components/home/newcomer/HomeNewcomerIntro";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(),
}));

const useAuthMock = jest.mocked(useAuth);
const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const useBrowserLocaleMock = jest.mocked(useBrowserLocale);

describe("HomeNewcomerIntro", () => {
  it("links to onboarding and reflects an open wallet flow", () => {
    useBrowserLocaleMock.mockReturnValue("en-US");
    useAuthMock.mockReturnValue({ setToast: jest.fn() } as ReturnType<
      typeof useAuth
    >);
    useSeizeConnectContextMock.mockReturnValue({
      seizeConnectFresh: jest.fn(),
      seizeConnectOpen: true,
    } as ReturnType<typeof useSeizeConnectContext>);

    render(<HomeNewcomerIntro />);

    expect(screen.getByRole("link", { name: "Start here" })).toHaveAttribute(
      "href",
      "/join-6529"
    );
    expect(
      screen.getByRole("button", { name: "Opening wallet" })
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Opening wallet");
  });

  it("prevents repeat wallet requests and recovers from an open error", async () => {
    const user = userEvent.setup();
    const setToast = jest.fn();
    let rejectConnect: (reason: Error) => void = () => undefined;
    const seizeConnectFresh = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectConnect = reject;
        })
    );

    useBrowserLocaleMock.mockReturnValue("en-US");
    useAuthMock.mockReturnValue({ setToast } as ReturnType<typeof useAuth>);
    useSeizeConnectContextMock.mockReturnValue({
      seizeConnectFresh,
      seizeConnectOpen: false,
    } as ReturnType<typeof useSeizeConnectContext>);

    render(<HomeNewcomerIntro />);

    const connectButton = screen.getByRole("button", {
      name: "Connect wallet",
    });
    await user.click(connectButton);

    expect(connectButton).toBeDisabled();
    expect(connectButton).toHaveAccessibleName("Opening wallet");
    expect(screen.getByRole("status")).toHaveTextContent("Opening wallet");

    await user.click(connectButton);
    expect(seizeConnectFresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      rejectConnect(new Error("AppKit unavailable"));
    });

    await waitFor(() => expect(connectButton).toBeEnabled());
    expect(setToast).toHaveBeenCalledWith({
      message: "Failed to open wallet connection. Please try again.",
      type: "error",
    });
  });
});
