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
  useInView: jest.fn((): [React.RefObject<HTMLDivElement | null>, boolean] => [
    createRef<HTMLDivElement>(),
    true,
  ]),
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
    ({ fill: _fill, unoptimized: _unoptimized, alt, ...rest }, ref) =>
      React.createElement("img", { ...rest, ref, alt: alt ?? "" })
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

    const [bodyImageButton] = screen.getAllByRole("button", {
      name: "Open image preview",
    });
    if (!bodyImageButton) {
      throw new Error("Expected body image button to render");
    }

    fireEvent.click(bodyImageButton);

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

    const [, uploadedImageButton] = screen.getAllByRole("button", {
      name: "Open image preview",
    });
    if (!uploadedImageButton) {
      throw new Error("Expected uploaded image button to render");
    }

    fireEvent.click(uploadedImageButton);

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "upload.png"
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "2 / 2"
    );
  });
});
