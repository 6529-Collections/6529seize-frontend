import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContinueInBrowserNotice from "@/components/desktop/ContinueInBrowserNotice";
import { continueInBrowser } from "@/services/desktop/continueInBrowser";

jest.mock("@/services/desktop/continueInBrowser", () => ({
  continueInBrowser: jest.fn(() => true),
  getWebsiteHost: () => "6529.io",
}));

describe("ContinueInBrowserNotice", () => {
  it("explains and opens the page on the website", async () => {
    render(<ContinueInBrowserNotice />);
    expect(
      screen.getByText(
        /does not send this kind of signature.*Continue on 6529\.io/
      )
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Continue in your browser" })
    );
    expect(continueInBrowser).toHaveBeenCalledTimes(1);
  });

  it("names a transaction when it replaces one", () => {
    render(<ContinueInBrowserNotice kind="transaction" />);
    expect(
      screen.getByText(
        /does not send this transaction.*Continue on 6529\.io.*sends it directly/
      )
    ).toBeInTheDocument();
  });

  it("says so when the browser does not open", async () => {
    jest.mocked(continueInBrowser).mockReturnValueOnce(false);
    render(<ContinueInBrowserNotice kind="transaction" />);
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    await userEvent.click(
      screen.getByRole("button", { name: "Continue in your browser" })
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your browser did not open. Open 6529.io in your browser yourself."
    );
  });
});
