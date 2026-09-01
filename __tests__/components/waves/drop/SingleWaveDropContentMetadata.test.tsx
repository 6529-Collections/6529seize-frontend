import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SingleWaveDropContentMetadata } from "@/components/waves/drop/SingleWaveDropContentMetadata";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ title, isOpen, children }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const mockedUseIsMobileLayoutViewport =
  useIsMobileLayoutViewport as jest.MockedFunction<
    typeof useIsMobileLayoutViewport
  >;

const metadata = [
  { data_key: "a", data_value: "1" },
  { data_key: "b", data_value: "2" },
  { data_key: "c", data_value: "3" },
] as any;

describe("SingleWaveDropContentMetadata", () => {
  beforeEach(() => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
  });

  it("toggles additional metadata", () => {
    render(<SingleWaveDropContentMetadata metadata={metadata} />);

    expect(screen.getByText("a:")).toBeInTheDocument();
    expect(screen.queryByText("c:")).toBeNull();

    fireEvent.click(screen.getByText("Show all"));
    expect(screen.getByText("c:")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("c:")).toBeNull();
  });

  it("does not reopen a mobile detail after leaving compact layout", () => {
    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    const { rerender } = render(
      <SingleWaveDropContentMetadata metadata={metadata} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "View full a metadata: 1" })
    );
    expect(screen.getByRole("dialog", { name: "a" })).toBeInTheDocument();

    mockedUseIsMobileLayoutViewport.mockReturnValue(false);
    rerender(<SingleWaveDropContentMetadata metadata={metadata} />);
    expect(screen.queryByRole("dialog", { name: "a" })).toBeNull();

    mockedUseIsMobileLayoutViewport.mockReturnValue(true);
    rerender(<SingleWaveDropContentMetadata metadata={metadata} />);
    expect(screen.queryByRole("dialog", { name: "a" })).toBeNull();
  });
});
