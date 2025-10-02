import NotFound from "@/components/not-found/NotFound";
import { render, screen } from "@testing-library/react";

const setTitleMock = jest.fn();

jest.mock("next/navigation", () => ({
  __esModule: true,
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock("@/contexts/TitleContext", () => ({
  __esModule: true,
  useTitle: () => ({
    setTitle: setTitleMock,
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

describe("NotFound", () => {
  beforeEach(() => {
    setTitleMock.mockClear();
  });

  it("sets the title and renders default PAGE not found when no label", () => {
    render(<NotFound />);

    expect(setTitleMock).toHaveBeenCalledWith("404 - PAGE NOT FOUND");

    // Heading content
    expect(
      screen.getByRole("heading", { level: 3, name: "404 | PAGE NOT FOUND" })
    ).toBeInTheDocument();

    // Home link
    const homeLink = screen.getByRole("link", { name: "6529 HOME" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveClass("tw-mt-5", "tw-text-lg", "tw-font-semibold");

    // Images render
    expect(screen.getByAltText("SummerGlasses")).toBeInTheDocument();
    expect(screen.getByAltText("sgt_flushed")).toBeInTheDocument();
  });

  it("uppercases the provided label in title and heading", () => {
    render(<NotFound label="mEmE" />);

    expect(setTitleMock).toHaveBeenCalledWith("404 - MEME NOT FOUND");
    expect(
      screen.getByRole("heading", { level: 3, name: "404 | MEME NOT FOUND" })
    ).toBeInTheDocument();
  });
});
