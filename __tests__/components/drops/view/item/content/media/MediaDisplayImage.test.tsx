import React from "react";
import { fireEvent, render } from "@testing-library/react";

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: jest.fn(() => "scaled-url"),
  ImageScale: { AUTOx600: "AUTOx600" },
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: jest.fn(() => [React.createRef(), true] as any),
}));

jest.mock("next/image", () => {
  const React = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLImageElement, React.ComponentProps<"img">>(
      // eslint-disable-next-line react/display-name
      (props, ref) => <img ref={ref} {...props} />
    ),
  };
});

import MediaDisplayImage from "@/components/drops/view/item/content/media/MediaDisplayImage";

const { getScaledImageUri } = require("@/helpers/image.helpers");

describe("MediaDisplayImage", () => {
  it("shows scaled image and removes placeholder after load", () => {
    const { container, queryByRole } = render(
      <MediaDisplayImage src="test.jpg" />
    );

    expect(
      container.querySelector(".tw-bg-iron-800")
    ).toBeInTheDocument();

    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(getScaledImageUri).toHaveBeenCalledWith("test.jpg", "AUTOx600");
    expect(img.src).toContain("scaled-url");

    fireEvent.load(img);

    expect(container.querySelector(".tw-bg-iron-800")).not.toBeInTheDocument();
    expect(queryByRole("img", { name: "Media content" })).toBeInTheDocument();
  });
});
