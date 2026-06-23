import OpenMobilePage from "@/app/open-mobile/page";
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
});
