import MessagesDesktopWithProvider from "@/components/messages/MessagesDesktop";
import WaveHeaderOptions from "@/components/waves/header/options/WaveHeaderOptions";
import type { ApiWave } from "@/generated/models/ApiWave";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

jest.mock("@/components/brain/ContentTabContext", () => ({
  ContentTabProvider: ({ children }: { readonly children: ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/components/shared/WavesMessagesWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="messages-wrapper">{children}</div>
  ),
}));

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const wave = { id: "dm-wave" } as ApiWave;

describe("MessagesDesktop", () => {
  it("provides a reusable deletion flow to message sidebar actions", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MessagesDesktopWithProvider>
          <WaveHeaderOptions wave={wave} showOwnerActions />
        </MessagesDesktopWithProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("messages-wrapper")).toBeInTheDocument();

    const openOptions = screen.getByRole("button", { name: "Open options" });
    await user.click(openOptions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("dialog", { name: "Delete wave" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Delete wave" })
    ).not.toBeInTheDocument();

    await user.click(openOptions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(
      screen.getByRole("dialog", { name: "Delete wave" })
    ).toBeInTheDocument();
  });
});
