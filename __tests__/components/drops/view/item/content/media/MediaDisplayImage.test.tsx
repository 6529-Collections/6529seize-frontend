import React, { createRef, forwardRef, type ComponentProps } from "react";
import { fireEvent, render } from "@testing-library/react";

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: jest.fn(() => "scaled-url"),
  ImageScale: { AUTOx600: "AUTOx600" },
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: jest.fn(
    (): [React.RefObject<HTMLDivElement | null>, boolean] => [
      createRef<HTMLDivElement>(),
      true,
    ]
  ),
}));

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean;
  readonly unoptimized?: boolean;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: forwardRef<HTMLImageElement, MockNextImageProps>(
    // eslint-disable-next-line react/display-name
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) => (
      <img ref={ref} alt={alt ?? ""} {...rest} />
    )
  ),
}));

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

    const img = container.querySelector("img");

    if (!(img instanceof HTMLImageElement)) {
      throw new TypeError("Expected an HTMLImageElement");
    }

    expect(img).toBeInTheDocument();
    expect(getScaledImageUri).toHaveBeenCalledWith("test.jpg", "AUTOx600");
    expect(img.src).toContain("scaled-url");

    fireEvent.load(img);

    expect(container.querySelector(".tw-bg-iron-800")).not.toBeInTheDocument();
    expect(queryByRole("img", { name: "Media content" })).toBeInTheDocument();
  });
});
