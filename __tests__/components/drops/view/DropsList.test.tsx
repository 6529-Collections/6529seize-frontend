import DropsList from "@/components/drops/view/DropsList";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { render, screen } from "@testing-library/react";

let dropProps: any[] = [];
let lightProps: any[] = [];
let wrapperProps: any[] = [];
let highlightProps: any[] = [];

jest.mock("@/components/waves/drops/Drop", () => {
  const MockedDrop = (props: any) => {
    dropProps.push(props);
    return <div data-testid="drop" />;
  };
  return {
    __esModule: true,
    default: MockedDrop,
    DropLocation: {
      MY_STREAM: "MY_STREAM",
      WAVE: "WAVE",
    },
  };
});

jest.mock("@/components/waves/drops/LightDrop", () => ({
  __esModule: true,
  default: (props: any) => {
    lightProps.push(props);
    return <div data-testid="light" />;
  },
}));

jest.mock("@/components/waves/drops/VirtualScrollWrapper", () => ({
  __esModule: true,
  default: (props: any) => {
    wrapperProps.push(props);
    return <div data-testid="wrapper">{props.children}</div>;
  },
}));

jest.mock("@/components/drops/view/HighlightDropWrapper", () => ({
  __esModule: true,
  default: (props: any) => {
    highlightProps.push(props);
    return <div data-testid="highlight">{props.children}</div>;
  },
}));

describe("DropsList", () => {
  beforeEach(() => {
    dropProps = [];
    lightProps = [];
    wrapperProps = [];
    highlightProps = [];
  });

  it("renders full and light drops correctly", () => {
    const drops: any = [
      { stableKey: "a", serial_no: 1, type: DropSize.FULL, wave: { id: "w" } },
      { stableKey: "b", serial_no: 2, type: DropSize.LIGHT, waveId: "w" },
    ];

    render(
      <DropsList
        scrollContainerRef={{ current: null }}
        drops={drops}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onReplyClick={jest.fn()}
        serialNo={null}
        targetDropRef={null}
        parentContainerRef={undefined}
        onQuoteClick={jest.fn()}
        onDropContentClick={jest.fn()}
        dropViewDropId={null}
      />
    );

    expect(screen.getAllByTestId("wrapper")).toHaveLength(2);
    expect(screen.getAllByTestId("highlight")).toHaveLength(2);
    expect(dropProps).toHaveLength(1);
    expect(lightProps).toHaveLength(1);
  });
});
