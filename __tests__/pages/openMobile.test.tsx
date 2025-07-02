import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OpenMobilePage from "../../pages/open-mobile";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));

const useRouterMock = useRouter as jest.Mock;

describe("OpenMobilePage", () => {
  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = {
      href: "https://example.com",
      origin: "https://example.com",
    } as any;
    process.env.MOBILE_APP_SCHEME = "app";
    useRouterMock.mockReturnValue({
      query: { path: "/foo%20bar" },
      isReady: true,
    });
  });

  it("deep links and allows going back", async () => {
    render(<OpenMobilePage />);
    await waitFor(() => {
      expect(window.location.href).toBe("app://navigate/foo bar");
    });

    await userEvent.click(screen.getByText("Back to 6529.io"));
    expect(window.location.href).toBe("https://example.com/foo bar");
  });
});
