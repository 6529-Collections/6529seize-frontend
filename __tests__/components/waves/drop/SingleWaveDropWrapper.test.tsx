import React from "react";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { SingleWaveDropWrapper } from "@/components/waves/drop/SingleWaveDropWrapper";
import { WaveViewerModeProvider } from "@/components/waves/public/WaveViewerModeContext";

const mockUseMediaQuery = jest.fn();
const mockMarkDropOpenReady = jest.fn();

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
}));

jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  markDropOpenReady: (...args: any[]) => mockMarkDropOpenReady(...args),
}));

jest.mock("@/components/waves/drop/SingleWaveDropChat", () => ({
  SingleWaveDropChat: () => <div data-testid="single-drop-chat" />,
}));

jest.mock("@headlessui/react", () => ({
  Transition: ({ children, show = true }: any) =>
    show ? <>{children}</> : null,
}));

const drop = { id: "drop-1" } as any;
const wave = { id: "wave-1" } as any;

function renderWrapper(isPublicReadOnly = false) {
  return (
    <WaveViewerModeProvider isPublicReadOnly={isPublicReadOnly}>
      <SingleWaveDropWrapper drop={drop} wave={wave} onClose={jest.fn()}>
        <div data-testid="drop-content">Content</div>
      </SingleWaveDropWrapper>
    </WaveViewerModeProvider>
  );
}

describe("SingleWaveDropWrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(true);
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("hard resets chat when switching to public read-only", async () => {
    const view = render(renderWrapper(false));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Show chat" })
      ).toBeInTheDocument();
    });

    expect(screen.getAllByTestId("single-drop-chat")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Show chat" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Hide chat" })
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("single-drop-chat")).toHaveLength(2);
    });
    expect(document.body.style.overflow).toBe("hidden");

    view.rerender(renderWrapper(true));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /chat/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("single-drop-chat")).not.toBeInTheDocument();
    });
    expect(document.body.style.overflow).toBe("");

    view.rerender(renderWrapper(false));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Show chat" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Hide chat" })
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId("single-drop-chat")).toHaveLength(1);
    });
  });

  it("closes chat from the single-drop close event", async () => {
    render(renderWrapper(false));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Show chat" })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Show chat" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("single-drop-chat")).toHaveLength(2);
    });
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      globalThis.window.dispatchEvent(
        new CustomEvent("single-drop:close-chat")
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Show chat" })
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("single-drop-chat")).toHaveLength(1);
    });
    expect(document.body.style.overflow).toBe("");
  });
});
