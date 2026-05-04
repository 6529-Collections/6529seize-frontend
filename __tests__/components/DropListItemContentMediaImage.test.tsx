import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DropListItemContentMediaImage from "@/components/drops/view/item/content/media/DropListItemContentMediaImage";

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (_src: string) => _src,
  ImageScale: { AUTOx450: "AUTOx450", AUTOx1080: "AUTOx1080" },
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: () => [jest.fn(), true],
}));

beforeEach(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {
      return undefined;
    }
    disconnect() {
      return undefined;
    }
  };
});

describe("DropListItemContentMediaImage", () => {
  it("opens and closes the modal", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={1} />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
    const modalImage = screen.getByAltText("Full size drop media");
    expect(modalImage).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("does not open modal when disableModal is true", () => {
    render(<DropListItemContentMediaImage src="img" disableModal />);
    const img = screen.getByAltText("Drop media");
    fireEvent.load(img);
    fireEvent.click(img);
    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });
});

describe("DropListItemContentMediaImage retry", () => {
  it("shows error and retries manually", () => {
    render(<DropListItemContentMediaImage src="img" maxRetries={-1} />);
    expect(screen.getByText("Couldn’t load image.")).toBeInTheDocument();
  });
});
