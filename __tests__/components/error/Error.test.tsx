import { render, screen } from "@testing-library/react";

import ErrorComponent from "@/components/error/Error";

const setTitleMock = jest.fn();

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    setTitle: setTitleMock,
  }),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.toString()} {...props}>
      {children}
    </a>
  ),
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
  });

  it("sets the error page title and shows contact email", () => {
    render(<ErrorComponent />);

    expect(setTitleMock).toHaveBeenCalledWith("6529 Error");

    const supportLink = screen.getByRole("link", { name: "support@6529.io" });
    expect(supportLink).toHaveAttribute("href", "mailto:support@6529.io");
  });

  it("renders a styled link back to the home page", () => {
    render(<ErrorComponent />);

    const homeLink = screen.getByRole("link", { name: "6529 HOME" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveClass("tw-mt-5", "tw-text-lg", "tw-font-semibold");
  });
});
