import OpenMobilePage from "@/app/open-mobile/page";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({ useSearchParams: jest.fn() }));

const useSearchParamsMock = useSearchParams as jest.Mock;

describe("OpenMobilePage", () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("path=%2Ffoo-bar"));
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("deep links and allows going back", async () => {
    render(<OpenMobilePage />);
    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        "testmobile6529://navigate/foo-bar",
        "_self"
      );
    });

    await userEvent.click(screen.getByText("Back to 6529.io"));
    expect(openSpy).toHaveBeenCalledWith("http://localhost/foo-bar", "_self");
  });

  it.each([false, true])(
    "preserves route query and hash with extra whole-path encoding: %s",
    async (extraEncoding) => {
      const destination =
        "/waves/123?drop=456&search=a%26b%23c&next=%2F%2Fexample.com#drop-456";
      const path = extraEncoding
        ? encodeURIComponent(destination)
        : destination;
      useSearchParamsMock.mockReturnValue(new URLSearchParams({ path }));

      render(<OpenMobilePage />);

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith(
          `testmobile6529://navigate${destination}`,
          "_self"
        );
      });
      await userEvent.click(
        screen.getByRole("button", { name: "Back to 6529.io" })
      );
      expect(openSpy).toHaveBeenLastCalledWith(
        `http://localhost${destination}`,
        "_self"
      );
    }
  );

  it.each([
    null,
    "",
    "/bad%",
    "%E0%A4%A",
    "//example.com/path",
    "%2F%2Fexample.com/path",
    "/%2Fexample.com/path",
    "@example.com/path",
    ".example.com/path",
    "/\\example.com/path",
    "/waves/..//example.com/path",
  ])(
    "returns home without an app handoff for invalid path %j",
    async (path) => {
      useSearchParamsMock.mockReturnValue(
        new URLSearchParams(path === null ? {} : { path })
      );

      render(<OpenMobilePage />);

      expect(openSpy).not.toHaveBeenCalled();
      await userEvent.click(
        screen.getByRole("button", { name: "Back to 6529.io" })
      );
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenLastCalledWith("http://localhost/", "_self");
    }
  );

  it.each([null, "/bad%", "//example.com/path"])(
    "discards the previous valid destination when path changes to %j",
    async (path) => {
      const { rerender } = render(<OpenMobilePage />);
      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith(
          "testmobile6529://navigate/foo-bar",
          "_self"
        );
      });
      openSpy.mockClear();
      useSearchParamsMock.mockReturnValue(
        new URLSearchParams(path === null ? {} : { path })
      );

      rerender(<OpenMobilePage />);

      expect(openSpy).not.toHaveBeenCalled();
      await userEvent.click(
        screen.getByRole("button", { name: "Back to 6529.io" })
      );
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenLastCalledWith("http://localhost/", "_self");
    }
  );

  it.each([
    { userAgent: "iPhone", expected: [MOBILE_APP_IOS] },
    { userAgent: "Android", expected: [MOBILE_APP_ANDROID] },
    { userAgent: "Desktop", expected: [MOBILE_APP_IOS, MOBILE_APP_ANDROID] },
  ])("preserves store actions for $userAgent", ({ userAgent, expected }) => {
    const userAgentSpy = jest
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(userAgent);
    useSearchParamsMock.mockReturnValue(new URLSearchParams());

    try {
      render(<OpenMobilePage />);
      const links = screen.getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href"))).toEqual(expected);
      for (const link of links) {
        expect(link).toHaveAttribute("target", "_self");
      }
    } finally {
      userAgentSpy.mockRestore();
    }
  });
});
