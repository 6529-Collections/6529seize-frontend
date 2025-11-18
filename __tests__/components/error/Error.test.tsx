import { fireEvent, render, screen } from "@testing-library/react";

import ErrorComponent from "@/components/error/Error";

const setTitleMock = jest.fn();
let mockSearchParams: URLSearchParams;

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    setTitle: setTitleMock,
  }),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: () => mockSearchParams,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ unoptimized, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="SummerGlasses" />;
  },
}));

describe("ErrorComponent", () => {
  beforeEach(() => {
    setTitleMock.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it("sets the error page title and shows contact email", () => {
    render(<ErrorComponent />);

    expect(setTitleMock).toHaveBeenCalledWith("6529 Error");

    const supportLink = screen.getByRole("link", { name: "support@6529.io" });
    expect(supportLink).toHaveAttribute("href", "mailto:support@6529.io");
  });

  it("reveals a provided stack trace when toggled", () => {
    render(<ErrorComponent stackTrace="Error: stack" />);

    const toggleButton = screen.getByRole("button", { name: /show stacktrace/i });
    fireEvent.click(toggleButton);

    expect(
      screen.getByText("Error: stack", { selector: "pre" })
    ).toBeInTheDocument();
  });

  it("uses the stack trace from the URL when no prop is provided", () => {
    mockSearchParams = new URLSearchParams("stack=FromQuery");

    render(<ErrorComponent />);

    fireEvent.click(screen.getByRole("button", { name: /show stacktrace/i }));

    expect(
      screen.getByText("FromQuery", { selector: "pre" })
    ).toBeInTheDocument();
  });
});
