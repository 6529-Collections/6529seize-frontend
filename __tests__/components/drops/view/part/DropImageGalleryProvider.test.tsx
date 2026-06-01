import React, { forwardRef, type ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DropImageGalleryProvider,
  useDropImageGallery,
} from "@/components/drops/view/part/DropImageGalleryProvider";
import type { DropImageGalleryItem } from "@/components/drops/view/part/dropImageGallery";
import useCapacitor from "@/hooks/useCapacitor";

jest.mock("@/helpers/Helpers", () => ({
  fullScreenSupported: () => true,
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
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

const galleryItems: DropImageGalleryItem[] = [
  {
    id: "body-1",
    src: "body.png",
    source: "body",
  },
  {
    id: "media-1",
    src: "upload.png",
    source: "media",
  },
];

function GalleryTrigger({
  bodyImageId = "body-1",
  uploadImageId = "media-1",
}: {
  readonly bodyImageId?: string | undefined;
  readonly uploadImageId?: string | undefined;
}) {
  const gallery = useDropImageGallery();

  return (
    <>
      <button type="button" onClick={() => gallery?.openImage(bodyImageId)}>
        Open body
      </button>
      <button type="button" onClick={() => gallery?.openImage(uploadImageId)}>
        Open upload
      </button>
    </>
  );
}

function renderGallery({
  bodyImageId,
  items = galleryItems,
  uploadImageId,
}: {
  readonly bodyImageId?: string | undefined;
  readonly items?: DropImageGalleryItem[] | undefined;
  readonly uploadImageId?: string | undefined;
} = {}) {
  return render(
    <DropImageGalleryProvider items={items}>
      <GalleryTrigger bodyImageId={bodyImageId} uploadImageId={uploadImageId} />
    </DropImageGalleryProvider>
  );
}

beforeEach(() => {
  (useCapacitor as jest.Mock).mockClear();
  (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: false });
});

describe("DropImageGalleryProvider", () => {
  it("does not call useCapacitor before an image opens", () => {
    renderGallery();

    expect(useCapacitor).not.toHaveBeenCalled();
  });

  it("calls useCapacitor after an image opens", () => {
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));

    expect(useCapacitor).toHaveBeenCalled();
  });

  it("switches images with next and previous buttons", () => {
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "body.png"
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "1 / 2"
    );
    expect(
      screen.getByRole("button", { name: "Previous image" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next image" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Next image" }));

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "upload.png"
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "2 / 2"
    );
    expect(
      screen.getByRole("button", { name: "Previous image" })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next image" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "body.png"
    );
  });

  it("switches images with arrow keys", async () => {
    const user = userEvent.setup();
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "upload.png"
    );

    await user.keyboard("{ArrowLeft}");

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "body.png"
    );
  });

  it("hides gallery controls for one image", () => {
    renderGallery({ items: [galleryItems[0]!] });

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));

    expect(
      screen.queryByRole("button", { name: "Previous image" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next image" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("image-gallery-counter")
    ).not.toBeInTheDocument();
  });

  it("closes with escape and backdrop", async () => {
    const user = userEvent.setup();
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));
    await user.keyboard("{Escape}");

    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));
    fireEvent.click(screen.getByTestId("modal-backdrop"));

    expect(
      screen.queryByAltText("Full size drop media")
    ).not.toBeInTheDocument();
  });

  it("hides fullscreen in Capacitor", () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: true });
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));

    expect(
      screen.queryByRole("button", { name: "Full screen" })
    ).not.toBeInTheDocument();
  });

  it("opens duplicate image URLs by the clicked item id", () => {
    const duplicateItems: DropImageGalleryItem[] = [
      {
        id: "duplicate-1",
        src: "duplicate.png",
        source: "media",
      },
      {
        id: "duplicate-2",
        src: "duplicate.png",
        source: "media",
      },
    ];

    renderGallery({
      bodyImageId: "duplicate-2",
      items: duplicateItems,
    });

    fireEvent.click(screen.getByRole("button", { name: "Open body" }));

    expect(screen.getByAltText("Full size drop media")).toHaveAttribute(
      "src",
      "duplicate.png"
    );
    expect(screen.getByTestId("image-gallery-counter")).toHaveTextContent(
      "2 / 2"
    );
  });
});
