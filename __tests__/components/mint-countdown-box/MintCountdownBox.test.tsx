import MintCountdownBox from "@/components/mint-countdown-box/MintCountdownBox";
import { render, screen } from "@testing-library/react";

// Mock DateCountdown component (robust to undefined date)
jest.mock("@/components/date-countdown/DateCountdown", () => {
  return function MockDateCountdown(props: any) {
    const time = props.date instanceof Date ? props.date.getTime() : "0";
    return (
      <div data-testid="date-countdown">
        <div data-testid="countdown-title">{props.title ?? ""}</div>
        <div data-testid="countdown-date">{time}</div>
      </div>
    );
  };
});

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink(props: any) {
    return (
      <a href={props.href} target={props.target} rel={props.rel}>
        {props.children}
      </a>
    );
  };
});

describe("MintCountdownBox (new API)", () => {
  describe("Basic Rendering", () => {
    it("renders countdown with title and converts unix seconds to ms Date", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Test Countdown", date: 1640995200 }}
          hideMintBtn
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent(
        "Test Countdown"
      );
      expect(screen.getByTestId("countdown-date")).toHaveTextContent(
        "1640995200000"
      );
    });

    it("handles epoch timestamp (0)", () => {
      render(
        <MintCountdownBox mintInfo={{ title: "Epoch", date: 0 }} hideMintBtn />
      );
      expect(screen.getByTestId("countdown-date")).toHaveTextContent("0");
    });
  });

  describe("Allowlist tooltip", () => {
    it("shows info icon with tooltip data when showAllowlistInfo is true", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "X", date: 1640995200, showAllowlistInfo: true }}
          hideMintBtn
        />
      );
      // The info icon carries these data attributes
      const infoIcon = document.querySelector(
        '[data-tooltip-id="allowlist-info"]'
      );
      expect(infoIcon).toBeInTheDocument();
    });
  });

  describe("Mint button visibility", () => {
    it("renders the Mint button when linkInfo is provided and not small and not hidden", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Minting", date: 1640995200 }}
          linkInfo={{ href: "/the-memes/mint", target: "_self" }}
        />
      );

      const button = screen.getByRole("button", { name: /mint/i });
      expect(button).toBeInTheDocument();

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/the-memes/mint");
      expect(link).toHaveAttribute("target", "_self");
      expect(link).not.toHaveAttribute("rel");
    });

    it("adds rel noopener noreferrer when target is _blank", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Minting", date: 1640995200 }}
          linkInfo={{ href: "https://external.com/mint", target: "_blank" }}
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://external.com/mint");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not render button when small is true", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Minting", date: 1640995200 }}
          linkInfo={{ href: "/x", target: "_self" }}
          small
        />
      );
      expect(
        screen.queryByRole("button", { name: /mint/i })
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("date-countdown")).toBeInTheDocument();
    });

    it("does not render button when hideMintBtn is true", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Minting", date: 1640995200 }}
          linkInfo={{ href: "/x", target: "_self" }}
          hideMintBtn
        />
      );
      expect(
        screen.queryByRole("button", { name: /mint/i })
      ).not.toBeInTheDocument();
    });

    it("renders a disabled skeleton button when mintInfo is missing", () => {
      render(<MintCountdownBox />);
      const skeletonBtn = screen.getByRole("button");
      expect(skeletonBtn).toBeDisabled();
      expect(skeletonBtn).toHaveClass("btn-block");
      expect(skeletonBtn).toHaveClass("no-wrap");
    });
  });

  describe("Finalized / Ended states", () => {
    it("shows finalized state message", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "X", date: 1640995200, isFinalized: true }}
        />
      );
      expect(screen.getByText(/Mint Phase Complete/i)).toBeInTheDocument();
      expect(screen.queryByTestId("date-countdown")).not.toBeInTheDocument();
    });

    it("shows ended state (sold out) message", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "X", date: 1640995200, isSoldOut: true }}
        />
      );
      expect(
        screen.getByText(/Mint Complete - Sold Out!/i)
      ).toBeInTheDocument();
      expect(screen.queryByTestId("date-countdown")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility basics", () => {
    it("mint button is focusable when rendered", () => {
      render(
        <MintCountdownBox
          mintInfo={{ title: "Minting", date: 1640995200 }}
          linkInfo={{ href: "/the-memes/mint", target: "_self" }}
        />
      );
      const button = screen.getByRole("button", { name: /mint/i });
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
      expect(button).not.toHaveAttribute("tabindex", "-1");
    });
  });
});
