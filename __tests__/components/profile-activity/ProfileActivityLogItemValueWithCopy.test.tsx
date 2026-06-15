import { fireEvent, render, screen } from "@testing-library/react";
import { useCopyToClipboard } from "react-use";
import ProfileActivityLogItemValueWithCopy from "@/components/profile-activity/list/items/utils/ProfileActivityLogItemValueWithCopy";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import { createInteractionMode } from "@/__tests__/utils/interactionMode";

jest.mock("react-use", () => ({ useCopyToClipboard: jest.fn() }));
jest.mock("@/src/interaction/useInteractionMode");

const useInteractionModeMock = useInteractionMode as jest.Mock;

function setInteractionMode(
  overrides: Parameters<typeof createInteractionMode>[0] = {}
) {
  useInteractionModeMock.mockReturnValue(createInteractionMode(overrides));
}

describe("ProfileActivityLogItemValueWithCopy", () => {
  const copy = jest.fn();
  beforeEach(() => {
    (useCopyToClipboard as jest.Mock).mockReturnValue([null, copy]);
    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      enableHoverUI: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("copies value on click and shows feedback", async () => {
    render(<ProfileActivityLogItemValueWithCopy title="Address" value="0x1" />);

    // Initially should show the title
    expect(screen.getByText("Address")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button"));
    expect(copy).toHaveBeenCalledWith("0x1");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("ignores browser touch primitives when centralized mode is hover-only", () => {
    const touchStartDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "ontouchstart"
    );
    const maxTouchPointsDescriptor = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      "maxTouchPoints"
    );
    const globalWithTouchStart = globalThis as typeof globalThis & {
      ontouchstart?: unknown;
    };
    const navigatorWithTouchPoints = globalThis.navigator as Navigator & {
      maxTouchPoints?: number;
    };

    Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
      value: 5,
      configurable: true,
    });
    Object.defineProperty(globalThis, "ontouchstart", {
      value: jest.fn(),
      configurable: true,
    });

    try {
      render(
        <ProfileActivityLogItemValueWithCopy title="Address" value="0x1" />
      );

      const copyButton = screen.getByRole("button");

      expect(copyButton).toHaveClass("tw-opacity-0");
      expect(copyButton).toHaveClass("group-hover:tw-opacity-100");
      expect(copyButton).not.toHaveClass("tw-block");
    } finally {
      if (maxTouchPointsDescriptor) {
        Object.defineProperty(
          globalThis.navigator,
          "maxTouchPoints",
          maxTouchPointsDescriptor
        );
      } else {
        delete navigatorWithTouchPoints.maxTouchPoints;
      }

      if (touchStartDescriptor) {
        Object.defineProperty(globalThis, "ontouchstart", touchStartDescriptor);
      } else {
        delete globalWithTouchStart.ontouchstart;
      }
    }
  });

  it("shows copy affordance when centralized touch activation is active", () => {
    setInteractionMode({
      canHover: true,
      hasFinePointer: true,
      hasCoarsePointer: true,
      lastPointerType: "touch",
      enableHoverUI: true,
      enableLongPress: true,
    });

    render(<ProfileActivityLogItemValueWithCopy title="Address" value="0x1" />);

    expect(screen.getByRole("button")).toHaveClass("tw-block");
  });
});
