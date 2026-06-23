import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");
jest.mock("@/helpers/Helpers", () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: () => true,
}));
jest.mock("@/components/lfg-slideshow/LFGSlideshow.module.scss", () => ({}));

const mockFetch = commonApiFetch as jest.Mock;

describe("LFGSlideshow", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue([{ id: "1", image: "img.png", animation: "" }]);
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.style.overflow = "";
    mockFetch.mockReset();
  });

  it("opens slideshow on button click", async () => {
    const { container } = render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const button = screen.getByRole("button", { name: "LFG: Start the Show!" });
    expect(button).toHaveClass(
      "tw-border-primary-500/60",
      "tw-bg-primary-500/10",
      "tw-text-primary-300"
    );
    expect(button).not.toHaveClass("tw-bg-primary-500");
    fireEvent.click(button);
    expect(screen.getByAltText("LFG Slide 1")).toBeInTheDocument();
    expect(container.querySelector("#lfg-slideshow")).not.toBeInTheDocument();
    expect(document.getElementById("lfg-slideshow")).toBeInTheDocument();
  });

  it("reopens on the last visible slide", async () => {
    mockFetch.mockResolvedValue([
      { id: "1", image: "first.png", animation: "" },
      { id: "2", image: "second.png", animation: "" },
    ]);

    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    jest.useFakeTimers();

    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );
    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "first.png"
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByAltText("LFG Slide 2")).toHaveAttribute(
      "src",
      "second.png"
    );

    fireEvent.keyDown(globalThis, { key: "Escape" });
    expect(screen.queryByAltText("LFG Slide 2")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(screen.getByAltText("LFG Slide 2")).toHaveAttribute(
      "src",
      "second.png"
    );
  });

  it("does not advance image timers while closed", async () => {
    mockFetch.mockResolvedValue([
      { id: "1", image: "first.png", animation: "" },
      { id: "2", image: "second.png", animation: "" },
    ]);

    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    jest.useFakeTimers();

    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );
    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "first.png"
    );

    fireEvent.keyDown(globalThis, { key: "Escape" });
    expect(screen.queryByAltText("LFG Slide 1")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "first.png"
    );
  });

  it("locks body scroll only while the slideshow is open", async () => {
    document.body.style.overflow = "scroll";

    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(globalThis, { key: "Escape" });

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("scroll");
    });
  });

  it("uses the original video and image fields", async () => {
    mockFetch.mockResolvedValue([
      {
        id: "1",
        image: "poster.png",
        image_compact: "compact-poster.png",
        animation: "video.mp4",
        animation_compact: "compact-video.mp4",
      },
    ]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "video.mp4");
    expect(video).toHaveAttribute("poster", "poster.png");
    expect(video).toHaveAttribute("controls");
    expect(video?.querySelector("track")).toBeNull();
  });

  it("uses the original image field", async () => {
    mockFetch.mockResolvedValue([
      {
        id: "1",
        image: "original.png",
        image_compact: "compact.png",
        animation: null,
      },
    ]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "original.png"
    );
  });

  it("opens when API media omits optional fields", async () => {
    mockFetch.mockResolvedValue([{ image: "img.png" }]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );
    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "img.png"
    );
  });

  it("advances when image timer completes", async () => {
    mockFetch.mockResolvedValue([
      {
        id: 1,
        image: "original.png",
        animation: null,
      },
      { id: 2, image: "next.png", animation: null },
    ]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    jest.useFakeTimers();

    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "original.png"
    );

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByAltText("LFG Slide 2")).toHaveAttribute(
      "src",
      "next.png"
    );
  });
});
