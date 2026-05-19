import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LFGButton } from "@/components/lfg-slideshow/LFGSlideshow";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api");
jest.mock("@/helpers/Helpers", () => ({
  enterArtFullScreen: jest.fn(),
  fullScreenSupported: () => true,
}));
jest.mock("react-bootstrap", () => ({
  Button: (p: any) => <button onClick={p.onClick}>{p.children}</button>,
}));
jest.mock("@/components/lfg-slideshow/LFGSlideshow.module.scss", () => ({}));

const mockFetch = commonApiFetch as jest.Mock;

describe("LFGSlideshow", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue([{ id: "1", image: "img.png", animation: "" }]);
  });

  it("opens slideshow on button click", async () => {
    const { container } = render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );
    expect(screen.getByAltText("LFG Slide 1")).toBeInTheDocument();
    expect(container.querySelector("#lfg-slideshow")).not.toBeInTheDocument();
    expect(document.getElementById("lfg-slideshow")).toBeInTheDocument();
  });

  it("falls back to the image when video loading fails", async () => {
    mockFetch.mockResolvedValue([
      { id: "1", image: "fallback.png", animation: "video.mp4" },
    ]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.querySelector("track")).not.toBeInTheDocument();

    fireEvent.error(video as HTMLVideoElement);
    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "fallback.png"
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

  it("tries image variants and advances when they fail", async () => {
    mockFetch.mockResolvedValue([
      {
        id: 1,
        image: "original.png",
        image_compact: "compact.png",
        animation: null,
      },
      { id: 2, image: "next.png", animation: null },
    ]);
    render(<LFGButton contract="c" />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "LFG: Start the Show!" })
    );

    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "compact.png"
    );

    fireEvent.error(screen.getByAltText("LFG Slide 1"));
    expect(screen.getByAltText("LFG Slide 1")).toHaveAttribute(
      "src",
      "original.png"
    );

    fireEvent.error(screen.getByAltText("LFG Slide 1"));
    expect(screen.getByAltText("LFG Slide 2")).toHaveAttribute(
      "src",
      "next.png"
    );
  });
});
