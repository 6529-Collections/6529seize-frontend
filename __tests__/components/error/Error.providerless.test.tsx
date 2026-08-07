import ErrorComponent from "@/components/error/Error";
import { render, screen } from "@testing-library/react";

type MockImageProps = React.ComponentPropsWithoutRef<"img"> & {
  readonly priority?: boolean;
  readonly unoptimized?: boolean;
};

jest.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, unoptimized, ...imageProps }: MockImageProps) => {
    void priority;
    void unoptimized;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imageProps} />;
  },
}));

jest.mock("react-use", () => ({
  __esModule: true,
  useCopyToClipboard: () => [null, jest.fn()],
}));

jest.mock("framer-motion", () => ({
  __esModule: true,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: { div: "div" },
}));

describe("ErrorComponent without providers", () => {
  it("renders through the real optional title context", () => {
    const resetMock = jest.fn();
    document.title = "Existing title";

    const { container } = render(<ErrorComponent onReset={resetMock} />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome to the 6529 Page of Doom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(document.title).toBe("6529 Error");
    expect(document.head.querySelector("title")).toHaveTextContent(
      "6529 Error"
    );
    expect(container.querySelector("section title")).not.toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll("img"), (image) => image.alt)
    ).toEqual(["", ""]);
  });
});
