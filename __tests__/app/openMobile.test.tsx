import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OpenMobilePage from "@/app/open-mobile/page";
import { useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const useSearchParamsMock = useSearchParams as jest.Mock;

describe("OpenMobilePage", () => {
  beforeEach(() => {
    delete (window as any).location;
    (window as any).location = {
      href: "https://example.com",
      origin: "https://example.com",
    } as any;
    process.env.MOBILE_APP_SCHEME = "app";
    useSearchParamsMock.mockReturnValue(new URLSearchParams("path=%2Ffoo%20bar"));
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
