import { render } from "@testing-library/react";
import React from "react";
import DropListItemContentMediaAudio from "@/components/drops/view/item/content/media/DropListItemContentMediaAudio";

describe("DropListItemContentMediaAudio", () => {
  it("renders visible audio controls without constraining their native height", () => {
    const { container } = render(
      <DropListItemContentMediaAudio src="file.mp3" />
    );
    const audio = container.querySelector("audio") as HTMLAudioElement;
    const source = container.querySelector("source") as HTMLSourceElement;

    expect(audio).toHaveAttribute("controls");
    expect(audio).toHaveAttribute("preload", "metadata");
    expect(audio).toHaveClass("tw-w-full");
    expect(audio).not.toHaveClass("tw-max-h-10");
    expect(audio.parentElement).toHaveClass("tw-w-full");
    expect(source).toHaveAttribute("src", "file.mp3");
    expect(source).toHaveAttribute("type", "audio/mpeg");
  });
});
