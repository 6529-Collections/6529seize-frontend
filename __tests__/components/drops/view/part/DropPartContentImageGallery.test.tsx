import React, { createRef, forwardRef, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import DropPartContent from "@/components/drops/view/part/DropPartContent";

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    setQueryData: jest.fn(),
  }),
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    findNativeEmoji: jest.fn(),
  }),
}));

jest.mock("@/hooks/isMobileScreen", () => () => false);

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: false }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/hooks/useInView", () => ({
  useInView: jest.fn(
    (): [React.RefObject<HTMLDivElement | null>, boolean] => [
      createRef<HTMLDivElement>(),
      true,
    ]
  ),
}));

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (src: string) => src,
  ImageScale: {
    AUTOx450: "AUTOx450",
    AUTOx800: "AUTOx800",
  },
}));

type MockNextImageProps = ComponentProps<"img"> & {
  readonly fill?: boolean | undefined;
  readonly unoptimized?: boolean | undefined;
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

const baseProps = {
  mentionedUsers: [],
  mentionedGroups: [],
  mentionedWaves: [],
  referencedNfts: [],
  onQuoteClick: jest.fn(),
  currentDropId: "drop-1",
  currentPartCount: 1,
};

describe("DropPartContent image gallery", () => {
  it("opens a body image and navigates to an uploaded image", () => {
    render(
      <DropPartContent
        {...baseProps}
        partContent="![Body image](/body.png)"
        partMedias={[{ mimeType: "image/png", mediaSrc: "upload.png" }]}
      />
    );

    const [bodyImage] = screen.getAllByAltText("Drop media");
    if (!bodyImage) {
      throw new Error("Expected body image to render");
    }

    fireEvent.click(bodyImage);

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "/body.png"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "upload.png"
    );
  });

  it("opens an uploaded image at its gallery position", () => {
    render(
      <DropPartContent
        {...baseProps}
        partContent="![Body image](/body.png)"
        partMedias={[{ mimeType: "image/png", mediaSrc: "upload.png" }]}
      />
    );

    const [, uploadedImage] = screen.getAllByAltText("Drop media");
    if (!uploadedImage) {
      throw new Error("Expected uploaded image to render");
    }

    fireEvent.click(uploadedImage);

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "upload.png"
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "2 / 2"
    );
  });
});
